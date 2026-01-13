-- ============================================================================
-- ФАЙЛ 1: СТВОРЕННЯ ТАБЛИЦЬ
-- Опис: Створення структури бази даних (типи, таблиці, індекси)
-- ============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- Розширення
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- ============================================================================
-- ТИПИ ДАНИХ (ENUM та DOMAIN)
-- ============================================================================

-- Статуси книг
CREATE TYPE public.book_status_enum AS ENUM (
    'New', 'Good', 'Damaged', 'Lost'
);

-- Мови
CREATE TYPE public.language_enum AS ENUM (
    'Українська', 'Англійська', 'Німецька', 'Французька',
    'Іспанська', 'Румунська', 'Словацька'
);

-- Складний тип для стану читання
CREATE TYPE public.reading_state_type AS (
    sum_days integer,
    cnt_books integer
);

-- Домен для ролей користувачів
CREATE DOMAIN public.role AS character varying(10)
    CONSTRAINT valid_role CHECK (
        (VALUE)::text = ANY (
            ARRAY['Reader'::character varying, 'Librarian'::character varying,
                  'Admin'::character varying, 'Accountant'::character varying]::text[]
        )
    );

-- ============================================================================
-- ОСНОВНІ ТАБЛИЦІ
-- ============================================================================

-- Таблиця користувачів
CREATE TABLE public.users (
    userid SERIAL PRIMARY KEY,
    fullname character varying(100) NOT NULL,
    role public.role NOT NULL,
    dateofbirth date NOT NULL,
    contactinfo character varying(200) NOT NULL UNIQUE,
    violationcount integer DEFAULT 0 NOT NULL CHECK (violationcount >= 0),
    isblocked boolean DEFAULT false NOT NULL,
    registration_date timestamp DEFAULT CURRENT_TIMESTAMP,
    password_hash character varying(255),
    db_user name
);

-- Таблиця авторів
CREATE TABLE public.authors (
    authorid SERIAL PRIMARY KEY,
    fullname character varying(100) NOT NULL
);

-- Таблиця книг
CREATE TABLE public.books (
    bookid SERIAL PRIMARY KEY,
    title character varying(200) NOT NULL,
    publisher character varying(100) NOT NULL,
    language public.language_enum NOT NULL,
    year integer NOT NULL CHECK ((year >= 1900) AND (year <= (EXTRACT(year FROM CURRENT_DATE))::integer)),
    location character varying(100) NOT NULL,
    status public.book_status_enum DEFAULT 'New'::public.book_status_enum NOT NULL
);

-- Таблиця жанрів
CREATE TABLE public.genres (
    genreid SERIAL PRIMARY KEY,
    genrename character varying(50) NOT NULL UNIQUE
);

-- Зв'язкова таблиця: книги-автори (багато до багатьох)
CREATE TABLE public.book_authors (
    bookid integer NOT NULL REFERENCES public.books(bookid) ON DELETE CASCADE,
    authorid integer NOT NULL REFERENCES public.authors(authorid) ON DELETE CASCADE,
    PRIMARY KEY (bookid, authorid)
);

-- Зв'язкова таблиця: книги-жанри (багато до багатьох)
CREATE TABLE public.book_genres (
    bookid integer NOT NULL REFERENCES public.books(bookid) ON DELETE CASCADE,
    genreid integer NOT NULL REFERENCES public.genres(genreid) ON DELETE CASCADE,
    PRIMARY KEY (bookid, genreid)
);

-- Таблиця співробітників
CREATE TABLE public.employees (
    employeeid SERIAL PRIMARY KEY,
    userid integer NOT NULL UNIQUE REFERENCES public.users(userid) ON DELETE CASCADE,
    "position" character varying(50) NOT NULL,
    salaryrate numeric(10,2) NOT NULL CHECK (salaryrate >= 0),
    workedhours integer DEFAULT 0 NOT NULL CHECK (workedhours >= 0),
    calculatedsalary numeric(10,2) GENERATED ALWAYS AS ((salaryrate * (workedhours)::numeric)) STORED
);

-- Таблиця типів порушень
CREATE TABLE public.violation_types (
    typeid SERIAL PRIMARY KEY,
    name character varying(100) NOT NULL,
    cost numeric(10,2) NOT NULL CHECK (cost >= 0)
);

