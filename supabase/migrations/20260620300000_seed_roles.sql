-- Seed Student User
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, is_sso_user,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  phone_change, phone_change_token, email_change_token_current, reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'e9fc7e46-a8a5-4fd4-8ba7-af485013e6fb', 'authenticated', 'authenticated', 'student@test.com', crypt('password', gen_salt('bf')), NOW(),
  '{"provider": "email", "providers": ["email"]}', '{"role": "student"}', FALSE, NOW(), NOW(), 'f',
  '', '', '', '', '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

-- Seed Teacher User
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, is_sso_user,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  phone_change, phone_change_token, email_change_token_current, reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'e9fc7e46-a8a5-4fd4-8ba7-af485013e6fc', 'authenticated', 'authenticated', 'teacher@test.com', crypt('password', gen_salt('bf')), NOW(),
  '{"provider": "email", "providers": ["email"]}', '{"role": "teacher"}', FALSE, NOW(), NOW(), 'f',
  '', '', '', '', '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

-- Seed Admin User
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, is_sso_user,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  phone_change, phone_change_token, email_change_token_current, reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'e9fc7e46-a8a5-4fd4-8ba7-af485013e6fd', 'authenticated', 'authenticated', 'admin@test.com', crypt('password', gen_salt('bf')), NOW(),
  '{"provider": "email", "providers": ["email"]}', '{"role": "admin"}', FALSE, NOW(), NOW(), 'f',
  '', '', '', '', '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

-- Update profiles table has_onboarded to true for seed users so they bypass setup
UPDATE profiles SET has_onboarded = TRUE WHERE user_id IN ('e9fc7e46-a8a5-4fd4-8ba7-af485013e6fb', 'e9fc7e46-a8a5-4fd4-8ba7-af485013e6fc', 'e9fc7e46-a8a5-4fd4-8ba7-af485013e6fd');
