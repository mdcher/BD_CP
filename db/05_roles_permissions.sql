SET client_encoding = 'UTF8';

DO $$
BEGIN
    -- Гість (неавторизований користувач)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_guest') THEN
        CREATE ROLE role_guest;
        RAISE NOTICE 'Роль role_guest створено';
    END IF;

    -- Читач (звичайний користувач)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_reader') THEN
        CREATE ROLE role_reader;
        RAISE NOTICE 'Роль role_reader створено';
    END IF;

    -- Бібліотекар
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_librarian') THEN
        CREATE ROLE role_librarian;
        RAISE NOTICE 'Роль role_librarian створено';
    END IF;

    -- Бухгалтер
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_accountant') THEN
        CREATE ROLE role_accountant;
        RAISE NOTICE 'Роль role_accountant створено';
    END IF;

    -- Адміністратор
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_admin') THEN
        CREATE ROLE role_admin;
        RAISE NOTICE 'Роль role_admin створено';
    END IF;
END $$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_login_select ON public.users
    FOR SELECT
    USING (true);

CREATE POLICY admin_lib_view_all_users ON public.users
    FOR ALL
    TO role_librarian, role_admin
    USING (true)
    WITH CHECK (true);

CREATE POLICY reader_view_self ON public.users
    FOR SELECT
    TO role_reader
    USING (userid = NULLIF(current_setting('app.current_user_id', true), '')::integer);

CREATE POLICY staff_view_all_loans ON public.loans
    FOR ALL
    TO role_librarian, role_admin
    USING (true)
    WITH CHECK (true);

CREATE POLICY reader_view_own_loans ON public.loans
    FOR SELECT
    TO role_reader
    USING (userid = NULLIF(current_setting('app.current_user_id', true), '')::integer);

CREATE POLICY staff_view_all_fines ON public.fines
    FOR ALL
    TO role_librarian, role_accountant, role_admin
    USING (true)
    WITH CHECK (true);

CREATE POLICY reader_view_own_fines ON public.fines
    FOR SELECT
    TO role_reader
    USING (
        loanid IN (
            SELECT loanid FROM public.loans
            WHERE userid = NULLIF(current_setting('app.current_user_id', true), '')::integer
        )
    );

CREATE POLICY staff_view_all_res ON public.reservations
    FOR ALL
    TO role_librarian, role_admin
    USING (true)
    WITH CHECK (true);

CREATE POLICY reader_view_own_res ON public.reservations
    FOR SELECT
    TO role_reader
    USING (userid = NULLIF(current_setting('app.current_user_id', true), '')::integer);

CREATE POLICY reader_create_own_res ON public.reservations
    FOR INSERT
    TO role_reader
    WITH CHECK (userid = NULLIF(current_setting('app.current_user_id', true), '')::integer);

CREATE POLICY reader_update_own_res ON public.reservations
    FOR UPDATE
    TO role_reader
    USING (userid = NULLIF(current_setting('app.current_user_id', true), '')::integer)
    WITH CHECK (userid = NULLIF(current_setting('app.current_user_id', true), '')::integer);

GRANT USAGE ON SCHEMA public TO role_guest, role_reader, role_librarian, role_accountant, role_admin;

GRANT SELECT ON public.books TO role_guest;
GRANT SELECT ON public.authors TO role_guest;
GRANT SELECT ON public.genres TO role_guest;
GRANT SELECT ON public.book_authors TO role_guest;
GRANT SELECT ON public.book_genres TO role_guest;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO role_reader;
GRANT INSERT, UPDATE ON public.reservations TO role_reader;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO role_librarian;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authors TO role_librarian;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.genres TO role_librarian;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_authors TO role_librarian;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_genres TO role_librarian;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO role_librarian;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans TO role_librarian;
GRANT SELECT, INSERT, UPDATE ON public.fines TO role_librarian;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO role_librarian;
GRANT SELECT ON public.employees TO role_librarian;
GRANT SELECT ON public.violation_types TO role_librarian;
GRANT SELECT ON public.orders TO role_librarian;
GRANT SELECT ON public.order_items TO role_librarian;
GRANT SELECT ON public.price_list TO role_librarian;

GRANT SELECT ON public.users TO role_accountant;
GRANT SELECT ON public.loans TO role_accountant;
GRANT SELECT, INSERT, UPDATE ON public.fines TO role_accountant;
GRANT SELECT ON public.violation_types TO role_accountant;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO role_accountant;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO role_accountant;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO role_accountant;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_list TO role_accountant;
GRANT SELECT ON public.books TO role_accountant;
GRANT SELECT ON public.reservations TO role_accountant;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO role_admin;

GRANT USAGE, SELECT ON public.reservations_reservationid_seq TO role_reader;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO role_librarian;

GRANT USAGE, SELECT ON public.fines_fineid_seq TO role_accountant;
GRANT USAGE, SELECT ON public.employees_employeeid_seq TO role_accountant;
GRANT USAGE, SELECT ON public.orders_orderid_seq TO role_accountant;
GRANT USAGE, SELECT ON public.price_list_pricelistid_seq TO role_accountant;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO role_admin;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
        GRANT role_guest TO postgres;
        GRANT role_reader TO postgres;
        GRANT role_librarian TO postgres;
        GRANT role_accountant TO postgres;
        GRANT role_admin TO postgres;
        RAISE NOTICE 'Ролі надано користувачу postgres';
    END IF;
END $$;

COMMENT ON ROLE role_guest IS 'Неавторизовані користувачі (перегляд каталогу)';
COMMENT ON ROLE role_reader IS 'Читачі бібліотеки (позики, резервації, штрафи)';
COMMENT ON ROLE role_librarian IS 'Бібліотекарі (управління книгами, позиками, користувачами)';
COMMENT ON ROLE role_accountant IS 'Бухгалтери (фінансова звітність, штрафи, зарплати)';
COMMENT ON ROLE role_admin IS 'Адміністратори (повний доступ до системи)';

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Ролі та права доступу успішно налаштовано!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Створено ролі:';
    RAISE NOTICE '  - role_guest (гості)';
    RAISE NOTICE '  - role_reader (читачі)';
    RAISE NOTICE '  - role_librarian (бібліотекарі)';
    RAISE NOTICE '  - role_accountant (бухгалтери)';
    RAISE NOTICE '  - role_admin (адміністратори)';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS увімкнено для таблиць:';
    RAISE NOTICE '  - users';
    RAISE NOTICE '  - loans';
    RAISE NOTICE '  - fines';
    RAISE NOTICE '  - reservations';
    RAISE NOTICE '============================================';
END $$;