-- Таблиця позик
CREATE TABLE public.loans (
    loanid SERIAL PRIMARY KEY,
    userid integer NOT NULL REFERENCES public.users(userid),
    bookid integer NOT NULL REFERENCES public.books(bookid),
    issuedate date DEFAULT CURRENT_DATE NOT NULL,
    duedate date NOT NULL,
    returndate date,
    isreturned boolean DEFAULT false NOT NULL,
    librarianid integer REFERENCES public.users(userid)
);

-- Таблиця штрафів
CREATE TABLE public.fines (
    fineid SERIAL PRIMARY KEY,
    loanid integer NOT NULL REFERENCES public.loans(loanid),
    amount numeric(10,2) NOT NULL CHECK (amount >= 0),
    ispaid boolean DEFAULT false NOT NULL,
    issuedate date DEFAULT CURRENT_DATE NOT NULL,
    paymentdate date
);

-- Таблиця резервацій
CREATE TABLE public.reservations (
    reservationid SERIAL PRIMARY KEY,
    userid integer NOT NULL REFERENCES public.users(userid),
    bookid integer NOT NULL REFERENCES public.books(bookid),
    reservationdate date DEFAULT CURRENT_DATE NOT NULL,
    pickupdate date NOT NULL,
    iscompleted boolean DEFAULT false NOT NULL,
    CONSTRAINT valid_reservation_dates CHECK (pickupdate > reservationdate)
);

-- Таблиця замовлень книг
CREATE TABLE public.orders (
    orderid SERIAL PRIMARY KEY,
    bookid integer REFERENCES public.books(bookid),
    orderdate date DEFAULT CURRENT_DATE NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    totalprice numeric(10,2) NOT NULL CHECK (totalprice >= 0),
    status character varying(50) DEFAULT 'Pending'::character varying NOT NULL
);

-- Таблиця прайс-листа
CREATE TABLE public.price_list (
    pricelistid SERIAL PRIMARY KEY,
    booktitle character varying(200) NOT NULL,
    price numeric(10,2) NOT NULL CHECK (price >= 0)
);

-- ============================================================================
-- ІНДЕКСИ ДЛЯ ОПТИМІЗАЦІЇ ЗАПИТІВ
-- ============================================================================

-- Індекси для таблиці users
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_contactinfo ON public.users(contactinfo);
CREATE INDEX idx_users_isblocked ON public.users(isblocked);

-- Індекси для таблиці books
CREATE INDEX idx_books_title ON public.books USING gin (title gin_trgm_ops);
CREATE INDEX idx_books_status ON public.books(status);
CREATE INDEX idx_books_year ON public.books(year);

-- Індекси для таблиці loans
CREATE INDEX idx_loans_userid ON public.loans(userid);
CREATE INDEX idx_loans_bookid ON public.loans(bookid);
CREATE INDEX idx_loans_isreturned ON public.loans(isreturned);
CREATE INDEX idx_loans_duedate ON public.loans(duedate);

-- Індекси для таблиці fines
CREATE INDEX idx_fines_loanid ON public.fines(loanid);
CREATE INDEX idx_fines_ispaid ON public.fines(ispaid);
CREATE INDEX idx_fines_issuedate ON public.fines(issuedate);

-- Індекси для таблиці reservations
CREATE INDEX idx_reservations_userid ON public.reservations(userid);
CREATE INDEX idx_reservations_bookid ON public.reservations(bookid);
CREATE INDEX idx_reservations_iscompleted ON public.reservations(iscompleted);

-- Індекси для зв'язкових таблиць
CREATE INDEX idx_book_authors_authorid ON public.book_authors(authorid);
CREATE INDEX idx_book_genres_genreid ON public.book_genres(genreid);

-- Коментарі до таблиць
COMMENT ON TABLE public.users IS 'Користувачі системи (читачі та персонал)';
COMMENT ON TABLE public.books IS 'Книги в бібліотеці';
COMMENT ON TABLE public.loans IS 'Видачі книг користувачам';
COMMENT ON TABLE public.fines IS 'Штрафи за прострочені книги';
COMMENT ON TABLE public.reservations IS 'Резервації книг користувачами';
COMMENT ON TABLE public.employees IS 'Інформація про співробітників';
