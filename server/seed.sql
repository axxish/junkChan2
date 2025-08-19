INSERT INTO public.app_config (key, value)
VALUES
    ('avatar_upload_limit_count', '5'),
    ('avatar_upload_limit_minutes', '10'),
    ('anon_post_upload_limit_count', '10'),
    ('anon_post_upload_limit_minutes', '60'),
    ('anon_create_post_limit_count', '10'),
    ('anon_create_post_limit_minutes', '60'),
    ('auth_create_post_limit_count', '30'),
    ('auth_create_post_limit_minutes', '60')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;