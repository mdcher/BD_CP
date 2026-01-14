SET client_encoding = 'UTF8';

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
        violationcount = 0  -- Скидаємо лічильник порушень
    WHERE userid = p_user_id;

    RAISE NOTICE 'User % (%) unblocked by admin %', v_user_name, p_user_id, p_admin_id;
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

    -- Знаходимо популярні книги (відношення активних позик до загальної кількості примірників)
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
            -- Виключаємо книги, які вже замовлені і не доставлені
            SELECT 1
            FROM public.orders o
            JOIN public.order_items oi ON o.orderid = oi.orderid
            WHERE o.status IN ('Pending', 'In Progress')
              AND oi.pricelistid = pl.pricelistid
        )
        GROUP BY pl.pricelistid, pl.booktitle, pl.price
        HAVING COUNT(l.loanid)::FLOAT / NULLIF(COUNT(DISTINCT b.bookid), 0)::FLOAT >= p_popularity_threshold
    LOOP
        -- Додаємо позицію до замовлення
        INSERT INTO public.order_items (orderid, pricelistid, quantity)
        VALUES (v_order_id, v_rec.pricelistid, p_default_quantity);

        RAISE NOTICE 'Added % copies of "%" to order', p_default_quantity, v_rec.booktitle;
    END LOOP;

    -- Оновлюємо загальну вартість (через тригер це відбудеться автоматично)
    -- Але якщо замовлення порожнє, видаляємо його
    IF NOT EXISTS (SELECT 1 FROM public.order_items WHERE orderid = v_order_id) THEN
        DELETE FROM public.orders WHERE orderid = v_order_id;
        RAISE NOTICE 'No popular books found for ordering';
    ELSE
        RAISE NOTICE 'Order % created successfully with supplier "%"', v_order_id, p_supplier;
    END IF;
END;
$$;

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


CREATE AGGREGATE public.agg_avgreadingduration(date, date) (
    SFUNC = public.func_accum_reading,
    STYPE = public.reading_state_type,
    INITCOND = '(0,0)',
    FINALFUNC = public.func_final_reading
);


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

CREATE TRIGGER trg_auto_mark_lost_books
    BEFORE UPDATE ON public.loans
    FOR EACH ROW
    WHEN (OLD.isreturned = false)
    EXECUTE FUNCTION public.check_long_overdue_loans();

GRANT EXECUTE ON PROCEDURE public.issue_book TO role_librarian, role_admin;
GRANT EXECUTE ON PROCEDURE public.return_book TO role_librarian, role_admin;
GRANT EXECUTE ON PROCEDURE public.create_user TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.create_book TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.update_book TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.pay_fine TO role_reader, role_accountant, role_admin;
GRANT EXECUTE ON FUNCTION public.login TO PUBLIC;

GRANT EXECUTE ON PROCEDURE public.confirm_reservation TO role_librarian, role_admin;
GRANT EXECUTE ON PROCEDURE public.mark_book_as_lost TO role_librarian, role_admin;
GRANT EXECUTE ON PROCEDURE public.delete_book TO role_librarian, role_admin;

GRANT EXECUTE ON PROCEDURE public.reader_initiate_fine_payment TO role_reader, role_librarian, role_accountant, role_admin;

GRANT EXECUTE ON PROCEDURE public.confirm_fine_payment TO role_accountant, role_admin;

GRANT EXECUTE ON PROCEDURE public.block_user TO role_admin;
GRANT EXECUTE ON PROCEDURE public.unblock_user TO role_admin;
GRANT EXECUTE ON PROCEDURE public.update_violation_type_cost TO role_admin;
GRANT EXECUTE ON PROCEDURE public.proc_autoorderbooks TO role_admin;

DO $$
BEGIN
    RAISE NOTICE 'Функції, процедури та тригери успішно створено!';
END $$;
