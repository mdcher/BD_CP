-- Встановлюємо правильний bcrypt hash для пароля "password123"
UPDATE public.users SET password_hash = '$2a$10$RVEwku4./tis/XHylpYf1e6i0x/c6fdQjYrpqnbLUCGkfuJBoBnWO';
