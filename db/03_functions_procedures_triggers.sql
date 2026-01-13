-- ============================================================================
-- ФАЙЛ 3: ФУНКЦІЇ, ПРОЦЕДУРИ ТА ТРИГЕРИ
-- Опис: Бізнес-логіка системи (функції, процедури, тригери)
-- ============================================================================

SET client_encoding = 'UTF8';

-- ============================================================================
-- ФУНКЦІЇ ДЛЯ ТРИГЕРІВ
-- ============================================================================

-- Функція: Автоблокування та лічильник порушень
-- Оновлює кількість порушень при створенні/видаленні штрафів
-- Блокує користувача при накопиченні 3+ порушень
CREATE OR REPLACE FUNCTION public.update_violation_count() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE users
        SET
            violationcount = violationcount + 1,
            isblocked = CASE
                            WHEN (violationcount + 1) >= 3 THEN TRUE
                            ELSE isblocked
                END
        WHERE userid = NEW.userid;

    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE users
        SET violationcount = GREATEST(violationcount - 1, 0)
        WHERE userid = OLD.userid;

    ELSIF (TG_OP = 'UPDATE') AND (OLD.userid IS DISTINCT FROM NEW.userid) THEN
        UPDATE users SET violationcount = GREATEST(violationcount - 1, 0) WHERE userid = OLD.userid;
        UPDATE users
        SET
            violationcount = violationcount + 1,
            isblocked = CASE WHEN (violationcount + 1) >= 3 THEN TRUE ELSE isblocked END
        WHERE userid = NEW.userid;
    END IF;
    RETURN NULL;
END;
$$;

-- Функція: Нарахування штрафу при поверненні
-- Автоматично створює штраф за прострочення при поверненні книги
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

-- Функція: Перевірка доступності книг (для Loans та Reservations)
-- Перевіряє чи є вільні примірники книги перед видачею/резервацією
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

-- Функція: Заборона видачі заблокованим користувачам
-- Перевіряє чи користувач не заблокований і не має неоплачених штрафів
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

-- Функція: Перерахунок вартості замовлення
-- Автоматично оновлює загальну вартість при зміні позицій замовлення
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

-- ============================================================================
-- ПРОЦЕДУРИ (STORED PROCEDURES)
-- ============================================================================

-- Процедура: Видача книги
-- Створює новий запис про видачу книги користувачу
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

-- Процедура: Повернення книги
-- Відмічає книгу як повернуту
CREATE OR REPLACE PROCEDURE public.return_book(IN p_loan_id integer)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE loans
    SET isreturned = TRUE,
        returndate = CURRENT_DATE
    WHERE loanid = p_loan_id AND isreturned = FALSE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Видача з ID % не знайдена або книга вже повернута.', p_loan_id;
    END IF;

    RAISE NOTICE 'Книгу успішно повернуто.';
END;
$$;

