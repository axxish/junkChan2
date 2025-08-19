drop function if exists "public"."delete_post_storage_object"();

alter table "public"."posts" add constraint "subject_required_for_op_check" CHECK (((thread_id <> id) OR (subject IS NOT NULL))) not valid;

alter table "public"."posts" validate constraint "subject_required_for_op_check";


