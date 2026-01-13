SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- 1. Створення Ролей (якщо їх немає)
DO $$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_guest') THEN CREATE ROLE role_guest; END IF;
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_reader') THEN CREATE ROLE role_reader; END IF;
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_librarian') THEN CREATE ROLE role_librarian; END IF;
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_accountant') THEN CREATE ROLE role_accountant; END IF;
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_admin') THEN CREATE ROLE role_admin; END IF;
    END
$$;

-- 2. Розширення
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- 3. Типи даних (ENUM та DOMAIN)
CREATE TYPE public.book_status_enum AS ENUM (
    'New', 'Good', 'Damaged', 'Lost'
    );

CREATE TYPE public.language_enum AS ENUM (
    'Українська', 'Англійська', 'Німецька', 'Французька',
    'Іспанська', 'Румунська', 'Словацька'
    );

CREATE TYPE public.reading_state_type AS (
                                             sum_days integer,
                                             cnt_books integer
                                         );

CREATE DOMAIN public.role AS character varying(10)
    CONSTRAINT valid_role CHECK (((VALUE)::text = ANY ((ARRAY['Reader'::character varying, 'Librarian'::character varying, 'Admin'::character varying, 'Accountant'::character varying])::text[])));

-- 4. Таблиці

-- USERS
CREATE TABLE public.users (
                              userid SERIAL PRIMARY KEY,
                              fullname character varying(100) NOT NULL,
                              role public.role NOT NULL,
                              dateofbirth date NOT NULL,
                              contactinfo character varying(200) NOT NULL,
                              violationcount integer DEFAULT 0 NOT NULL CHECK (violationcount >= 0),
                              isblocked boolean DEFAULT false NOT NULL,
                              db_user name,
    -- Додаємо поле для хешу пароля (для Node.js бекенду)
                              password_hash character varying(255)
);

-- AUTHORS
CREATE TABLE public.authors (
                                authorid SERIAL PRIMARY KEY,
                                fullname character varying(100) NOT NULL
);

-- BOOKS
CREATE TABLE public.books (
                              bookid SERIAL PRIMARY KEY,
                              title character varying(200) NOT NULL,
                              publisher character varying(100) NOT NULL,
                              language public.language_enum NOT NULL,
                              year integer NOT NULL CHECK ((year >= 1900) AND (year <= (EXTRACT(year FROM CURRENT_DATE))::integer)),
                              location character varying(100) NOT NULL,
                              status public.book_status_enum DEFAULT 'New'::public.book_status_enum NOT NULL
);

-- EMPLOYEES
CREATE TABLE public.employees (
                                  employeeid SERIAL PRIMARY KEY,
                                  userid integer NOT NULL UNIQUE REFERENCES public.users(userid) ON DELETE CASCADE,
                                  "position" character varying(50) NOT NULL,
                                  salaryrate numeric(10,2) NOT NULL CHECK (salaryrate >= 0),
                                  workedhours integer DEFAULT 0 NOT NULL CHECK (workedhours >= 0),
                                  calculatedsalary numeric(10,2) GENERATED ALWAYS AS ((salaryrate * (workedhours)::numeric)) STORED
);

-- VIOLATION TYPES
CREATE TABLE public.violation_types (
                                        typeid SERIAL PRIMARY KEY,
                                        name character varying(100) NOT NULL,
                                        cost numeric(10,2) NOT NULL CHECK (cost >= 0)
);

-- FINES
CREATE TABLE public.fines (
                              fineid SERIAL PRIMARY KEY,
                              userid integer NOT NULL REFERENCES public.users(userid),
                              typeid integer NOT NULL REFERENCES public.violation_types(typeid),
                              issuedate date NOT NULL,
                              paiddate date,
                              ispaid boolean DEFAULT false NOT NULL,
                              amount numeric(10,2) NOT NULL
);

-- GENRES
CREATE TABLE public.genres (
                               genreid SERIAL PRIMARY KEY,
                               genrename character varying(50) NOT NULL UNIQUE
);

-- LOANS
CREATE TABLE public.loans (
                              loanid SERIAL PRIMARY KEY,
                              bookid integer NOT NULL REFERENCES public.books(bookid),
                              userid integer NOT NULL REFERENCES public.users(userid),
                              issuedate date NOT NULL,
                              duedate date NOT NULL,
                              isreturned boolean DEFAULT false NOT NULL,
                              conditiononreturn text,
                              returndate date
);

-- RESERVATIONS
CREATE TABLE public.reservations (
                                     reservationid SERIAL PRIMARY KEY,
                                     bookid integer NOT NULL REFERENCES public.books(bookid),
                                     userid integer NOT NULL REFERENCES public.users(userid),
                                     reservationdate date NOT NULL,
                                     pickupdate date NOT NULL,
                                     status character varying(20) NOT NULL CHECK (status IN ('Active', 'Cancelled', 'Completed'))
);

-- ORDER BOOKS (Прайс-лист)
CREATE TABLE public.order_books (
                                    orderbookid SERIAL PRIMARY KEY,
                                    title character varying(200) NOT NULL,
                                    author character varying(100) NOT NULL,
                                    genre character varying(100) NOT NULL,
                                    language public.language_enum NOT NULL,
                                    publisher character varying(100) NOT NULL,
                                    unitprice numeric(10,2) NOT NULL CHECK (unitprice >= 0)
);

-- ORDERS
CREATE TABLE public.orders (
                               orderid SERIAL PRIMARY KEY,
                               orderdate date NOT NULL,
                               supplier character varying(100) NOT NULL,
                               status character varying(20) NOT NULL CHECK (status IN ('Created', 'InProgress', 'Completed', 'Cancelled')),
                               totalcost numeric(10,2) DEFAULT 0 NOT NULL CHECK (totalcost >= 0)
);

-- ORDER ITEMS
CREATE TABLE public.order_items (
                                    orderid integer NOT NULL REFERENCES public.orders(orderid) ON DELETE CASCADE,
                                    orderbookid integer NOT NULL REFERENCES public.order_books(orderbookid),
                                    quantity integer NOT NULL CHECK (quantity > 0),
                                    PRIMARY KEY (orderid, orderbookid)
);

