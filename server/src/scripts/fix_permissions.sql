-- Виправлення дозволів для role_accountant
-- Цей скрипт додає відсутні дозволи для бухгалтерів

SET client_encoding = 'UTF8';

-- Додати дозвіл на перегляд рейтингу авторів для бухгалтерів
GRANT SELECT ON public.view_author_ratings TO role_accountant;

-- Підтвердити зміни
DO $$
BEGIN
    RAISE NOTICE '✅ Дозволи для role_accountant оновлено успішно!';
    RAISE NOTICE '   - Додано доступ до view_author_ratings';
END $$;
