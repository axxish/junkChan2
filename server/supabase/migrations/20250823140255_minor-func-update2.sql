
CREATE OR REPLACE FUNCTION public.get_threads_by_board_slug2(p_board_slug text, p_page_limit integer, p_page_offset integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  target_board_id BIGINT;
  total_thread_count INT;
  threads_json JSON;
BEGIN
  -- 1. Find the board's ID from its slug.
  SELECT id INTO target_board_id FROM public.boards WHERE slug = p_board_slug;
  IF NOT FOUND THEN RAISE EXCEPTION 'Board with slug % not found', p_board_slug; END IF;

  -- 2. Get the paginated list of threads and their associated data.
  SELECT pg_catalog.json_agg(t) INTO threads_json FROM (
    SELECT
      (SELECT pg_catalog.to_json(op) FROM (SELECT p.id, p.board_id, p.thread_id, p.board_post_id, p.user_id, p.image_path, p.comment, p.created_at, p.subject) op) as op,
      (SELECT count(*) FROM public.posts r WHERE r.thread_id = p.id AND r.id != p.id) as reply_count,
      (SELECT count(*) FROM public.posts r WHERE r.thread_id = p.id AND r.id != p.id AND r.image_path IS NOT NULL) as image_reply_count,
      
      -- Subquery for the latest 3 replies (unchanged).
      (
        SELECT COALESCE(pg_catalog.json_agg(preview_replies), '[]'::json)
        FROM (
          SELECT r.id, r.board_post_id, r.comment, r.created_at, r.image_path, r.user_id
          FROM public.posts r
          WHERE r.thread_id = p.id AND r.id != p.id
          ORDER BY r.created_at DESC
          LIMIT 3
        ) preview_replies
      ) as latest_replies,

      -- THE CORRECTED USERS SUBQUERY --
      -- THE KEY CHANGE: Use json_object_agg to create a map instead of a list.
      (
        SELECT COALESCE(pg_catalog.json_object_agg(prof.id, prof), '{}'::json)
        FROM (
          SELECT prof.id, prof.username, prof.avatar_url, prof.role
          FROM public.profiles prof
          WHERE prof.id IN (
            SELECT DISTINCT participant_user_id FROM (
              SELECT p.user_id as participant_user_id
              UNION
              SELECT lr.user_id as participant_user_id FROM (SELECT r.user_id FROM public.posts r WHERE r.thread_id = p.id AND r.id != p.id ORDER BY r.created_at DESC LIMIT 3) as lr
            ) as thread_participants
            WHERE participant_user_id IS NOT NULL
          )
        ) prof
      ) as users

    FROM public.posts p
    WHERE p.board_id = target_board_id AND p.thread_id = p.id -- Find OPs only
    ORDER BY p.created_at DESC
    LIMIT p_page_limit
    OFFSET p_page_offset
  ) t;
  
  -- 3. Get the total thread count.
  SELECT count(*) INTO total_thread_count FROM public.posts p WHERE p.board_id = target_board_id AND p.thread_id = p.id;

  -- 4. Combine results into a single JSON object.
  RETURN pg_catalog.json_build_object(
    'threads', COALESCE(threads_json, '[]'::json),
    'totalCount', total_thread_count
  );
END;
$function$
;

