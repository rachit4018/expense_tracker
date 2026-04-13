-- Insert data safely ignoring conflicts
INSERT INTO public.expense_tracker_customuser 
(id, password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined, college, semester, default_payment_methods, is_verified, jwt_token, verification_code, verification_code_created_at)
VALUES 
(11, 'pbkdf2_sha256$870000$hG9zs7XXCZq4BzjoynqBw7$S7MU3MdjLnTCANMsuKbfl7GxeDpnYM4nHYyv28wnfi0=', NULL, false, 'newuser', '', '', 'new@example.com', false, true, '2025-08-07 23:27:16.271745-04', 'Test College', 3, 'Cash', false, NULL, '811014', '2025-08-07 23:28:46.296751-04'),
(16, 'pbkdf2_sha256$870000$tPfay4IOhzM1VxR4A5tyjR$8V6SphTtjDKiEfPmKCjYZz2PFR2FkXCWIB0NcPA+WJ0=', '2026-04-13 00:47:00.956928-04', true, 'admin', '', '', 'pandyarachit1525@gmail.com', true, true, '2026-04-13 00:44:32.767574-04', 'Centennial College', 3, 'Net Banking', true, NULL, NULL, NULL),
(12, 'pbkdf2_sha256$870000$RgySJZNoWVFFUycxm7imVV$voB4sSGPVr/wjY52GysJfGYm/RPEDNqMlpKnA6JdzmI=', '2025-08-16 00:31:36.069674-04', false, 'newuser1', '', '', 'new1@example.com', false, true, '2025-08-07 23:38:03.93527-04', 'Test College', 3, 'Cash', true, NULL, '368182', '2025-08-07 23:38:42.982712-04')
ON CONFLICT (id) DO NOTHING;

-- Update sequence
SELECT pg_catalog.setval('public.expense_tracker_customuser_id_seq', 16, true);