-- LINKING TABLES
CREATE TABLE public.book_authors (
                                     bookid integer NOT NULL REFERENCES public.books(bookid) ON DELETE CASCADE,
                                     authorid integer NOT NULL REFERENCES public.authors(authorid) ON DELETE CASCADE,
                                     PRIMARY KEY (bookid, authorid)
);

CREATE TABLE public.book_genres (
                                    bookid integer NOT NULL REFERENCES public.books(bookid) ON DELETE CASCADE,
                                    genreid integer NOT NULL REFERENCES public.genres(genreid) ON DELETE CASCADE,
                                    PRIMARY KEY (bookid, genreid)
);

-- 5. Функції та Процедури

-- Функція: Автоблокування та лічильник порушень
CREATE OR REPLACE FUNCTION public.update_violation_count() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE users
        SET
            ViolationCount = ViolationCount + 1,
            IsBlocked = CASE
                            WHEN (ViolationCount + 1) >= 3 THEN TRUE
                            ELSE IsBlocked
                END
        WHERE UserID = NEW.UserID;

    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE users
        SET ViolationCount = GREATEST(ViolationCount - 1, 0)
        WHERE UserID = OLD.UserID;

    ELSIF (TG_OP = 'UPDATE') AND (OLD.UserID IS DISTINCT FROM NEW.UserID) THEN
        UPDATE users SET ViolationCount = GREATEST(ViolationCount - 1, 0) WHERE UserID = OLD.UserID;
        UPDATE users
        SET
            ViolationCount = ViolationCount + 1,
            IsBlocked = CASE WHEN (ViolationCount + 1) >= 3 THEN TRUE ELSE IsBlocked END
        WHERE UserID = NEW.UserID;
    END IF;
    RETURN NULL;
END;
$$;

-- Функція: Нарахування штрафу при поверненні
CREATE OR REPLACE FUNCTION public.calculate_fine_on_return() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_OverdueDays INT;
    v_CostPerDay NUMERIC(10,2);
    v_TypeID INT;
    v_CalculatedAmount NUMERIC(10,2);
BEGIN
    IF (OLD.IsReturned = FALSE AND NEW.IsReturned = TRUE) THEN
        IF (NEW.ReturnDate > OLD.DueDate) THEN
            v_OverdueDays := NEW.ReturnDate - OLD.DueDate;

            SELECT TypeID, Cost INTO v_TypeID, v_CostPerDay
            FROM violation_types
            WHERE Name LIKE '%Прострочення%' LIMIT 1;

            IF v_TypeID IS NOT NULL THEN
                v_CalculatedAmount := v_OverdueDays * v_CostPerDay;
                INSERT INTO fines (UserID, TypeID, IssueDate, IsPaid, Amount)
                VALUES (NEW.UserID, v_TypeID, CURRENT_DATE, FALSE, v_CalculatedAmount);
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Функція: Перевірка доступності книг (Loans + Reservations)
CREATE OR REPLACE FUNCTION public.func_checkavailabilitycombined() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_BookTitle VARCHAR(200);
    v_TotalCopies INT;
    v_BusyCopies INT;
    v_NearestDate DATE;
    v_RequestedBookID INT;
BEGIN
    v_RequestedBookID := NEW.BookID;
    SELECT Title INTO v_BookTitle FROM books WHERE BookID = v_RequestedBookID;

    SELECT COUNT(*) INTO v_TotalCopies FROM books WHERE Title = v_BookTitle AND Status <> 'Lost';

    SELECT COUNT(DISTINCT b.BookID) INTO v_BusyCopies
    FROM books b
             LEFT JOIN loans l ON b.BookID = l.BookID AND l.IsReturned = FALSE
             LEFT JOIN reservations r ON b.BookID = r.BookID AND r.Status = 'Active'
    WHERE b.Title = v_BookTitle AND (l.LoanID IS NOT NULL OR r.ReservationID IS NOT NULL);

    IF v_BusyCopies >= v_TotalCopies THEN
        SELECT MIN(ExpectedFreeDate) INTO v_NearestDate
        FROM (
                 SELECT l.DueDate AS ExpectedFreeDate FROM loans l JOIN books b ON l.BookID = b.BookID WHERE b.Title = v_BookTitle AND l.IsReturned = FALSE
                 UNION ALL
                 SELECT r.PickupDate AS ExpectedFreeDate FROM reservations r JOIN books b ON r.BookID = b.BookID WHERE b.Title = v_BookTitle AND r.Status = 'Active'
             ) AS AllDates WHERE ExpectedFreeDate >= CURRENT_DATE;

        RAISE EXCEPTION 'Всі примірники книги "%" зайняті. Найближча дата: %', v_BookTitle, v_NearestDate;
    END IF;
    RETURN NEW;
END;
$$;

-- Функція: Заборона видачі заблокованим
CREATE OR REPLACE FUNCTION public.func_prevent_loan_submission() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_IsBlocked BOOLEAN;
    v_UnpaidFinesCount INT;
BEGIN
    SELECT IsBlocked INTO v_IsBlocked FROM users WHERE UserID = NEW.UserID;
    IF v_IsBlocked THEN
        RAISE EXCEPTION 'Користувач заблокований.';
    END IF;

    SELECT COUNT(*) INTO v_UnpaidFinesCount FROM fines WHERE UserID = NEW.UserID AND IsPaid = FALSE;
    IF v_UnpaidFinesCount > 0 THEN
        RAISE EXCEPTION 'У користувача є неоплачені штрафи.';
    END IF;
    RETURN NEW;
END;
$$;

-- Функція: Перерахунок вартості замовлення
CREATE OR REPLACE FUNCTION public.update_order_total_cost() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    target_order_id INT;
BEGIN
    IF (TG_OP = 'DELETE') THEN target_order_id := OLD.OrderID; ELSE target_order_id := NEW.OrderID; END IF;

    UPDATE orders
    SET TotalCost = (
        SELECT COALESCE(SUM(oi.Quantity * ob.UnitPrice), 0)
        FROM order_items oi
                 JOIN order_books ob ON oi.OrderBookID = ob.OrderBookID
        WHERE oi.OrderID = target_order_id
    )
    WHERE OrderID = target_order_id;

    RETURN NULL;
END;
$$;

