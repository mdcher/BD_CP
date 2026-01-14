SET client_encoding = 'UTF8';

-- ============================================================
-- ТРИГЕРНІ ФУНКЦІЇ
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_violation_count()
    RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    _new_user_id INT;
    _old_user_id INT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        SELECT userid INTO _new_user_id FROM loans WHERE loanid = NEW.loanid;

        IF _new_user_id IS NOT NULL THEN
            UPDATE users
            SET
                violationcount = violationcount + 1,
                isblocked = CASE
                                WHEN (violationcount + 1) >= 3 THEN TRUE
                                ELSE isblocked
                    END
            WHERE userid = _new_user_id;
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        SELECT userid INTO _old_user_id FROM loans WHERE loanid = OLD.loanid;

        IF _old_user_id IS NOT NULL THEN
            UPDATE users
            SET violationcount = GREATEST(violationcount - 1, 0)
            WHERE userid = _old_user_id;
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        SELECT userid INTO _old_user_id FROM loans WHERE loanid = OLD.loanid;
        SELECT userid INTO _new_user_id FROM loans WHERE loanid = NEW.loanid;

        IF (_old_user_id IS DISTINCT FROM _new_user_id) THEN

            IF _old_user_id IS NOT NULL THEN
                UPDATE users SET violationcount = GREATEST(violationcount - 1, 0)
                WHERE userid = _old_user_id;
            END IF;

            IF _new_user_id IS NOT NULL THEN
                UPDATE users
                SET
                    violationcount = violationcount + 1,
                    isblocked = CASE WHEN (violationcount + 1) >= 3 THEN TRUE ELSE isblocked END
                WHERE userid = _new_user_id;
            END IF;
        END IF;
    END IF;

    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_fine_on_return() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_overdue_days INT;
    v_loan_user_id INT;
    v_fine_amount NUMERIC(10,2);
BEGIN
    -- Перевіряємо, чи книга щойно повернута
    IF (OLD.isreturned = FALSE AND NEW.isreturned = TRUE) THEN
        -- Перевіряємо, чи є прострочення
        IF (NEW.returndate > NEW.duedate) THEN
            v_overdue_days := NEW.returndate - NEW.duedate;

            -- Отримуємо ID користувача з позики
            SELECT userid INTO v_loan_user_id FROM loans WHERE loanid = NEW.loanid;

            -- Розраховуємо суму штрафу (5 грн за день згідно з даними)
            v_fine_amount := v_overdue_days * 5.00;

            -- Створюємо штраф
            INSERT INTO fines (loanid, amount, ispaid, issuedate, paymentdate)
            VALUES (NEW.loanid, v_fine_amount, FALSE, CURRENT_DATE, NULL);

            RAISE NOTICE 'Нараховано штраф % грн за % днів прострочення', v_fine_amount, v_overdue_days;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.func_checkavailabilitycombined() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_book_title VARCHAR(200);
    v_total_copies INT;
    v_busy_copies INT;
    v_nearest_date DATE;
    v_requested_book_id INT;
BEGIN
    v_requested_book_id := NEW.bookid;
    SELECT title INTO v_book_title FROM books WHERE bookid = v_requested_book_id;

    -- Рахуємо загальну кількість примірників (крім втрачених)
    SELECT COUNT(*) INTO v_total_copies
    FROM books
    WHERE title = v_book_title AND status <> 'Lost';

    -- Рахуємо зайняті примірники (в позиці або резервації)
    SELECT COUNT(DISTINCT b.bookid) INTO v_busy_copies
    FROM books b
    LEFT JOIN loans l ON b.bookid = l.bookid AND l.isreturned = FALSE
    LEFT JOIN reservations r ON b.bookid = r.bookid AND r.iscompleted = FALSE
    WHERE b.title = v_book_title
      AND (l.loanid IS NOT NULL OR r.reservationid IS NOT NULL);

    -- Якщо всі примірники зайняті
    IF v_busy_copies >= v_total_copies THEN
        -- Знаходимо найближчу дату звільнення
        SELECT MIN(expected_free_date) INTO v_nearest_date
        FROM (
            SELECT l.duedate AS expected_free_date
            FROM loans l
            JOIN books b ON l.bookid = b.bookid
            WHERE b.title = v_book_title AND l.isreturned = FALSE
            UNION ALL
            SELECT r.pickupdate AS expected_free_date
            FROM reservations r
            JOIN books b ON r.bookid = b.bookid
            WHERE b.title = v_book_title AND r.iscompleted = FALSE
        ) AS all_dates
        WHERE expected_free_date >= CURRENT_DATE;

        RAISE EXCEPTION 'Всі примірники книги "%" зайняті. Найближча дата: %', v_book_title, v_nearest_date;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.func_prevent_loan_submission() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_is_blocked BOOLEAN;
    v_unpaid_fines_count INT;
BEGIN
    -- Перевіряємо статус блокування
    SELECT isblocked INTO v_is_blocked FROM users WHERE userid = NEW.userid;
    IF v_is_blocked THEN
        RAISE EXCEPTION 'Користувач заблокований.';
    END IF;

    -- Перевіряємо наявність неоплачених штрафів
    SELECT COUNT(*) INTO v_unpaid_fines_count
    FROM fines f
    JOIN loans l ON f.loanid = l.loanid
    WHERE l.userid = NEW.userid AND f.ispaid = FALSE;

    IF v_unpaid_fines_count > 0 THEN
        RAISE EXCEPTION 'У користувача є неоплачені штрафи.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_order_total_cost() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    target_order_id INT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_order_id := OLD.orderid;
    ELSE
        target_order_id := NEW.orderid;
    END IF;

    UPDATE orders
    SET totalprice = (
        SELECT COALESCE(SUM(quantity *
            (SELECT price FROM price_list WHERE pricelistid = order_items.pricelistid)), 0)
        FROM order_items
        WHERE orderid = target_order_id
    )
    WHERE orderid = target_order_id;

    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_long_overdue_loans() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_overdue_days integer;
