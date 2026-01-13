-- Створення VIEW для роботи з RLS політиками

-- VIEW для неоплачених штрафів читача
CREATE OR REPLACE VIEW public.v_reader_unpaid_fines AS
SELECT
    f.fineid,
    f.loanid,
    f.amount,
    f.ispaid,
    f.issuedate,
    f.paymentdate,
    l.userid,
    l.bookid,
    b.title as book_title
FROM public.fines f
JOIN public.loans l ON f.loanid = l.loanid
JOIN public.books b ON l.bookid = b.bookid
WHERE f.ispaid = false
  AND l.userid = current_setting('app.current_user_id')::integer;

-- VIEW для всіх штрафів (для адмінів/бухгалтерів)
CREATE OR REPLACE VIEW public.v_all_fines AS
SELECT
    f.fineid,
    f.loanid,
    f.amount,
    f.ispaid,
    f.issuedate,
    f.paymentdate,
    l.userid,
    l.bookid,
    u.fullname as user_name,
    b.title as book_title
FROM public.fines f
JOIN public.loans l ON f.loanid = l.loanid
JOIN public.users u ON l.userid = u.userid
JOIN public.books b ON l.bookid = b.bookid
ORDER BY f.issuedate DESC;

-- VIEW для історії позик читача
CREATE OR REPLACE VIEW public.v_reader_loans AS
SELECT
    l.loanid,
    l.userid,
    l.bookid,
    l.issuedate,
    l.duedate,
    l.returndate,
    l.isreturned,
    l.librarianid,
    b.title as book_title,
    b.publisher,
    lib.fullname as librarian_name
FROM public.loans l
JOIN public.books b ON l.bookid = b.bookid
LEFT JOIN public.users lib ON l.librarianid = lib.userid
WHERE l.userid = current_setting('app.current_user_id')::integer;

-- VIEW для резервацій читача
CREATE OR REPLACE VIEW public.v_reader_reservations AS
SELECT
    r.reservationid,
    r.userid,
    r.bookid,
    r.reservationdate,
    r.pickupdate,
    r.iscompleted,
    b.title as book_title,
    b.publisher,
    b.status as book_status
FROM public.reservations r
JOIN public.books b ON r.bookid = b.bookid
WHERE r.userid = current_setting('app.current_user_id')::integer;

-- VIEW для всіх активних резервацій (для персоналу)
CREATE OR REPLACE VIEW public.v_all_active_reservations AS
SELECT
    r.reservationid,
    r.userid,
    r.bookid,
    r.reservationdate,
    r.pickupdate,
    r.iscompleted,
    u.fullname as user_name,
    u.contactinfo,
    b.title as book_title,
    b.publisher,
    b.status as book_status
FROM public.reservations r
JOIN public.users u ON r.userid = u.userid
JOIN public.books b ON r.bookid = b.bookid
WHERE r.iscompleted = false;

-- VIEW для всіх користувачів (для адмінів)
CREATE OR REPLACE VIEW public.v_all_users_for_admin AS
SELECT
    u.userid,
    u.fullname,
    u.contactinfo,
    u.role,
    u.isblocked,
    u.registration_date,
    COUNT(DISTINCT l.loanid) as total_loans,
    COUNT(DISTINCT r.reservationid) as total_reservations,
    COUNT(DISTINCT f.fineid) as total_fines,
    SUM(CASE WHEN f.ispaid = false THEN f.amount ELSE 0 END) as unpaid_fines_amount
FROM public.users u
LEFT JOIN public.loans l ON u.userid = l.userid
LEFT JOIN public.reservations r ON u.userid = r.userid
LEFT JOIN public.fines f ON l.loanid = f.loanid
GROUP BY u.userid, u.fullname, u.contactinfo, u.role, u.isblocked, u.registration_date;

-- Надаємо права на перегляд VIEW
GRANT SELECT ON public.v_reader_unpaid_fines TO role_reader;
GRANT SELECT ON public.v_reader_loans TO role_reader;
GRANT SELECT ON public.v_reader_reservations TO role_reader;

GRANT SELECT ON public.v_all_fines TO role_admin, role_accountant;
GRANT SELECT ON public.v_all_active_reservations TO role_librarian, role_admin;
GRANT SELECT ON public.v_all_users_for_admin TO role_admin, role_librarian;