-- Процедура: Видача книги
CREATE OR REPLACE PROCEDURE public.issue_book(IN p_user_id integer, IN p_book_id integer, IN p_days integer DEFAULT 14)
    LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO loans (BookID, UserID, IssueDate, DueDate, IsReturned)
    VALUES (p_book_id, p_user_id, CURRENT_DATE, CURRENT_DATE + p_days, FALSE);

    RAISE NOTICE 'Книгу успішно видано. Дата повернення: %', CURRENT_DATE + p_days;
END;
$$;

-- Процедура: Повернення книги
CREATE OR REPLACE PROCEDURE public.return_book(IN p_loan_id integer)
    LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE loans
    SET IsReturned = TRUE,
        ReturnDate = CURRENT_DATE
    WHERE LoanID = p_loan_id AND IsReturned = FALSE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Видача з ID % не знайдена або книга вже повернута.', p_loan_id;
    END IF;

    RAISE NOTICE 'Книгу успішно повернуто.';
END;
$$;

-- Процедура: Створення користувача
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
END;
$$;

CREATE OR REPLACE FUNCTION public.login(p_contactinfo character varying)
    RETURNS TABLE(
                     userid integer,
                     fullname character varying,
                     contactinfo character varying,
                     role public.role,
                     password_hash character varying
                 ) AS $$
BEGIN
    RETURN QUERY
        SELECT u.userid, u.fullname, u.contactinfo, u.role, u.password_hash
        FROM public.users u
        WHERE u.contactinfo = p_contactinfo;
END;
$$ LANGUAGE plpgsql;

-- Процедура: Створення книги
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
    INSERT INTO public.books (title, publisher, language, year, location, status)
    VALUES (p_title, p_publisher, p_language, p_year, p_location, p_status)
    RETURNING bookid INTO v_book_id;

    IF p_author_ids IS NOT NULL THEN
        FOREACH author_id IN ARRAY p_author_ids
        LOOP
            INSERT INTO public.book_authors (bookid, authorid) VALUES (v_book_id, author_id);
        END LOOP;
    END IF;

    IF p_genre_ids IS NOT NULL THEN
        FOREACH genre_id IN ARRAY p_genre_ids
        LOOP
            INSERT INTO public.book_genres (bookid, genreid) VALUES (v_book_id, genre_id);
        END LOOP;
    END IF;
END;
$$;

-- Процедура: Оновлення книги
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
    UPDATE public.books
    SET title = p_title,
        publisher = p_publisher,
        language = p_language,
        year = p_year,
        location = p_location,
        status = p_status
    WHERE bookid = p_book_id;

    DELETE FROM public.book_authors WHERE bookid = p_book_id;
    IF p_author_ids IS NOT NULL THEN
        FOREACH author_id IN ARRAY p_author_ids
        LOOP
            INSERT INTO public.book_authors (bookid, authorid) VALUES (p_book_id, author_id);
        END LOOP;
    END IF;

    DELETE FROM public.book_genres WHERE bookid = p_book_id;
    IF p_genre_ids IS NOT NULL THEN
        FOREACH genre_id IN ARRAY p_genre_ids
        LOOP
            INSERT INTO public.book_genres (bookid, genreid) VALUES (p_book_id, genre_id);
        END LOOP;
    END IF;
END;
$$;

GRANT EXECUTE ON PROCEDURE public.issue_book TO role_librarian, role_admin;
GRANT EXECUTE ON PROCEDURE public.return_book TO role_librarian, role_admin;
GRANT EXECUTE ON PROCEDURE public.create_user TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.create_book TO role_admin, role_librarian;
GRANT EXECUTE ON PROCEDURE public.update_book TO role_admin, role_librarian;