-- Процедура: Створення користувача
-- Додає нового користувача до системи
CREATE OR REPLACE PROCEDURE public.create_user(
    IN p_fullname character varying,
    IN p_contactinfo character varying,
    IN p_password_hash character varying,
    IN p_dateofbirth date,
    IN p_role public.role DEFAULT 'Reader'
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.users (fullname, contactinfo, password_hash, dateofbirth, role)
    VALUES (p_fullname, p_contactinfo, p_password_hash, p_dateofbirth, p_role);

    RAISE NOTICE 'Користувача % успішно створено', p_fullname;
END;
$$;

-- Функція: Логін користувача
-- Повертає дані користувача для автентифікації
CREATE OR REPLACE FUNCTION public.login(p_contactinfo character varying)
    RETURNS TABLE(
        userid integer,
        fullname character varying,
        contactinfo character varying,
        role public.role,
        password_hash character varying,
        isblocked boolean,
        dateofbirth date
    ) AS $$
BEGIN
    RETURN QUERY
        SELECT u.userid, u.fullname, u.contactinfo, u.role, u.password_hash, u.isblocked, u.dateofbirth
        FROM public.users u
        WHERE u.contactinfo = p_contactinfo;
END;
$$ LANGUAGE plpgsql;

-- Процедура: Створення книги
-- Додає нову книгу та її зв'язки з авторами і жанрами
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

-- Процедура: Оновлення книги
-- Оновлює дані книги та її зв'язки
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

-- Процедура: Оплата штрафу
-- Відмічає штраф як оплачений з перевіркою прав доступу
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

    -- Перевіряємо права доступу:
    -- Читач може оплатити тільки свій штраф
    -- Бухгалтер та Адмін можуть оплатити будь-який штраф
    IF v_current_user_role = 'Reader' AND v_fine_user_id != p_paid_by_user_id THEN
        RAISE EXCEPTION 'Readers can only pay their own fines';
    END IF;

    -- Оновлюємо штраф
    UPDATE public.fines
    SET ispaid = true,
        paymentdate = CURRENT_DATE
    WHERE fineid = p_fine_id;

    -- Логуємо успішну оплату
    RAISE NOTICE 'Fine % paid successfully by user %', p_fine_id, p_paid_by_user_id;
END;
$$;

-- ============================================================================
-- АГРЕГАТНІ ФУНКЦІЇ
-- ============================================================================

-- Функція акумуляції для розрахунку середньої тривалості читання
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

-- Фінальна функція для розрахунку середнього значення
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

-- Агрегатна функція для розрахунку середньої тривалості читання
CREATE AGGREGATE public.agg_avgreadingduration(date, date) (
    SFUNC = public.func_accum_reading,
    STYPE = public.reading_state_type,
    INITCOND = '(0,0)',
    FINALFUNC = public.func_final_reading
);

-- ============================================================================
-- ТРИГЕРИ
-- ============================================================================

-- Тригер: Перерахунок загальної вартості замовлення
CREATE TRIGGER trg_calculate_total_cost
    AFTER INSERT OR DELETE OR UPDATE ON public.order_items
    FOR EACH ROW EXECUTE FUNCTION public.update_order_total_cost();

-- Тригер: Перевірка доступності книг при видачі
CREATE TRIGGER trg_checkloans
    BEFORE INSERT ON public.loans
    FOR EACH ROW EXECUTE FUNCTION public.func_checkavailabilitycombined();

-- Тригер: Перевірка доступності книг при резервації
CREATE TRIGGER trg_checkreservations
    BEFORE INSERT ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.func_checkavailabilitycombined();

-- Тригер: Заборона видачі заблокованим користувачам
CREATE TRIGGER trg_prevent_loan_if_blocked
    BEFORE INSERT ON public.loans
    FOR EACH ROW EXECUTE FUNCTION public.func_prevent_loan_submission();

-- Тригер: Оновлення лічильника порушень
CREATE TRIGGER trg_update_violation_count_users
    AFTER INSERT OR UPDATE OR DELETE ON public.fines
    FOR EACH ROW EXECUTE FUNCTION public.update_violation_count();

-- Тригер: Нарахування штрафу при поверненні
CREATE TRIGGER trg_calculate_fine_on_return
    BEFORE UPDATE ON public.loans
    FOR EACH ROW EXECUTE FUNCTION public.calculate_fine_on_return();

-- ============================================================================
-- ПРАВА ДОСТУПУ ДО ПРОЦЕДУР
-- ============================================================================

GRANT EXECUTE ON PROCEDURE public.issue_book TO role_librarian, role_admin;
GRANT EXECUTE ON PROCEDURE public.return_book TO role_librarian, role_admin;
GRANT EXECUTE ON PROCEDURE public.create_user TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.create_book TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.update_book TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.pay_fine TO role_reader, role_accountant, role_admin;
GRANT EXECUTE ON FUNCTION public.login TO PUBLIC;

-- Повідомлення про успішне створення
DO $$
BEGIN
    RAISE NOTICE 'Функції, процедури та тригери успішно створено!';
END $$;