BEGIN
    -- Перевіряємо тільки для неповернутих позик
    IF NEW.isreturned = false THEN
        v_overdue_days := CURRENT_DATE - NEW.duedate;

        -- Якщо прострочення більше 180 днів (6 місяців)
        IF v_overdue_days >= 180 THEN
            -- Автоматично маркуємо книгу як втрачену
            UPDATE public.books
            SET status = 'Lost'
            WHERE bookid = NEW.bookid AND status != 'Lost';

            -- Відмічаємо позику як повернуту (фактично втрачену)
            NEW.isreturned := true;
            NEW.returndate := CURRENT_DATE;

            -- Додаємо штраф за втрату книги (якщо ще не додано)
            IF NOT EXISTS (
                SELECT 1 FROM public.fines
                WHERE loanid = NEW.loanid
                  AND amount >= 200.00
            ) THEN
                INSERT INTO public.fines (loanid, amount, ispaid, issuedate)
                VALUES (NEW.loanid, 200.00, false, CURRENT_DATE);
            END IF;

            RAISE NOTICE 'Loan % automatically marked as lost due to % days overdue', NEW.loanid, v_overdue_days;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- ============================================================
-- СИСТЕМА АУДИТ ЛОГУВАННЯ
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_audit(
    p_userid INTEGER,
    p_action VARCHAR,
    p_tablename VARCHAR,
    p_recordid INTEGER,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.audit_log (userid, action, tablename, recordid, old_values, new_values)
    VALUES (p_userid, p_action, p_tablename, p_recordid, p_old_values, p_new_values);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.log_audit TO role_reader, role_librarian, role_admin, role_accountant;

-- ============================================================
-- АГРЕГАТНІ ФУНКЦІЇ (Статистика читання)
-- ============================================================

CREATE OR REPLACE FUNCTION public.func_accum_reading(
    state public.reading_state_type,
    issue_date date,
    return_date date
) RETURNS public.reading_state_type
LANGUAGE plpgsql AS $$
BEGIN
    IF return_date IS NOT NULL AND issue_date IS NOT NULL THEN
        state.sum_days := state.sum_days + (return_date - issue_date);
        state.cnt_books := state.cnt_books + 1;
    END IF;
    RETURN state;
END;
$$;

CREATE OR REPLACE FUNCTION public.func_final_reading(state public.reading_state_type)
RETURNS double precision
LANGUAGE plpgsql AS $$
BEGIN
    IF state.cnt_books > 0 THEN
        RETURN state.sum_days::FLOAT / state.cnt_books::FLOAT;
    ELSE
        RETURN 0;
    END IF;
END;
$$;

CREATE AGGREGATE IF NOT EXISTS public.agg_avgreadingduration(date, date) (
    SFUNC = public.func_accum_reading,
    STYPE = public.reading_state_type,
    INITCOND = '(0,0)',
    FINALFUNC = public.func_final_reading
);

-- ============================================================
-- СИСТЕМА АВТЕНТИФІКАЦІЇ (DB USERS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_db_user_for_app(
    p_userid INTEGER,
    p_contactinfo VARCHAR,
    p_password VARCHAR,
    p_role public.role
)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_db_username VARCHAR(63);
    v_db_role_name VARCHAR(63);
    v_sql TEXT;
BEGIN
    -- Формуємо ім'я DB користувача: lib_user_<userid>
    v_db_username := 'lib_user_' || p_userid::TEXT;

    -- Визначаємо DB роль на основі application ролі
    v_db_role_name := CASE p_role
        WHEN 'Reader' THEN 'role_reader'
        WHEN 'Librarian' THEN 'role_librarian'
        WHEN 'Admin' THEN 'role_admin'
        WHEN 'Accountant' THEN 'role_accountant'
        ELSE 'role_reader'
    END;

    -- Перевіряємо, чи користувач вже існує
    IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = v_db_username) THEN
        -- Оновлюємо пароль існуючого користувача
        v_sql := format('ALTER ROLE %I WITH PASSWORD %L', v_db_username, p_password);
        EXECUTE v_sql;

        RAISE NOTICE 'Updated password for existing DB user: %', v_db_username;
    ELSE
        -- Створюємо нового DB користувача
        v_sql := format('CREATE ROLE %I WITH LOGIN PASSWORD %L', v_db_username, p_password);
        EXECUTE v_sql;

        -- Надаємо йому відповідну роль
        v_sql := format('GRANT %I TO %I', v_db_role_name, v_db_username);
        EXECUTE v_sql;

        -- Надаємо базові права
        v_sql := format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), v_db_username);
        EXECUTE v_sql;

        RAISE NOTICE 'Created DB user: % with role: %', v_db_username, v_db_role_name;
    END IF;

    RETURN v_db_username;
END;
$$;

CREATE OR REPLACE FUNCTION public.login(
    p_contactinfo character varying,
    p_password character varying
)
RETURNS TABLE(
    userid integer,
    fullname character varying,
    contactinfo character varying,
    role public.role,
    isblocked boolean,
    dateofbirth date,
    db_username varchar
) AS $$
DECLARE
    v_user_record RECORD;
    v_db_username VARCHAR(63);
BEGIN
    -- Знаходимо користувача
    SELECT u.userid, u.fullname, u.contactinfo, u.role, u.isblocked, u.dateofbirth, u.db_user
    INTO v_user_record
    FROM public.users u
    WHERE u.contactinfo = p_contactinfo;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Перевіряємо, чи користувач заблокований
    IF v_user_record.isblocked THEN
        RAISE EXCEPTION 'User is blocked';
    END IF;

    v_db_username := v_user_record.db_user;

    -- Якщо db_username NULL, це старий користувач - потрібна міграція
    IF v_db_username IS NULL OR v_db_username = '' THEN
        RAISE EXCEPTION 'User needs migration. DB user not created.';
    END IF;

    -- Повертаємо дані користувача
    -- (Перевірка пароля відбувається на рівні backend через спробу підключення)
    RETURN QUERY
    SELECT
        v_user_record.userid,
        v_user_record.fullname,
        v_user_record.contactinfo,
        v_user_record.role,
        v_user_record.isblocked,
        v_user_record.dateofbirth,
        v_db_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ПРОЦЕДУРИ УПРАВЛІННЯ КОРИСТУВАЧАМИ
