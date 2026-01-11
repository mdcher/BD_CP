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
