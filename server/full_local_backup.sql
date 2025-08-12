

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_board_post_sequence"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  seq_name_qualified TEXT;
BEGIN
  -- Construct the fully qualified sequence name to ensure it's created in 'public'.
  seq_name_qualified := 'public.board_' || NEW.id || '_post_id_seq';

  -- Create the sequence.
  EXECUTE format('CREATE SEQUENCE %s;', seq_name_qualified);

  -- Grant USAGE permission to the admin role used by the API.
  EXECUTE format('GRANT USAGE ON SEQUENCE %s TO supabase_admin;', seq_name_qualified);
  
  -- Notify PostgREST to reload its schema cache, solving the caching issue.
  PERFORM pg_notify('pgrst', 'reload schema');
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_board_post_sequence"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_post"("p_board_slug" "text" DEFAULT NULL::"text", "p_comment" "text" DEFAULT NULL::"text", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_poster_ip" "inet" DEFAULT NULL::"inet", "p_thread_id" bigint DEFAULT NULL::bigint, "p_image_path" "text" DEFAULT NULL::"text") RETURNS TABLE("j" json)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  target_board_id BIGINT;
  new_post_id BIGINT;
  new_board_post_id INT;
  seq_name TEXT;
  mention_id BIGINT;
BEGIN
  -- 1. Determine the board_id.
  IF p_thread_id IS NOT NULL THEN
    -- This is a reply; get the board_id from the parent thread.
    SELECT board_id INTO target_board_id FROM public.posts WHERE id = p_thread_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Parent thread with id % not found', p_thread_id; END IF;
  ELSE
    -- This is a new thread (OP); look up the board_id from the slug.
    IF p_board_slug IS NULL THEN RAISE EXCEPTION 'boardSlug is required for new threads.'; END IF;
    SELECT id INTO target_board_id FROM public.boards WHERE slug = p_board_slug;
    IF NOT FOUND THEN RAISE EXCEPTION 'Board with slug % not found', p_board_slug; END IF;
    -- An OP must have an image.
    IF p_image_path IS NULL THEN RAISE EXCEPTION 'An image is required to start a new thread.'; END IF;
  END IF;

  -- 2. Get the next post number from the correct board's sequence.
  seq_name := 'public.board_' || target_board_id || '_post_id_seq';
  new_board_post_id := pg_catalog.nextval(seq_name);

  -- 3. Insert the new post record.
  INSERT INTO public.posts (board_id, thread_id, image_path, comment, user_id, poster_ip, board_post_id)
  VALUES (target_board_id, p_thread_id, p_image_path, p_comment, p_user_id, p_poster_ip, new_board_post_id)
  RETURNING id INTO new_post_id;

  -- 4. If it's a new thread (OP), set its thread_id to its own id.
  IF p_thread_id IS NULL THEN
    UPDATE public.posts SET thread_id = new_post_id WHERE id = new_post_id;
  END IF;
  
  -- 5. Parse comment for mentions and insert into post_mentions.
  -- Only run if there's a comment to parse.
  IF p_comment IS NOT NULL THEN
    FOR mention_id IN
      SELECT (pg_catalog.regexp_matches(p_comment, '>>(\d+)', 'g'))[1]::bigint
    LOOP
      INSERT INTO public.post_mentions (source_post_id, target_post_id)
      VALUES (new_post_id, mention_id)
      ON CONFLICT (source_post_id, target_post_id) DO NOTHING;
    END LOOP;
  END IF;

  -- 6. Return the full post data as a JSON object.
  RETURN QUERY
    SELECT pg_catalog.to_json(p) FROM public.posts p WHERE p.id = new_post_id;
END;
$$;


ALTER FUNCTION "public"."create_post"("p_board_slug" "text", "p_comment" "text", "p_user_id" "uuid", "p_poster_ip" "inet", "p_thread_id" bigint, "p_image_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_post_storage_object"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  -- Check if the post being deleted actually has an image.
  IF OLD.image_path IS NOT NULL THEN
    -- Delete the object from the 'posts' bucket in Supabase Storage.
    PERFORM storage.delete_object('posts', OLD.image_path);
  END IF;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."delete_post_storage_object"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_thread_by_id"("p_post_id" bigint, "p_replies_limit" integer, "p_replies_offset" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  thread_data JSON;
BEGIN
  -- This complex query builds a nested JSON object in a single database round-trip.
  SELECT
    -- Use json_build_object to construct the final JSON structure.
    pg_catalog.json_build_object(
      'op', (SELECT pg_catalog.to_json(op) FROM (SELECT * FROM public.posts WHERE id = p_post_id) op),
      'replies', (
        SELECT COALESCE(pg_catalog.json_agg(r), '[]'::json)
        FROM (
          SELECT
            p.*,
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
      'totalReplyCount', (SELECT count(*) FROM public.posts WHERE thread_id = p_post_id AND id != p_post_id)
    )
  INTO thread_data;

  RETURN thread_data;
END;
$$;


ALTER FUNCTION "public"."get_thread_by_id"("p_post_id" bigint, "p_replies_limit" integer, "p_replies_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_threads_by_board_slug"("p_board_slug" "text", "p_page_limit" integer, "p_page_offset" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  target_board_id BIGINT;
  total_thread_count INT;
  threads_json JSON;
BEGIN
  -- 1. Find the board's ID from its slug.
  SELECT id INTO target_board_id FROM public.boards WHERE slug = p_board_slug;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Board with slug % not found', p_board_slug;
  END IF;

  -- 2. Get the paginated list of threads and their reply counts.
  SELECT json_agg(t) INTO threads_json FROM (
    SELECT
      p.*,
      -- Subquery to count all replies for this thread.
      (SELECT count(*) FROM public.posts r WHERE r.thread_id = p.id AND r.id != p.id) as reply_count,
      -- Subquery to count only replies that have an image.
      (SELECT count(*) FROM public.posts r WHERE r.thread_id = p.id AND r.id != p.id AND r.image_path IS NOT NULL) as image_reply_count
    FROM
      public.posts p
    WHERE
      p.board_id = target_board_id AND p.thread_id = p.id -- This condition finds OPs only
    ORDER BY
      p.created_at DESC -- Change this later for "bump order"
    LIMIT p_page_limit
    OFFSET p_page_offset
  ) t;
  
  -- 3. Get the total count of all threads on this board for pagination.
  SELECT count(*) INTO total_thread_count
  FROM public.posts p
  WHERE p.board_id = target_board_id AND p.thread_id = p.id;

  -- 4. Combine the results into a single JSON object.
  RETURN json_build_object(
    'threads', COALESCE(threads_json, '[]'::json),
    'totalCount', total_thread_count
  );
END;
$$;


ALTER FUNCTION "public"."get_threads_by_board_slug"("p_board_slug" "text", "p_page_limit" integer, "p_page_offset" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."action_logs" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "ip_address" "inet",
    "action_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."action_logs" OWNER TO "postgres";


ALTER TABLE "public"."action_logs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."action_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."app_config" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL
);


ALTER TABLE "public"."app_config" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."board_1_post_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."board_1_post_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."boards" (
    "id" bigint NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."boards" OWNER TO "postgres";


ALTER TABLE "public"."boards" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."boards_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."post_mentions" (
    "source_post_id" bigint NOT NULL,
    "target_post_id" bigint NOT NULL
);


ALTER TABLE "public"."post_mentions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" bigint NOT NULL,
    "board_id" bigint NOT NULL,
    "thread_id" bigint,
    "user_id" "uuid",
    "image_path" "text",
    "comment" "text",
    "poster_ip" "inet",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "board_post_id" integer
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


ALTER TABLE "public"."posts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."posts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'USER'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."action_logs"
    ADD CONSTRAINT "action_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_config"
    ADD CONSTRAINT "app_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."boards"
    ADD CONSTRAINT "boards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."boards"
    ADD CONSTRAINT "boards_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."post_mentions"
    ADD CONSTRAINT "post_mentions_pkey" PRIMARY KEY ("source_post_id", "target_post_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_board_id_board_post_id_key" UNIQUE ("board_id", "board_post_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



CREATE INDEX "idx_action_logs_ip_address_action_type" ON "public"."action_logs" USING "btree" ("ip_address", "action_type");



CREATE INDEX "idx_action_logs_user_id_action_type" ON "public"."action_logs" USING "btree" ("user_id", "action_type");



CREATE INDEX "idx_post_mentions_target_post_id" ON "public"."post_mentions" USING "btree" ("target_post_id");



CREATE INDEX "idx_posts_thread_id" ON "public"."posts" USING "btree" ("thread_id");



CREATE UNIQUE INDEX "posts_unique_non_null_image_path" ON "public"."posts" USING "btree" ("image_path") WHERE ("image_path" IS NOT NULL);



CREATE OR REPLACE TRIGGER "before_delete_post" BEFORE DELETE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."delete_post_storage_object"();



CREATE OR REPLACE TRIGGER "on_board_creation" AFTER INSERT ON "public"."boards" FOR EACH ROW EXECUTE FUNCTION "public"."create_board_post_sequence"();



ALTER TABLE ONLY "public"."action_logs"
    ADD CONSTRAINT "action_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_mentions"
    ADD CONSTRAINT "post_mentions_source_post_id_fkey" FOREIGN KEY ("source_post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_mentions"
    ADD CONSTRAINT "post_mentions_target_post_id_fkey" FOREIGN KEY ("target_post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



ALTER TABLE "public"."action_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."create_board_post_sequence"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_board_post_sequence"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_board_post_sequence"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_post"("p_board_slug" "text", "p_comment" "text", "p_user_id" "uuid", "p_poster_ip" "inet", "p_thread_id" bigint, "p_image_path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_post"("p_board_slug" "text", "p_comment" "text", "p_user_id" "uuid", "p_poster_ip" "inet", "p_thread_id" bigint, "p_image_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_post"("p_board_slug" "text", "p_comment" "text", "p_user_id" "uuid", "p_poster_ip" "inet", "p_thread_id" bigint, "p_image_path" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_post"("p_board_slug" "text", "p_comment" "text", "p_user_id" "uuid", "p_poster_ip" "inet", "p_thread_id" bigint, "p_image_path" "text") TO "supabase_admin";



GRANT ALL ON FUNCTION "public"."delete_post_storage_object"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_post_storage_object"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_post_storage_object"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_thread_by_id"("p_post_id" bigint, "p_replies_limit" integer, "p_replies_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_thread_by_id"("p_post_id" bigint, "p_replies_limit" integer, "p_replies_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_thread_by_id"("p_post_id" bigint, "p_replies_limit" integer, "p_replies_offset" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."get_thread_by_id"("p_post_id" bigint, "p_replies_limit" integer, "p_replies_offset" integer) TO "supabase_admin";



GRANT ALL ON FUNCTION "public"."get_threads_by_board_slug"("p_board_slug" "text", "p_page_limit" integer, "p_page_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_threads_by_board_slug"("p_board_slug" "text", "p_page_limit" integer, "p_page_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_threads_by_board_slug"("p_board_slug" "text", "p_page_limit" integer, "p_page_offset" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."get_threads_by_board_slug"("p_board_slug" "text", "p_page_limit" integer, "p_page_offset" integer) TO "supabase_admin";


















GRANT ALL ON TABLE "public"."action_logs" TO "anon";
GRANT ALL ON TABLE "public"."action_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."action_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."action_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."action_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."action_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."app_config" TO "anon";
GRANT ALL ON TABLE "public"."app_config" TO "authenticated";
GRANT ALL ON TABLE "public"."app_config" TO "service_role";



GRANT ALL ON SEQUENCE "public"."board_1_post_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."board_1_post_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."board_1_post_id_seq" TO "service_role";
GRANT USAGE ON SEQUENCE "public"."board_1_post_id_seq" TO "supabase_admin";



GRANT ALL ON TABLE "public"."boards" TO "anon";
GRANT ALL ON TABLE "public"."boards" TO "authenticated";
GRANT ALL ON TABLE "public"."boards" TO "service_role";



GRANT ALL ON SEQUENCE "public"."boards_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."boards_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."boards_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."post_mentions" TO "anon";
GRANT ALL ON TABLE "public"."post_mentions" TO "authenticated";
GRANT ALL ON TABLE "public"."post_mentions" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
