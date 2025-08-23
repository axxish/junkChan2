CREATE OR REPLACE FUNCTION public.get_thread_by_id(p_post_id bigint, p_replies_limit integer, p_replies_offset integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$DECLARE
  thread_data JSON;
BEGIN
  -- This complex query builds a nested JSON object in a single database round-trip.
  SELECT
    -- Use json_build_object to construct the final JSON structure.
    pg_catalog.json_build_object(
      'op', (SELECT pg_catalog.to_json(op) FROM (SELECT id, board_id,thread_id,board_post_id,user_id,image_path,comment,created_at, subject FROM public.posts WHERE id = p_post_id) op),
      'replies', (
        SELECT COALESCE(pg_catalog.json_agg(r), '[]'::json)
        FROM (
          SELECT
            p.id, p.board_id, p.thread_id, p.board_post_id, p.user_id, p.image_path, p.comment, p.created_at,
            -- For each reply, create a JSON array of posts that replied TO IT.
            (
              SELECT COALESCE(pg_catalog.json_agg(m.source_post_id), '[]'::json)
              FROM public.post_mentions m
              WHERE m.target_post_id = p.id
            ) as backlinks
          FROM
            public.posts p
          WHERE
            p.thread_id = p_post_id AND p.id != p_post_id -- Find replies in this thread
          ORDER BY
            p.created_at ASC
          LIMIT p_replies_limit
          OFFSET p_replies_offset
        ) r
      ),
      'totalReplyCount', (SELECT count(*) FROM public.posts WHERE thread_id = p_post_id AND id != p_post_id),
    'users', (
        -- The outer select simply gets the result from the inner one.
        SELECT * FROM (
          -- We do the aggregation INSIDE the subquery where 'prof' is defined.
          SELECT COALESCE(pg_catalog.json_object_agg(prof.id, prof), '{}'::json)
          FROM (
              SELECT p_inner.id, p_inner.username, p_inner.avatar_url, p_inner.role
              FROM public.profiles p_inner
              WHERE p_inner.id IN (
                -- This subquery finds all unique user IDs in the entire thread
                SELECT DISTINCT user_id FROM public.posts
                WHERE (thread_id = p_post_id OR id = p_post_id) AND user_id IS NOT NULL
              )
          ) prof
        ) u
    )

    )
  INTO thread_data;

  RETURN thread_data;
END;$function$
;