-- ============================================================

CREATE OR REPLACE PROCEDURE public.create_user(
    IN p_fullname character varying,
    IN p_contactinfo character varying,
    IN p_password character varying,
    IN p_dateofbirth date,
    IN p_role public.role DEFAULT 'Reader'
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_userid INTEGER;
    v_db_username VARCHAR(63);
BEGIN
    -- Створюємо запис в таблиці users (БЕЗ password_hash)
    INSERT INTO public.users (fullname, contactinfo, dateofbirth, role)
    VALUES (p_fullname, p_contactinfo, p_dateofbirth, p_role)
    RETURNING userid INTO v_new_userid;

    -- Створюємо DB користувача
    v_db_username := public.create_db_user_for_app(
        v_new_userid,
        p_contactinfo,
        p_password,
        p_role
    );

    -- Оновлюємо поле db_user в таблиці
    UPDATE public.users
    SET db_user = v_db_username
    WHERE userid = v_new_userid;

    RAISE NOTICE 'Користувача % успішно створено (DB user: %)', p_fullname, v_db_username;
END;
$$;

CREATE OR REPLACE PROCEDURE public.update_user_by_admin(
    p_admin_id INTEGER,
    p_target_user_id INTEGER,
    p_role TEXT,
    p_is_blocked BOOLEAN
)
LANGUAGE plpgsql AS $$
DECLARE
    v_db_username VARCHAR(63);
    v_new_role_name VARCHAR(63);
    v_sql TEXT;
BEGIN
    -- Оновлюємо дані в таблиці users
    UPDATE public.users
    SET role = p_role::public.role,
        isblocked = p_is_blocked
    WHERE userid = p_target_user_id
    RETURNING db_user INTO v_db_username;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User % not found', p_target_user_id;
    END IF;

    -- Якщо роль змінилась, оновлюємо DB роль
    IF v_db_username IS NOT NULL AND v_db_username != '' THEN
        v_new_role_name := CASE p_role
            WHEN 'Reader' THEN 'role_reader'
            WHEN 'Librarian' THEN 'role_librarian'
            WHEN 'Admin' THEN 'role_admin'
            WHEN 'Accountant' THEN 'role_accountant'
            ELSE 'role_reader'
        END;

        -- Видаляємо всі попередні ролі
        BEGIN
            EXECUTE format('REVOKE role_reader, role_librarian, role_admin, role_accountant FROM %I', v_db_username);
        EXCEPTION WHEN OTHERS THEN
            -- Ігноруємо помилки, якщо ролі не були надані
        END;

        -- Надаємо нову роль
        v_sql := format('GRANT %I TO %I', v_new_role_name, v_db_username);
        EXECUTE v_sql;

        RAISE NOTICE 'Updated DB role for user % to %', v_db_username, v_new_role_name;
    END IF;

    RAISE NOTICE 'User % updated by admin %', p_target_user_id, p_admin_id;
END;
$$;

CREATE OR REPLACE PROCEDURE public.change_user_password(
    p_userid INTEGER,
    p_old_password VARCHAR,
    p_new_password VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_db_username VARCHAR(63);
    v_sql TEXT;
BEGIN
    -- Отримуємо DB username
    SELECT db_user INTO v_db_username
    FROM public.users
    WHERE userid = p_userid;

    IF v_db_username IS NULL OR v_db_username = '' THEN
        RAISE EXCEPTION 'DB user not found for user ID %', p_userid;
    END IF;

    -- Оновлюємо пароль
    v_sql := format('ALTER ROLE %I WITH PASSWORD %L', v_db_username, p_new_password);
    EXECUTE v_sql;

    RAISE NOTICE 'Password changed for user %', v_db_username;
END;
$$;

CREATE OR REPLACE PROCEDURE public.migrate_existing_users(p_default_password VARCHAR DEFAULT 'LibraryUser2024!')
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_record RECORD;
    v_db_username VARCHAR(63);
    v_migrated_count INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ПОЧАТОК МІГРАЦІЇ КОРИСТУВАЧІВ';
    RAISE NOTICE '========================================';

    FOR v_user_record IN
        SELECT userid, contactinfo, role
        FROM public.users
        WHERE db_user IS NULL OR db_user = ''
    LOOP
        BEGIN
            -- Створюємо DB користувача
            v_db_username := public.create_db_user_for_app(
                v_user_record.userid,
                v_user_record.contactinfo,
                p_default_password,
                v_user_record.role
            );

            -- Оновлюємо таблицю users
            UPDATE public.users
            SET db_user = v_db_username
            WHERE userid = v_user_record.userid;

            v_migrated_count := v_migrated_count + 1;

            RAISE NOTICE 'Мігровано користувача ID %: % -> %',
                v_user_record.userid,
                v_user_record.contactinfo,
                v_db_username;

        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Помилка міграції користувача ID %: %', v_user_record.userid, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'МІГРАЦІЯ ЗАВЕРШЕНА. Мігровано користувачів: %', v_migrated_count;
    RAISE NOTICE 'ВАЖЛИВО: Всі мігровані користувачі мають пароль: %', p_default_password;
    RAISE NOTICE '========================================';
END;
$$;

CREATE OR REPLACE PROCEDURE public.block_user(
    p_user_id integer,
    p_admin_id integer
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_name character varying(100);
BEGIN
    SELECT fullname INTO v_user_name FROM public.users WHERE userid = p_user_id;

    IF v_user_name IS NULL THEN
        RAISE EXCEPTION 'User % not found', p_user_id;
    END IF;

    UPDATE public.users
    SET isblocked = true
    WHERE userid = p_user_id;

    -- Аудит логування
    PERFORM log_audit(
        p_admin_id,
        'BLOCK_USER',
        'users',
        p_user_id,
        jsonb_build_object('isblocked', false),
        jsonb_build_object('isblocked', true)
    );

    RAISE NOTICE 'User % (%) blocked by admin %', v_user_name, p_user_id, p_admin_id;
END;
$$;

CREATE OR REPLACE PROCEDURE public.unblock_user(
    p_user_id integer,
    p_admin_id integer
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_name character varying(100);
BEGIN
    SELECT fullname INTO v_user_name FROM public.users WHERE userid = p_user_id;

    IF v_user_name IS NULL THEN
        RAISE EXCEPTION 'User % not found', p_user_id;
    END IF;

    UPDATE public.users
    SET isblocked = false,
        violationcount = 0
    WHERE userid = p_user_id;

    -- Аудит логування
    PERFORM log_audit(
        p_admin_id,
        'UNBLOCK_USER',
        'users',
        p_user_id,
        jsonb_build_object('isblocked', true, 'violationcount', 0),
        jsonb_build_object('isblocked', false, 'violationcount', 0)
    );

    RAISE NOTICE 'User % (%) unblocked by admin %', v_user_name, p_user_id, p_admin_id;
END;
$$;

-- ============================================================
-- ПРОЦЕДУРИ УПРАВЛІННЯ КНИГАМИ
-- ============================================================

CREATE OR REPLACE PROCEDURE public.issue_book(
    IN p_user_id integer,
    IN p_book_id integer,
    IN p_librarian_id integer DEFAULT NULL,
    IN p_days integer DEFAULT 14
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO loans (userid, bookid, issuedate, duedate, isreturned, librarianid)
    VALUES (p_user_id, p_book_id, CURRENT_DATE, CURRENT_DATE + p_days, FALSE, p_librarian_id);

    RAISE NOTICE 'Книгу успішно видано. Дата повернення: %', CURRENT_DATE + p_days;
END;
$$;

CREATE OR REPLACE PROCEDURE public.return_book(
    IN p_loan_id integer,
    IN p_book_condition public.book_status_enum DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_book_id INTEGER;
    v_current_status public.book_status_enum;
    v_damage_fine NUMERIC(10,2);
BEGIN
    -- Отримуємо ID книги та поточний стан
    SELECT bookid INTO v_book_id
    FROM loans
    WHERE loanid = p_loan_id AND isreturned = FALSE;

    IF v_book_id IS NULL THEN
        RAISE EXCEPTION 'Видача з ID % не знайдена або книга вже повернута.', p_loan_id;
    END IF;

    -- Отримуємо поточний стан книги
    SELECT status INTO v_current_status
    FROM books
    WHERE bookid = v_book_id;

    -- Оновлюємо запис про видачу
    UPDATE loans
    SET isreturned = TRUE,
        returndate = CURRENT_DATE
    WHERE loanid = p_loan_id;

    -- Якщо вказано стан книги при поверненні, оновлюємо його
    IF p_book_condition IS NOT NULL THEN
        UPDATE books
        SET status = p_book_condition
        WHERE bookid = v_book_id;

        -- Якщо книга пошкоджена, нараховуємо штраф
        IF p_book_condition = 'Damaged' AND v_current_status != 'Damaged' THEN
            -- Отримуємо вартість штрафу за пошкодження
            SELECT cost INTO v_damage_fine
            FROM violation_types
            WHERE name = 'Пошкодження книги';

            -- Якщо не знайдено, використовуємо стандартну суму
            IF v_damage_fine IS NULL THEN
                v_damage_fine := 50.00;
            END IF;

            -- Додаємо штраф за пошкодження
            INSERT INTO fines (loanid, amount, ispaid, issuedate)
            VALUES (p_loan_id, v_damage_fine, FALSE, CURRENT_DATE);

            RAISE NOTICE 'Нараховано штраф % грн за пошкодження книги', v_damage_fine;
        END IF;
    END IF;

    RAISE NOTICE 'Книгу успішно повернуто.';
END;
$$;

CREATE OR REPLACE PROCEDURE public.create_book(
    IN p_title character varying,
    IN p_publisher character varying,
    IN p_language public.language_enum,
    IN p_year integer,
    IN p_location character varying,
    IN p_status public.book_status_enum,
    IN p_author_ids integer[],
    IN p_genre_ids integer[]
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_book_id integer;
    author_id integer;
    genre_id integer;
BEGIN
    -- Створюємо книгу
    INSERT INTO public.books (title, publisher, language, year, location, status)
    VALUES (p_title, p_publisher, p_language, p_year, p_location, p_status)
    RETURNING bookid INTO v_book_id;

    -- Додаємо авторів
    IF p_author_ids IS NOT NULL THEN
        FOREACH author_id IN ARRAY p_author_ids
        LOOP
            INSERT INTO public.book_authors (bookid, authorid)
            VALUES (v_book_id, author_id);
        END LOOP;
    END IF;

    -- Додаємо жанри
    IF p_genre_ids IS NOT NULL THEN
        FOREACH genre_id IN ARRAY p_genre_ids
        LOOP
            INSERT INTO public.book_genres (bookid, genreid)
            VALUES (v_book_id, genre_id);
        END LOOP;
    END IF;

    RAISE NOTICE 'Книгу "%" успішно створено з ID %', p_title, v_book_id;
END;
$$;

CREATE OR REPLACE PROCEDURE public.update_book(
    IN p_book_id integer,
    IN p_title character varying,
    IN p_publisher character varying,
    IN p_language public.language_enum,
    IN p_year integer,
    IN p_location character varying,
    IN p_status public.book_status_enum,
    IN p_author_ids integer[],
    IN p_genre_ids integer[]
)
LANGUAGE plpgsql
AS $$
DECLARE
    author_id integer;
    genre_id integer;
BEGIN
    -- Оновлюємо основні дані книги
    UPDATE public.books
    SET title = p_title,
        publisher = p_publisher,
        language = p_language,
        year = p_year,
        location = p_location,
        status = p_status
    WHERE bookid = p_book_id;

    -- Оновлюємо авторів (видаляємо старі та додаємо нові)
    DELETE FROM public.book_authors WHERE bookid = p_book_id;
    IF p_author_ids IS NOT NULL THEN
        FOREACH author_id IN ARRAY p_author_ids
        LOOP
            INSERT INTO public.book_authors (bookid, authorid)
            VALUES (p_book_id, author_id);
        END LOOP;
    END IF;

    -- Оновлюємо жанри (видаляємо старі та додаємо нові)
    DELETE FROM public.book_genres WHERE bookid = p_book_id;
    IF p_genre_ids IS NOT NULL THEN
        FOREACH genre_id IN ARRAY p_genre_ids
        LOOP
            INSERT INTO public.book_genres (bookid, genreid)
            VALUES (p_book_id, genre_id);
        END LOOP;
    END IF;

    RAISE NOTICE 'Книгу з ID % успішно оновлено', p_book_id;
END;
$$;

CREATE OR REPLACE PROCEDURE public.delete_book(
    p_book_id integer
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_book_title character varying(200);
    v_active_loans integer;
BEGIN
    -- Отримуємо назву книги
    SELECT title INTO v_book_title FROM public.books WHERE bookid = p_book_id;

    IF v_book_title IS NULL THEN
        RAISE EXCEPTION 'Book % not found', p_book_id;
    END IF;

    -- Перевіряємо, чи немає активних позик
    SELECT COUNT(*) INTO v_active_loans
    FROM public.loans
    WHERE bookid = p_book_id AND isreturned = false;

    IF v_active_loans > 0 THEN
        RAISE EXCEPTION 'Cannot delete book "%". It has % active loans', v_book_title, v_active_loans;
    END IF;

    -- Видаляємо книгу (CASCADE автоматично видалить зв'язки з авторами та жанрами)
    DELETE FROM public.books WHERE bookid = p_book_id;

    RAISE NOTICE 'Book "%" (ID: %) deleted successfully', v_book_title, p_book_id;
END;
$$;

CREATE OR REPLACE PROCEDURE public.mark_book_as_lost(
    p_loan_id integer,
    p_librarian_id integer
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_book_id integer;
    v_user_id integer;
    v_overdue_days integer;
    v_fine_amount numeric(10,2);
BEGIN
    -- Отримуємо дані позики
    SELECT bookid, userid, (CURRENT_DATE - duedate) INTO v_book_id, v_user_id, v_overdue_days
    FROM public.loans
    WHERE loanid = p_loan_id AND isreturned = false;

    IF v_book_id IS NULL THEN
        RAISE EXCEPTION 'Loan % not found or already returned', p_loan_id;
    END IF;

    -- Перевіряємо прострочення (мінімум 180 днів = ~6 місяців)
    IF v_overdue_days < 180 THEN
        RAISE EXCEPTION 'Book can only be marked as lost after 180 days overdue (current: % days)', v_overdue_days;
    END IF;

    -- Відмічаємо книгу як втрачену
    UPDATE public.books
    SET status = 'Lost'
    WHERE bookid = v_book_id;

    -- Відмічаємо позику як повернуту (фактично втрачену)
    UPDATE public.loans
    SET isreturned = true,
        returndate = CURRENT_DATE
    WHERE loanid = p_loan_id;

    -- Додаємо штраф за втрату книги
    INSERT INTO public.fines (loanid, amount, ispaid, issuedate)
    VALUES (p_loan_id, 200.00, false, CURRENT_DATE);

    RAISE NOTICE 'Book % marked as lost. Fine of 200.00 added to user %', v_book_id, v_user_id;
END;
$$;

-- ============================================================
-- ПРОЦЕДУРИ УПРАВЛІННЯ АВТОРАМИ ТА ЖАНРАМИ
-- ============================================================

CREATE OR REPLACE PROCEDURE public.create_author(
    IN p_fullname VARCHAR,
    IN p_admin_id INTEGER DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_authorid INTEGER;
BEGIN
    INSERT INTO public.authors (fullname)
    VALUES (p_fullname)
    RETURNING authorid INTO v_new_authorid;

    RAISE NOTICE 'Автора "%" створено з ID %', p_fullname, v_new_authorid;
END;
$$;

CREATE OR REPLACE PROCEDURE public.update_author(
    IN p_authorid INTEGER,
    IN p_fullname VARCHAR,
    IN p_admin_id INTEGER DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.authors
    SET fullname = p_fullname
    WHERE authorid = p_authorid;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Author with ID % not found', p_authorid;
    END IF;

    RAISE NOTICE 'Автора ID % оновлено: "%"', p_authorid, p_fullname;
END;
$$;

CREATE OR REPLACE PROCEDURE public.delete_author(
    IN p_authorid INTEGER,
    IN p_admin_id INTEGER DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_author_name VARCHAR;
    v_book_count INTEGER;
BEGIN
    SELECT fullname INTO v_author_name FROM public.authors WHERE authorid = p_authorid;

    IF v_author_name IS NULL THEN
        RAISE EXCEPTION 'Author with ID % not found', p_authorid;
    END IF;

    -- Перевіряємо, чи є книги цього автора
    SELECT COUNT(*) INTO v_book_count
    FROM public.book_authors
    WHERE authorid = p_authorid;

    IF v_book_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete author "%". There are % books associated with this author', v_author_name, v_book_count;
    END IF;

    DELETE FROM public.authors WHERE authorid = p_authorid;

    RAISE NOTICE 'Автора "%" (ID: %) видалено', v_author_name, p_authorid;
END;
$$;

CREATE OR REPLACE PROCEDURE public.create_genre(
    IN p_genrename VARCHAR,
    IN p_admin_id INTEGER DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_genreid INTEGER;
BEGIN
    INSERT INTO public.genres (genrename)
    VALUES (p_genrename)
    RETURNING genreid INTO v_new_genreid;

    RAISE NOTICE 'Жанр "%" створено з ID %', p_genrename, v_new_genreid;
END;
$$;

CREATE OR REPLACE PROCEDURE public.update_genre(
    IN p_genreid INTEGER,
    IN p_genrename VARCHAR,
    IN p_admin_id INTEGER DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.genres
    SET genrename = p_genrename
    WHERE genreid = p_genreid;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Genre with ID % not found', p_genreid;
    END IF;

    RAISE NOTICE 'Жанр ID % оновлено: "%"', p_genreid, p_genrename;
END;
$$;

CREATE OR REPLACE PROCEDURE public.delete_genre(
    IN p_genreid INTEGER,
    IN p_admin_id INTEGER DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_genre_name VARCHAR;
    v_book_count INTEGER;
BEGIN
    SELECT genrename INTO v_genre_name FROM public.genres WHERE genreid = p_genreid;

    IF v_genre_name IS NULL THEN
        RAISE EXCEPTION 'Genre with ID % not found', p_genreid;
    END IF;

    -- Перевіряємо, чи є книги цього жанру
    SELECT COUNT(*) INTO v_book_count
    FROM public.book_genres
    WHERE genreid = p_genreid;

    IF v_book_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete genre "%". There are % books associated with this genre', v_genre_name, v_book_count;
    END IF;

    DELETE FROM public.genres WHERE genreid = p_genreid;

    RAISE NOTICE 'Жанр "%" (ID: %) видалено', v_genre_name, p_genreid;
END;
$$;

-- ============================================================
-- ПРОЦЕДУРИ УПРАВЛІННЯ ШТРАФАМИ
-- ============================================================

CREATE OR REPLACE PROCEDURE public.pay_fine(
    p_fine_id integer,
    p_paid_by_user_id integer
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_fine_loan_id integer;
    v_fine_user_id integer;
    v_current_user_role text;
    v_is_paid boolean;
BEGIN
    -- Отримуємо інформацію про штраф
    SELECT loanid, ispaid INTO v_fine_loan_id, v_is_paid
    FROM public.fines
    WHERE fineid = p_fine_id;

    -- Перевіряємо, чи існує штраф
    IF v_fine_loan_id IS NULL THEN
        RAISE EXCEPTION 'Fine with ID % not found', p_fine_id;
    END IF;

    -- Перевіряємо, чи вже оплачено
    IF v_is_paid THEN
        RAISE EXCEPTION 'Fine with ID % is already paid', p_fine_id;
    END IF;

    -- Отримуємо користувача, який має штраф
    SELECT userid INTO v_fine_user_id
    FROM loans
    WHERE loanid = v_fine_loan_id;

    -- Отримуємо роль поточного користувача
    SELECT role INTO v_current_user_role
    FROM public.users
    WHERE userid = p_paid_by_user_id;

    -- Перевіряємо права доступу
    IF v_current_user_role = 'Reader' AND v_fine_user_id != p_paid_by_user_id THEN
        RAISE EXCEPTION 'Readers can only pay their own fines';
    END IF;

    -- Оновлюємо штраф
    UPDATE public.fines
    SET ispaid = true,
        paymentdate = CURRENT_DATE
    WHERE fineid = p_fine_id;

    RAISE NOTICE 'Fine % paid successfully by user %', p_fine_id, p_paid_by_user_id;
END;
$$;

CREATE OR REPLACE PROCEDURE public.reader_initiate_fine_payment(
    p_fine_id integer,
    p_user_id integer
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_fine_user_id integer;
    v_is_paid boolean;
    v_payment_initiated boolean;
BEGIN
    -- Отримуємо дані штрафу
    SELECT l.userid, f.ispaid, (f.payment_initiated_date IS NOT NULL)
    INTO v_fine_user_id, v_is_paid, v_payment_initiated
    FROM public.fines f
    JOIN public.loans l ON f.loanid = l.loanid
    WHERE f.fineid = p_fine_id;

    -- Перевірки
    IF v_fine_user_id IS NULL THEN
        RAISE EXCEPTION 'Fine % not found', p_fine_id;
    END IF;

    IF v_fine_user_id != p_user_id THEN
        RAISE EXCEPTION 'You can only initiate payment for your own fines';
    END IF;

    IF v_is_paid THEN
        RAISE EXCEPTION 'Fine % is already paid', p_fine_id;
    END IF;

    IF v_payment_initiated THEN
        RAISE EXCEPTION 'Payment for fine % is already pending confirmation', p_fine_id;
    END IF;

    -- Відмічаємо, що користувач ініціював оплату
    UPDATE public.fines
    SET payment_initiated_date = CURRENT_DATE
    WHERE fineid = p_fine_id;

    RAISE NOTICE 'Payment initiated for fine %. Waiting for accountant confirmation', p_fine_id;
END;
$$;

CREATE OR REPLACE PROCEDURE public.confirm_fine_payment(
    p_fine_id integer,
    p_accountant_id integer,
    p_approve boolean DEFAULT true
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_payment_initiated boolean;
    v_is_paid boolean;
BEGIN
    -- Отримуємо дані штрафу
    SELECT (payment_initiated_date IS NOT NULL), ispaid
    INTO v_payment_initiated, v_is_paid
    FROM public.fines
    WHERE fineid = p_fine_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fine % not found', p_fine_id;
    END IF;

    IF v_is_paid THEN
        RAISE EXCEPTION 'Fine % is already confirmed as paid', p_fine_id;
    END IF;

    IF NOT v_payment_initiated THEN
        RAISE EXCEPTION 'Payment for fine % has not been initiated by the reader', p_fine_id;
    END IF;

    IF p_approve THEN
        -- Підтверджуємо оплату
        UPDATE public.fines
        SET ispaid = true,
            paymentdate = CURRENT_DATE,
            confirmed_by_accountant_id = p_accountant_id
        WHERE fineid = p_fine_id;

        RAISE NOTICE 'Payment for fine % confirmed by accountant %', p_fine_id, p_accountant_id;
    ELSE
        -- Відхиляємо оплату (скидаємо ініціацію)
        UPDATE public.fines
        SET payment_initiated_date = NULL
        WHERE fineid = p_fine_id;

        RAISE NOTICE 'Payment for fine % rejected by accountant %', p_fine_id, p_accountant_id;
    END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE public.update_violation_type_cost(
    p_type_id integer,
    p_new_cost numeric(10,2),
    p_admin_id integer
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_type_name character varying(100);
    v_old_cost numeric(10,2);
BEGIN
    SELECT name, cost INTO v_type_name, v_old_cost
    FROM public.violation_types
    WHERE typeid = p_type_id;

    IF v_type_name IS NULL THEN
        RAISE EXCEPTION 'Violation type % not found', p_type_id;
    END IF;

    UPDATE public.violation_types
    SET cost = p_new_cost
    WHERE typeid = p_type_id;

    RAISE NOTICE 'Violation type "%" cost updated from % to % by admin %',
                 v_type_name, v_old_cost, p_new_cost, p_admin_id;
END;
$$;

-- ============================================================
-- ПРОЦЕДУРИ УПРАВЛІННЯ РЕЗЕРВАЦІЯМИ
-- ============================================================

CREATE OR REPLACE PROCEDURE public.confirm_reservation(
    p_reservation_id integer,
    p_librarian_id integer,
    p_pickup_date date DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_reservation_user_id integer;
    v_reservation_book_id integer;
BEGIN
    -- Отримуємо дані бронювання
    SELECT userid, bookid INTO v_reservation_user_id, v_reservation_book_id
    FROM public.reservations
    WHERE reservationid = p_reservation_id AND isconfirmed = false AND iscompleted = false;

    -- Перевіряємо, чи існує бронювання
    IF v_reservation_user_id IS NULL THEN
        RAISE EXCEPTION 'Reservation % not found or already confirmed', p_reservation_id;
    END IF;

    -- Встановлюємо дату видачі (якщо не вказана, то через 3 дні)
    IF p_pickup_date IS NULL THEN
        p_pickup_date := CURRENT_DATE + 3;
    END IF;

    -- Підтверджуємо бронювання
    UPDATE public.reservations
    SET isconfirmed = true,
        librarianid = p_librarian_id,
        pickupdate = p_pickup_date
    WHERE reservationid = p_reservation_id;

    RAISE NOTICE 'Reservation % confirmed. Pickup date: %', p_reservation_id, p_pickup_date;
END;
$$;

-- Створення бронювання (для читачів)
CREATE OR REPLACE PROCEDURE public.create_reservation(
    p_book_id INTEGER,
    p_user_id INTEGER
)
LANGUAGE plpgsql AS $$
BEGIN
    -- Тригер автоматично перевірить доступність книги
    INSERT INTO public.reservations (bookid, userid, reservationdate, iscompleted, isconfirmed)
    VALUES (p_book_id, p_user_id, CURRENT_DATE, false, false);

    RAISE NOTICE 'Reservation created for user % and book %', p_user_id, p_book_id;
END;
$$;

-- Скасування бронювання (для читачів)
CREATE OR REPLACE PROCEDURE public.cancel_reservation(
    p_reservation_id INTEGER,
    p_user_id INTEGER
)
LANGUAGE plpgsql AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM public.reservations
    WHERE reservationid = p_reservation_id
      AND userid = p_user_id
      AND iscompleted = false
    RETURNING reservationid INTO v_deleted_count;

    IF v_deleted_count IS NULL THEN
        RAISE EXCEPTION 'Reservation % not found or cannot be cancelled', p_reservation_id;
    END IF;

    RAISE NOTICE 'Reservation % cancelled by user %', p_reservation_id, p_user_id;
END;
$$;

-- Завершення бронювання (для бібліотекарів - коли користувач забрав книгу)
CREATE OR REPLACE PROCEDURE public.complete_reservation_by_librarian(
    p_reservation_id INTEGER,
    p_librarian_id INTEGER
)
LANGUAGE plpgsql AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE public.reservations
    SET iscompleted = true
    WHERE reservationid = p_reservation_id
      AND isconfirmed = true
      AND iscompleted = false
    RETURNING reservationid INTO v_updated_count;

    IF v_updated_count IS NULL THEN
        RAISE EXCEPTION 'Confirmed reservation % not found', p_reservation_id;
    END IF;

    RAISE NOTICE 'Reservation % completed by librarian %', p_reservation_id, p_librarian_id;
END;
$$;

-- ============================================================
-- ПРОЦЕДУРИ УПРАВЛІННЯ ЗАМОВЛЕННЯМИ
-- ============================================================

CREATE OR REPLACE PROCEDURE public.proc_autoorderbooks(
    p_supplier character varying DEFAULT 'Постачальник за замовчуванням',
    p_popularity_threshold float DEFAULT 0.8,
    p_default_quantity integer DEFAULT 5
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id integer;
    v_rec RECORD;
BEGIN
    -- Створюємо нове замовлення
    INSERT INTO public.orders (orderdate, supplier, status, totalprice)
    VALUES (CURRENT_DATE, p_supplier, 'Pending', 0)
    RETURNING orderid INTO v_order_id;

    -- Знаходимо популярні книги
    FOR v_rec IN
        SELECT
            pl.pricelistid,
            pl.booktitle,
            pl.price,
            COUNT(l.loanid)::FLOAT / NULLIF(COUNT(DISTINCT b.bookid), 0)::FLOAT AS popularity
        FROM public.books b
        LEFT JOIN public.loans l ON b.bookid = l.bookid AND l.isreturned = false
        JOIN public.price_list pl ON b.title = pl.booktitle
        WHERE NOT EXISTS (
            SELECT 1
            FROM public.orders o
            JOIN public.order_items oi ON o.orderid = oi.orderid
            WHERE o.status IN ('Pending', 'In Progress')
              AND oi.pricelistid = pl.pricelistid
        )
        GROUP BY pl.pricelistid, pl.booktitle, pl.price
        HAVING COUNT(l.loanid)::FLOAT / NULLIF(COUNT(DISTINCT b.bookid), 0)::FLOAT >= p_popularity_threshold
    LOOP
        INSERT INTO public.order_items (orderid, pricelistid, quantity)
        VALUES (v_order_id, v_rec.pricelistid, p_default_quantity);

        RAISE NOTICE 'Added % copies of "%" to order', p_default_quantity, v_rec.booktitle;
    END LOOP;

    -- Якщо замовлення порожнє, видаляємо його
    IF NOT EXISTS (SELECT 1 FROM public.order_items WHERE orderid = v_order_id) THEN
        DELETE FROM public.orders WHERE orderid = v_order_id;
        RAISE NOTICE 'No popular books found for ordering';
    ELSE
        RAISE NOTICE 'Order % created successfully with supplier "%"', v_order_id, p_supplier;
    END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE public.create_custom_order(
    p_supplier VARCHAR DEFAULT 'Постачальник',
    p_items JSONB DEFAULT '[]'::jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id INTEGER;
    v_item JSONB;
    v_pricelistid INTEGER;
    v_quantity INTEGER;
BEGIN
    -- Створюємо нове замовлення
    INSERT INTO public.orders (orderdate, supplier, status, totalprice)
    VALUES (CURRENT_DATE, p_supplier, 'Pending', 0)
    RETURNING orderid INTO v_order_id;

    -- Додаємо позиції з JSON
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_pricelistid := (v_item->>'pricelistid')::INTEGER;
        v_quantity := (v_item->>'quantity')::INTEGER;

        INSERT INTO public.order_items (orderid, pricelistid, quantity)
        VALUES (v_order_id, v_pricelistid, v_quantity);

        RAISE NOTICE 'Додано позицію: pricelistid=%, quantity=%', v_pricelistid, v_quantity;
    END LOOP;

    -- Якщо немає позицій, видаляємо замовлення
    IF NOT EXISTS (SELECT 1 FROM public.order_items WHERE orderid = v_order_id) THEN
        DELETE FROM public.orders WHERE orderid = v_order_id;
        RAISE EXCEPTION 'Order cannot be empty';
    END IF;

    RAISE NOTICE 'Order % created successfully', v_order_id;
END;
$$;

-- ============================================================
-- ТРИГЕРИ
-- ============================================================

CREATE TRIGGER trg_calculate_total_cost
    AFTER INSERT OR DELETE OR UPDATE ON public.order_items
    FOR EACH ROW EXECUTE FUNCTION public.update_order_total_cost();

CREATE TRIGGER trg_checkloans
    BEFORE INSERT ON public.loans
    FOR EACH ROW EXECUTE FUNCTION public.func_checkavailabilitycombined();

CREATE TRIGGER trg_checkreservations
    BEFORE INSERT ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.func_checkavailabilitycombined();

CREATE TRIGGER trg_prevent_loan_if_blocked
    BEFORE INSERT ON public.loans
    FOR EACH ROW EXECUTE FUNCTION public.func_prevent_loan_submission();

CREATE TRIGGER trg_update_violation_count_users
    AFTER INSERT OR UPDATE OR DELETE ON public.fines
    FOR EACH ROW EXECUTE FUNCTION public.update_violation_count();

CREATE TRIGGER trg_calculate_fine_on_return
    BEFORE UPDATE ON public.loans
    FOR EACH ROW EXECUTE FUNCTION public.calculate_fine_on_return();

CREATE TRIGGER trg_auto_mark_lost_books
    BEFORE UPDATE ON public.loans
    FOR EACH ROW
    WHEN (OLD.isreturned = false)
    EXECUTE FUNCTION public.check_long_overdue_loans();

-- ============================================================
-- ПРАВА ДОСТУПУ
-- ============================================================

GRANT EXECUTE ON FUNCTION public.create_db_user_for_app TO postgres;
GRANT EXECUTE ON FUNCTION public.login TO PUBLIC;

GRANT EXECUTE ON PROCEDURE public.create_user TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.update_user_by_admin TO role_admin;
GRANT EXECUTE ON PROCEDURE public.change_user_password TO role_reader, role_librarian, role_admin, role_accountant;
GRANT EXECUTE ON PROCEDURE public.migrate_existing_users TO postgres;
GRANT EXECUTE ON PROCEDURE public.block_user TO role_admin;
GRANT EXECUTE ON PROCEDURE public.unblock_user TO role_admin;

GRANT EXECUTE ON PROCEDURE public.issue_book TO role_librarian, role_admin;
GRANT EXECUTE ON PROCEDURE public.return_book TO role_librarian, role_admin;
GRANT EXECUTE ON PROCEDURE public.create_book TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.update_book TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.delete_book TO role_librarian, role_admin;
GRANT EXECUTE ON PROCEDURE public.mark_book_as_lost TO role_librarian, role_admin;

GRANT EXECUTE ON PROCEDURE public.create_author TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.update_author TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.delete_author TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.create_genre TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.update_genre TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.delete_genre TO role_admin, role_librarian;

GRANT EXECUTE ON PROCEDURE public.pay_fine TO role_reader, role_accountant, role_admin;
GRANT EXECUTE ON PROCEDURE public.reader_initiate_fine_payment TO role_reader, role_librarian, role_accountant, role_admin;
GRANT EXECUTE ON PROCEDURE public.confirm_fine_payment TO role_accountant, role_admin;
GRANT EXECUTE ON PROCEDURE public.update_violation_type_cost TO role_admin;

GRANT EXECUTE ON PROCEDURE public.confirm_reservation TO role_librarian, role_admin;
GRANT EXECUTE ON PROCEDURE public.create_reservation TO role_reader, role_librarian, role_admin;
GRANT EXECUTE ON PROCEDURE public.cancel_reservation TO role_reader, role_librarian, role_admin;
GRANT EXECUTE ON PROCEDURE public.complete_reservation_by_librarian TO role_librarian, role_admin;

GRANT EXECUTE ON PROCEDURE public.proc_autoorderbooks TO role_admin;
GRANT EXECUTE ON PROCEDURE public.create_custom_order TO role_admin, role_librarian;

DO $$
BEGIN
    RAISE NOTICE '✅ Функції, процедури та тригери успішно створено!';
END $$;