-- Процедура: Оплата штрафу
CREATE OR REPLACE PROCEDURE public.pay_fine(
    p_fine_id integer,
    p_paid_by_user_id integer
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_fine_user_id integer;
    v_current_user_role text;
    v_is_paid boolean;
BEGIN
    -- Отримуємо інформацію про штраф
    SELECT userid, ispaid INTO v_fine_user_id, v_is_paid
    FROM public.fines
    WHERE fineid = p_fine_id;

    -- Перевіряємо, чи існує штраф
    IF v_fine_user_id IS NULL THEN
        RAISE EXCEPTION 'Fine with ID % not found', p_fine_id;
    END IF;

    -- Перевіряємо, чи вже оплачено
    IF v_is_paid THEN
        RAISE EXCEPTION 'Fine with ID % is already paid', p_fine_id;
    END IF;

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
        paiddate = CURRENT_DATE
    WHERE fineid = p_fine_id;

    -- Логуємо успішну оплату
    RAISE NOTICE 'Fine % paid successfully by user %', p_fine_id, p_paid_by_user_id;
END;
$$;

GRANT EXECUTE ON PROCEDURE public.pay_fine TO role_reader, role_accountant, role_admin;

-- Процедура: Автозамовлення книг
CREATE PROCEDURE public.proc_autoorderbooks(IN p_supplier character varying, IN p_threshold double precision DEFAULT 0.5, IN p_quantity integer DEFAULT 5)
    LANGUAGE plpgsql
AS $$
DECLARE
    v_OrderID INT;
    v_TotalCost DECIMAL(10,2) := 0;
    v_Rec RECORD;
BEGIN
    INSERT INTO orders (OrderDate, Supplier, Status, TotalCost) VALUES (CURRENT_DATE, p_Supplier, 'Created', 0) RETURNING OrderID INTO v_OrderID;

    FOR v_Rec IN
        SELECT ob.OrderBookID, ob.UnitPrice, b.Title
        FROM books b
                 JOIN order_books ob ON b.Title = ob.Title
                 LEFT JOIN loans l ON b.BookID = l.BookID
        GROUP BY b.Title, ob.OrderBookID, ob.UnitPrice
        HAVING (COUNT(l.LoanID)::FLOAT / NULLIF((SELECT COUNT(*) FROM books WHERE Title = b.Title), 0)::FLOAT) >= p_Threshold
        LOOP
            INSERT INTO order_items (OrderID, OrderBookID, Quantity) VALUES (v_OrderID, v_Rec.OrderBookID, p_Quantity);
        END LOOP;

    DELETE FROM orders WHERE OrderID = v_OrderID AND TotalCost = 0; -- Cleanup if empty
END;
$$;

-- Агрегатні функції (Reading Stats)
CREATE FUNCTION public.func_accum_reading(state public.reading_state_type, issue_date date, return_date date) RETURNS public.reading_state_type
    LANGUAGE plpgsql AS $$
BEGIN
    IF return_date IS NOT NULL AND issue_date IS NOT NULL THEN
        state.sum_days := state.sum_days + (return_date - issue_date);
        state.cnt_books := state.cnt_books + 1;
    END IF;
    RETURN state;
END;
$$;

CREATE FUNCTION public.func_final_reading(state public.reading_state_type) RETURNS double precision
    LANGUAGE plpgsql AS $$
BEGIN
    IF state.cnt_books > 0 THEN RETURN state.sum_days::FLOAT / state.cnt_books::FLOAT; ELSE RETURN 0; END IF;
END;
$$;

CREATE AGGREGATE public.agg_avgreadingduration(date, date) (
    SFUNC = public.func_accum_reading,
    STYPE = public.reading_state_type,
    INITCOND = '(0,0)',
    FINALFUNC = public.func_final_reading
    );



-- 6. Створення Представлень (Views)

CREATE VIEW public.view_active_debtors AS
SELECT u.fullname, u.contactinfo, b.title AS book_title, l.duedate,
       (CURRENT_DATE - l.duedate) AS days_overdue
FROM loans l
         JOIN users u ON l.userid = u.userid
         JOIN books b ON l.bookid = b.bookid
WHERE l.isreturned = false AND l.duedate < CURRENT_DATE;

CREATE VIEW public.view_catalog_extended AS
SELECT b.bookid, b.title, b.publisher, b.year, b.status AS physicalstatus, b.location,
       string_agg(DISTINCT a.fullname::text, ', ') AS authors,
       string_agg(DISTINCT g.genrename::text, ', ') AS genres,
       CASE
           WHEN b.status = 'Lost' THEN 'Unavailable'
           WHEN EXISTS (SELECT 1 FROM loans l WHERE l.bookid = b.bookid AND l.isreturned = false) THEN 'Loaned'
           WHEN EXISTS (SELECT 1 FROM reservations r WHERE r.bookid = b.bookid AND r.status = 'Active') THEN 'Reserved'
           ELSE 'Available'
           END AS availabilitystatus
FROM books b
         LEFT JOIN book_authors ba ON b.bookid = ba.bookid
         LEFT JOIN authors a ON ba.authorid = a.authorid
         LEFT JOIN book_genres bg ON b.bookid = bg.bookid
         LEFT JOIN genres g ON bg.genreid = g.genreid
GROUP BY b.bookid;

CREATE VIEW public.view_financial_summary AS
SELECT
    COALESCE((SELECT sum(amount) FROM fines WHERE ispaid = true), 0) AS totalincomefines,
    COALESCE((SELECT sum(totalcost) FROM orders WHERE status <> 'Cancelled'), 0) AS expensesbooks,
    COALESCE((SELECT sum(calculatedsalary) FROM employees), 0) AS expensessalaries,
    (
        COALESCE((SELECT sum(amount) FROM fines WHERE ispaid = true), 0) -
        COALESCE((SELECT sum(totalcost) FROM orders WHERE status <> 'Cancelled'), 0) -
        COALESCE((SELECT sum(calculatedsalary) FROM employees), 0)
        ) AS netbalance,
    CURRENT_DATE AS reportdate;

CREATE VIEW public.view_my_history AS
SELECT l.userid, l.issuedate AS eventdate, 'Loan' AS eventtype, b.title AS description,
       CASE WHEN l.isreturned THEN 'Returned' WHEN l.duedate < CURRENT_DATE THEN 'Overdue!' ELSE 'Active' END AS status,
       0.00 AS amount
FROM loans l JOIN books b ON l.bookid = b.bookid
UNION ALL
SELECT f.userid, f.issuedate AS eventdate, 'Fine' AS eventtype, vt.name || ' (' || f.amount || ' грн)' AS description,
       CASE WHEN f.ispaid THEN 'Paid' ELSE 'Unpaid' END AS status,
       f.amount
FROM fines f JOIN violation_types vt ON f.typeid = vt.typeid;

CREATE VIEW public.view_author_ratings AS
SELECT fullname,
       (SELECT count(*) FROM book_authors ba WHERE ba.authorid = a.authorid) AS total_books,
       dense_rank() OVER (ORDER BY (SELECT count(*) FROM book_authors ba WHERE ba.authorid = a.authorid) DESC) AS rank_by_books
FROM authors a;

CREATE VIEW public.view_genre_popularity AS
WITH book_loan_stats AS (
    SELECT b.title, g.genrename, count(l.loanid) AS loan_count,
           rank() OVER (PARTITION BY g.genrename ORDER BY count(l.loanid) DESC) AS rank_in_genre
    FROM books b
             JOIN book_genres bg ON b.bookid = bg.bookid
             JOIN genres g ON bg.genreid = g.genreid
             LEFT JOIN loans l ON b.bookid = l.bookid
    GROUP BY b.title, g.genrename
)
SELECT title, genrename, loan_count FROM book_loan_stats WHERE rank_in_genre = 1;

-- View: Всі користувачі для адміністратора
CREATE VIEW public.v_all_users_for_admin AS
SELECT
    u.userid,
    u.fullname,
    u.role,
    u.dateofbirth,
    u.contactinfo,
    u.violationcount,
    u.isblocked,
    COUNT(l.loanid) FILTER (WHERE l.isreturned = false) as active_loans,
    COUNT(f.fineid) FILTER (WHERE f.ispaid = false) as unpaid_fines
FROM public.users u
         LEFT JOIN public.loans l ON u.userid = l.userid
         LEFT JOIN public.fines f ON u.userid = f.userid
GROUP BY u.userid;

-- View: Неоплачені штрафи читача
CREATE VIEW public.v_reader_unpaid_fines AS
SELECT
    f.fineid,
    f.userid,
    f.issuedate,
    f.amount,
    vt.name as violation_type,
    vt.cost as base_cost
FROM public.fines f
         JOIN public.violation_types vt ON f.typeid = vt.typeid
         JOIN public.users u ON f.userid = u.userid
WHERE f.ispaid = false
  AND u.db_user = CURRENT_USER;

-- View: Всі штрафи
CREATE VIEW public.v_all_fines AS
SELECT
    f.fineid,
    f.userid,
    u.fullname,
    u.contactinfo,
    f.issuedate,
    f.paiddate,
    f.ispaid,
    f.amount,
    vt.name as violation_type
FROM public.fines f
         JOIN public.users u ON f.userid = u.userid
         JOIN public.violation_types vt ON f.typeid = vt.typeid;

-- View: Видачі читача
CREATE VIEW public.v_reader_loans AS
SELECT
    l.loanid,
    l.bookid,
    b.title as book_title,
    l.issuedate,
    l.duedate,
    l.returndate,
    l.isreturned,
    CASE
        WHEN l.isreturned = false AND l.duedate < CURRENT_DATE THEN 'Overdue'
        WHEN l.isreturned = false THEN 'Active'
        ELSE 'Returned'
        END as loan_status
FROM public.loans l
         JOIN public.books b ON l.bookid = b.bookid
         JOIN public.users u ON l.userid = u.userid
WHERE u.db_user = CURRENT_USER;

-- View: Резервації читача
CREATE VIEW public.v_reader_reservations AS
SELECT
    r.reservationid,
    r.bookid,
    b.title as book_title,
    r.reservationdate,
    r.pickupdate,
    r.status
FROM public.reservations r
         JOIN public.books b ON r.bookid = b.bookid
         JOIN public.users u ON r.userid = u.userid
WHERE u.db_user = CURRENT_USER;

-- View: Всі активні резервації
CREATE VIEW public.v_all_active_reservations AS
SELECT
    r.reservationid,
    r.bookid,
    b.title as book_title,
    r.userid,
    u.fullname as user_name,
    u.contactinfo,
    r.reservationdate,
    r.pickupdate,
    r.status
FROM public.reservations r
         JOIN public.books b ON r.bookid = b.bookid
         JOIN public.users u ON r.userid = u.userid
WHERE r.status = 'Active';

-- Додаткові views для повного функціоналу системи

-- View: Всі користувачі для адміністратора
CREATE OR REPLACE VIEW public.v_all_users_for_admin AS
SELECT
    u.userid,
    u.fullname,
    u.role,
    u.dateofbirth,
    u.contactinfo,
    u.violationcount,
    u.isblocked,
    COUNT(l.loanid) FILTER (WHERE l.isreturned = false) as active_loans,
    COUNT(f.fineid) FILTER (WHERE f.ispaid = false) as unpaid_fines
FROM public.users u
         LEFT JOIN public.loans l ON u.userid = l.userid
         LEFT JOIN public.fines f ON u.userid = f.userid
GROUP BY u.userid;

GRANT SELECT ON public.v_all_users_for_admin TO role_admin;

-- View: Неоплачені штрафи читача
CREATE OR REPLACE VIEW public.v_reader_unpaid_fines AS
SELECT
    f.fineid,
    f.userid,
    f.issuedate,
    f.amount,
    vt.name as violation_type,
    vt.cost as base_cost
FROM public.fines f
         JOIN public.violation_types vt ON f.typeid = vt.typeid
         JOIN public.users u ON f.userid = u.userid
WHERE f.ispaid = false
  AND u.db_user = CURRENT_USER;

GRANT SELECT ON public.v_reader_unpaid_fines TO role_reader;

-- View: Всі штрафи
CREATE OR REPLACE VIEW public.v_all_fines AS
SELECT
    f.fineid,
    f.userid,
    u.fullname,
    u.contactinfo,
    f.issuedate,
    f.paiddate,
    f.ispaid,
    f.amount,
    vt.name as violation_type
FROM public.fines f
         JOIN public.users u ON f.userid = u.userid
         JOIN public.violation_types vt ON f.typeid = vt.typeid;

GRANT SELECT ON public.v_all_fines TO role_admin, role_accountant;

-- View: Видачі читача
CREATE OR REPLACE VIEW public.v_reader_loans AS
SELECT
    l.loanid,
    l.bookid,
    b.title as book_title,
    l.issuedate,
    l.duedate,
    l.returndate,
    l.isreturned,
    CASE
        WHEN l.isreturned = false AND l.duedate < CURRENT_DATE THEN 'Overdue'
        WHEN l.isreturned = false THEN 'Active'
        ELSE 'Returned'
        END as loan_status
FROM public.loans l
         JOIN public.books b ON l.bookid = b.bookid
         JOIN public.users u ON l.userid = u.userid
WHERE u.db_user = CURRENT_USER;

GRANT SELECT ON public.v_reader_loans TO role_reader;

-- View: Резервації читача
CREATE OR REPLACE VIEW public.v_reader_reservations AS
SELECT
    r.reservationid,
    r.bookid,
    b.title as book_title,
    r.reservationdate,
    r.pickupdate,
    r.status
FROM public.reservations r
         JOIN public.books b ON r.bookid = b.bookid
         JOIN public.users u ON r.userid = u.userid
WHERE u.db_user = CURRENT_USER;

GRANT SELECT ON public.v_reader_reservations TO role_reader;

-- View: Всі активні резервації
CREATE OR REPLACE VIEW public.v_all_active_reservations AS
SELECT
    r.reservationid,
    r.bookid,
    b.title as book_title,
    r.userid,
    u.fullname as user_name,
    u.contactinfo,
    r.reservationdate,
    r.pickupdate,
    r.status
FROM public.reservations r
         JOIN public.books b ON r.bookid = b.bookid
         JOIN public.users u ON r.userid = u.userid
WHERE r.status = 'Active';

GRANT SELECT ON public.v_all_active_reservations TO role_librarian, role_admin;

-- 7. Завантаження даних (COPY)

COPY public.authors (authorid, fullname) FROM stdin;
1	Джордж Орвелл
2	Тарас Шевченко
3	Джоан Ролінг
4	Анджей Сапковський
5	Стівен Кінг
6	Френк Герберт
7	Михайло Коцюбинський
8	Іван Нечуй-Левицький
9	Іван Франко
10	Леся Українка
11	Панас Мирний
12	Валер'ян Підмогильний
13	Іван Багряний
14	Ольга Кобилянська
15	Пауло Коельо
16	Ден Браун
17	Артур Конан Дойл
18	Дж. Р. Р. Толкін
19	Джордж Р. Р. Мартін
20	К. С. Льюїс
21	Рік Ріордан
22	Крістофер Паоліні
23	Енді Вейр
24	Дуглас Адамс
25	Станіслав Лем
26	Вільям Гібсон
27	Айзек Азімов
28	Деніел Кіз
29	Оскар Уайльд
30	Френсіс Скотт Фіцджеральд
31	Ернест Хемінгуей
32	Еріх Марія Ремарк
33	Луїза Мей Олкотт
\.

COPY public.books (bookid, title, publisher, language, year, location, status) FROM stdin;
1	1984	Penguin	Англійська	2020	Полиця B1	Good
2	Кобзар	Ранок	Українська	2015	Полиця A1	New
3	Гаррі Поттер і філософський камінь	А-БА-БА-ГА-ЛА-МА-ГА	Українська	2010	Полиця A2	Damaged
4	Відьмак. Останнє бажання	КСД	Українська	2018	Полиця A3	Good
5	Воно	КСД	Українська	2019	Полиця C1	Good
6	Дюна	BookChef	Українська	2023	Полиця D1	New
7	Тіні забутих предків	Фоліо	Українська	2015	Полиця B2	Good
8	Кайдашева сім'я	Знання	Українська	2018	Полиця B3	Good
9	Захар Беркут	А-БА-БА-ГА-ЛА-МА-ГА	Українська	2020	Полиця B4	New
10	Лісова пісня	Основи	Українська	2019	Полиця B5	Good
11	Хіба ревуть воли, як ясла повні?	Фоліо	Українська	2016	Полиця C1	Damaged
12	Місто	Віхола	Українська	2023	Полиця C2	New
13	Тигролови	А-БА-БА-ГА-ЛА-МА-ГА	Українська	2021	Полиця C3	Good
14	Земля	Знання	Українська	2019	Полиця C4	Good
15	Алхімік	КСД	Українська	2022	Полиця C5	New
16	Код да Вінчі	КСД	Українська	2019	Полиця D1	Good
17	Шерлок Холмс	Країна Мрій	Українська	2018	Полиця D2	Good
18	Володар Перснів: Хранителі Персня	Астролябія	Українська	2020	Полиця D3	Good
19	Гра престолів	КМ-Букс	Українська	2019	Полиця D4	Damaged
20	Хроніки Нарнії	КСД	Українська	2021	Полиця D5	New
21	Гобіт	Астролябія	Українська	2022	Полиця E1	New
22	Персі Джексон і Викрадач блискавок	Ранок	Українська	2023	Полиця E2	Good
23	Ерагон	Ранок	Українська	2017	Полиця E3	Good
24	Темна вежа	КСД	Українська	2018	Полиця E4	Good
25	Марсіянин	КМ-Букс	Українська	2020	Полиця E5	New
26	Автостопом по галактиці	НК-Богдан	Українська	2016	Полиця F1	Damaged
27	Соляріс	НК-Богдан	Українська	2019	Полиця F2	Good
28	Нейромант	Видавництво Жупанського	Українська	2021	Полиця F3	New
29	Я, робот	КСД	Українська	2022	Полиця F4	Good
30	Квіти для Елджернона	КСД	Українська	2020	Полиця F5	Good
31	Портрет Доріана Грея	КСД	Українська	2018	Полиця G1	Good
32	Великий Гетсбі	КМ-Букс	Українська	2019	Полиця G2	Damaged
33	Старий і море	Видавництво Старого Лева	Українська	2021	Полиця G3	New
34	Три товариші	КСД	Українська	2022	Полиця G4	Good
35	На західному фронті без змін	КСД	Українська	2023	Полиця G5	New
36	Маленькі жінки	КМ-Букс	Українська	2020	Полиця H1	Good
\.

COPY public.genres (genreid, genrename) FROM stdin;
1	Антиутопія
2	Класика
3	Фентезі
4	Жахи
5	Наукова фантастика
6	Детектив
7	Філософія
8	Пригоди
\.

COPY public.book_authors (bookid, authorid) FROM stdin;
1	1
2	2
3	3
4	4
5	5
6	6
7	7
8	8
9	9
10	10
11	11
12	12
13	13
14	14
15	15
16	16
17	17
18	18
19	19
20	20
21	18
22	21
23	22
24	5
25	23
26	24
27	25
28	26
29	27
30	28
31	29
32	30
33	31
34	32
35	32
36	33
\.

COPY public.book_genres (bookid, genreid) FROM stdin;
1	1
2	2
3	3
4	3
5	4
6	5
7	2
8	2
9	2
10	2
11	2
12	2
13	2
14	2
15	7
16	6
17	6
18	3
19	3
20	3
21	3
22	3
23	3
24	5
25	5
26	5
27	5
28	5
29	5
30	5
31	2
32	2
33	2
34	2
35	2
36	2
\.

COPY public.users (userid, fullname, role, dateofbirth, contactinfo, violationcount, isblocked, db_user) FROM stdin;
3	Петро Нагорний	Reader	2000-08-01	nagor@mail.com	0	f	\N
6	Сергій Цюпак	Admin	1990-06-20	admin@admin.com	0	f	\N
7	Наталя Томчишина	Accountant	1982-12-10	natasha@account.com	0	f	\N
8	Олександр Мельник	Reader	1995-03-12	oleksandr.melnik@mail.com	0	f	\N
9	Марія Шевченко	Reader	1998-07-22	maria.shevchenko@mail.com	0	f	\N
10	Андрій Коваленко	Reader	2001-11-05	andriy.kovalenko@mail.com	0	f	\N
11	Анна Бондаренко	Reader	1990-01-30	anna.bondarenko@mail.com	1	f	\N
12	Дмитро Бойко	Reader	2003-09-14	dmitro.boyko@mail.com	0	f	\N
13	Софія Ткаченко	Reader	1997-04-18	sofia.tkachenko@mail.com	0	f	\N
15	Ольга Ковальчук	Reader	1988-06-25	olga.kovalchuk@mail.com	0	f	\N
16	Артем Олійник	Reader	2004-02-10	artem.oliynyk@mail.com	0	f	\N
17	Вікторія Шевчук	Reader	1999-08-29	viktoria.shevchuk@mail.com	0	f	\N
18	Назар Поліщук	Reader	1996-05-15	nazar.polishchuk@mail.com	0	f	\N
19	Дарина Лисенко	Reader	2002-10-03	daryna.lysenko@mail.com	0	f	\N
20	Богдан Ткачук	Reader	1993-01-19	bogdan.tkachuk@mail.com	0	f	\N
21	Єва Савченко	Reader	2005-07-07	eva.savchenko@mail.com	0	f	\N
22	Іван Мороз	Reader	1985-11-23	ivan.moroz@mail.com	3	t	\N
23	Поліна Петренко	Reader	2000-03-08	polina.petrenko@mail.com	0	f	\N
24	Михайло Руденко	Reader	1994-09-12	mykhailo.rudenko@mail.com	0	f	\N
25	Катерина Білоус	Reader	1991-06-30	kateryna.bilous@mail.com	0	f	\N
26	Данило Клименко	Reader	2003-02-14	danylo.klymenko@mail.com	0	f	\N
27	Юлія Павленко	Reader	1997-12-05	yulia.pavlenko@mail.com	0	f	\N
28	Роман Грищенко	Reader	1989-04-22	roman.hryshchenko@mail.com	0	f	\N
29	Аліна Козак	Reader	2001-08-11	alina.kozak@mail.com	0	f	\N
30	Володимир Василенко	Reader	1990-10-27	volodymyr.vasylenko@mail.com	0	f	\N
31	Христина Мазур	Reader	1998-01-15	khrystyna.mazur@mail.com	0	f	\N
32	Сергій Романенко	Reader	1995-05-09	serhiy.romanenko@mail.com	1	f	\N
33	Наталія Даниленко	Reader	1992-07-03	natalia.danylenko@mail.com	0	f	\N
34	Тарас Кузьменко	Reader	2004-11-19	taras.kuzmenko@mail.com	0	f	\N
35	Оксана Левченко	Reader	1987-03-28	oksana.levchenko@mail.com	0	f	\N
36	Василь Мельничук	Reader	1999-09-02	vasyl.melnychuk@mail.com	0	f	\N
37	Ірина Нестеренко	Reader	2002-06-16	iryna.nesterenko@mail.com	0	f	\N
4	Владислав Колесник	Reader	1981-06-25	vlad@blocked.com	4	t	\N
14	Максим Кравченко	Reader	1992-12-01	maxim.kravchenko@mail.com	3	f	\N
5	Олена Петрівна	Librarian	1985-03-15	olena@library.com	0	f	librarian_olena
1	Іван Іванов	Reader	2000-01-01	ivan@mail.com	3	f	reader_ivan
2	Ірина Красницька	Reader	2002-05-10	irka@mail.com	1	f	\N
\.

-- Встановлюємо пароль за замовчуванням для всіх користувачів (password123 хеш)
-- Щоб бекенд міг працювати.
UPDATE public.users SET password_hash = '$2a$10$RVEwku4./tis/XHylpYf1e6i0x/c6fdQjYrpqnbLUCGkfuJBoBnWO';


COPY public.employees (employeeid, userid, "position", salaryrate, workedhours) FROM stdin;
1	5	Librarian	100.00	160
3	7	Chief Accountant	120.00	160
2	6	System Admin	150.00	170
\.

COPY public.violation_types (typeid, name, cost) FROM stdin;
2	Пошкодження книги	150.00
3	Втрата книги	500.00
1	Прострочення (за день)	15.00
\.

COPY public.fines (fineid, userid, typeid, issuedate, paiddate, ispaid, amount) FROM stdin;
5	2	2	2025-12-22	\N	f	150.00
3	14	2	2025-03-09	\N	f	150.00
1	4	2	2025-02-09	\N	f	150.00
4	1	1	2025-12-22	2025-12-22	t	15.00
2	1	1	2024-12-01	2024-12-05	t	15.00
\.

COPY public.loans (loanid, bookid, userid, issuedate, duedate, isreturned, conditiononreturn, returndate) FROM stdin;
3	2	3	2025-01-01	2025-01-15	t	New	2025-01-10
4	3	4	2025-02-01	2025-02-10	t	Damaged	2025-02-09
5	7	8	2025-01-10	2025-01-20	t	Good	2025-01-18
7	15	14	2025-03-01	2025-03-10	t	Damaged	2025-03-09
8	20	22	2025-01-05	2025-01-15	t	Good	2025-01-15
9	25	30	2025-02-20	2025-03-01	f	\N	\N
10	5	17	2025-12-21	2026-01-04	f	\N	\N
11	34	23	2025-12-21	2026-01-04	f	\N	\N
1	1	1	2025-12-16	2025-12-26	t	Good	2025-12-22
13	10	8	2025-12-22	2026-01-05	f	\N	\N
6	12	10	2025-02-01	2025-02-15	t	Good	2025-12-22
2	4	2	2025-12-01	2025-12-16	t	Damaged	2025-12-22
14	2	4	2026-01-10	2026-01-20	f	\N	\N
\.

COPY public.reservations (reservationid, bookid, userid, reservationdate, pickupdate, status) FROM stdin;
1	6	1	2025-12-21	2025-12-23	Active
2	5	2	2025-03-01	2025-03-03	Cancelled
7	26	6	2025-12-22	2025-12-23	Cancelled
3	10	8	2025-12-21	2025-12-22	Completed
\.

COPY public.order_books (orderbookid, title, author, genre, language, publisher, unitprice) FROM stdin;
1	Dune Messiah	Frank Herbert	Sci-Fi	Англійська	Ace	350.00
2	Сяйво	Стівен Кінг	Жахи	Українська	КСД	400.00
3	Кобзар (Подарункове)	Тарас Шевченко	Класика	Українська	Віват	800.00
\.

COPY public.orders (orderid, orderdate, supplier, status, totalcost) FROM stdin;
1	2025-12-21	BestBooks Supplier Ltd.	Created	3600.00
\.

COPY public.order_items (orderid, orderbookid, quantity) FROM stdin;
1	2	5
1	3	2
\.

-- 8. Оновлення Sequence (Лічильників)
SELECT pg_catalog.setval('public.authors_authorid_seq', 33, true);
SELECT pg_catalog.setval('public.books_bookid_seq', 36, true);
SELECT pg_catalog.setval('public.employees_employeeid_seq', 3, true);
SELECT pg_catalog.setval('public.fines_fineid_seq', 5, true);
SELECT pg_catalog.setval('public.genres_genreid_seq', 8, true);
SELECT pg_catalog.setval('public.loans_loanid_seq', 15, true);
SELECT pg_catalog.setval('public.order_books_orderbookid_seq', 3, true);
SELECT pg_catalog.setval('public.orders_orderid_seq', 12, true);
SELECT pg_catalog.setval('public.reservations_reservationid_seq', 7, true);
SELECT pg_catalog.setval('public.users_userid_seq', 38, true);
SELECT pg_catalog.setval('public.violation_types_typeid_seq', 3, true);

-- 9. Індекси
CREATE INDEX idx_books_publisher ON public.books USING btree (publisher);
CREATE INDEX idx_books_title_trgm ON public.books USING gin (title public.gin_trgm_ops);
CREATE INDEX idx_fines_user ON public.fines USING btree (userid);
CREATE INDEX idx_loans_book_user ON public.loans USING btree (bookid, userid);
CREATE INDEX idx_loans_overdue ON public.loans USING btree (duedate) WHERE (isreturned = false);
CREATE INDEX idx_users_db_user ON public.users USING btree (db_user);
CREATE INDEX idx_users_contactinfo ON public.users USING btree (contactinfo);

-- 10. Тригери (Прив'язка)
CREATE TRIGGER trg_calculate_total_cost AFTER INSERT OR DELETE OR UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_order_total_cost();
CREATE TRIGGER trg_checkloans BEFORE INSERT ON public.loans FOR EACH ROW EXECUTE FUNCTION public.func_checkavailabilitycombined();
CREATE TRIGGER trg_checkreservations BEFORE INSERT ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.func_checkavailabilitycombined();
CREATE TRIGGER trg_prevent_loan_if_blocked BEFORE INSERT ON public.loans FOR EACH ROW EXECUTE FUNCTION public.func_prevent_loan_submission();
CREATE TRIGGER trg_update_violation_count_users AFTER INSERT OR UPDATE OR DELETE ON public.fines FOR EACH ROW EXECUTE FUNCTION public.update_violation_count();
CREATE TRIGGER trg_calculate_fine_on_return BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.calculate_fine_on_return();

-- 11. Політики Безпеки (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Дозволяємо SELECT для автентифікації (логін) - доступ по contactinfo для перевірки пароля
CREATE POLICY allow_login_select ON public.users FOR SELECT USING (true);

CREATE POLICY admin_lib_view_all_users ON public.users TO role_librarian, role_admin USING (true);
CREATE POLICY reader_view_self ON public.users FOR SELECT TO role_reader USING ((db_user = CURRENT_USER));

CREATE POLICY staff_view_all_loans ON public.loans TO role_librarian, role_admin USING (true);
CREATE POLICY reader_view_own_loans ON public.loans FOR SELECT TO role_reader USING ((userid = (SELECT users.userid FROM public.users WHERE (users.db_user = CURRENT_USER))));

CREATE POLICY staff_view_all_fines ON public.fines TO role_librarian, role_accountant, role_admin USING (true);
CREATE POLICY reader_view_own_fines ON public.fines FOR SELECT TO role_reader USING ((userid = (SELECT users.userid FROM public.users WHERE (users.db_user = CURRENT_USER))));

CREATE POLICY staff_view_all_res ON public.reservations TO role_librarian, role_admin USING (true);
CREATE POLICY reader_view_own_res ON public.reservations FOR SELECT TO role_reader USING ((userid = (SELECT users.userid FROM public.users WHERE (users.db_user = CURRENT_USER))));
CREATE POLICY reader_create_own_res ON public.reservations FOR INSERT TO role_reader WITH CHECK ((userid = (SELECT users.userid FROM public.users WHERE (users.db_user = CURRENT_USER))));
CREATE POLICY reader_update_own_res ON public.reservations FOR UPDATE TO role_reader USING ((userid = (SELECT users.userid FROM public.users WHERE (users.db_user = CURRENT_USER))));

-- 12. Права доступу (GRANTS)
GRANT USAGE ON SCHEMA public TO role_guest, role_reader, role_librarian, role_accountant, role_admin;

-- Таблиці (читання для всіх авторизованих, запис для персоналу)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO role_reader;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO role_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books, public.authors, public.loans, public.reservations, public.users TO role_librarian;
GRANT SELECT, INSERT, UPDATE ON public.fines TO role_librarian;
GRANT SELECT ON public.employees, public.orders, public.order_items TO role_accountant;

-- Sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO role_admin, role_librarian;
GRANT USAGE, SELECT ON public.reservations_reservationid_seq TO role_reader;

-- Views (явні права для RLS-захищених views)
GRANT SELECT ON public.v_all_users_for_admin TO role_admin;
GRANT SELECT ON public.v_reader_unpaid_fines TO role_reader;
GRANT SELECT ON public.v_all_fines TO role_admin, role_accountant;
GRANT SELECT ON public.v_reader_loans TO role_reader;
GRANT SELECT ON public.v_reader_reservations TO role_reader;
GRANT SELECT ON public.v_all_active_reservations TO role_librarian, role_admin;

-- 13. Дозвіл основному користувачу бекенду переключатися між ролями (для RLS)
-- ВАЖЛИВО: Замініть 'postgres' на ім'я користувача з вашого .env (DB_USERNAME)
-- Якщо ваш користувач вже є суперкористувачем, ці команди не обов'язкові
DO $$
BEGIN
    -- Перевіряємо, чи існує користувач postgres (або ваш DB_USERNAME)
    IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
        GRANT role_guest TO postgres;
        GRANT role_reader TO postgres;
        GRANT role_librarian TO postgres;
        GRANT role_accountant TO postgres;
        GRANT role_admin TO postgres;
    END IF;
END $$;