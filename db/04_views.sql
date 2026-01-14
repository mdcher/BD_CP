SET client_encoding = 'UTF8';

CREATE OR REPLACE VIEW public.view_active_debtors AS
SELECT
    u.fullname,
    u.contactinfo,
    b.title AS book_title,
    l.duedate,
    (CURRENT_DATE - l.duedate) AS days_overdue
FROM loans l
JOIN users u ON l.userid = u.userid
JOIN books b ON l.bookid = b.bookid
WHERE l.isreturned = false AND l.duedate < CURRENT_DATE;


CREATE OR REPLACE VIEW public.view_catalog_extended AS
SELECT
    b.bookid,
    b.title,
    b.publisher,
    b.year,
    b.status AS physicalstatus,
    b.location,
    string_agg(DISTINCT a.fullname::text, ', ') AS authors,
    string_agg(DISTINCT g.genrename::text, ', ') AS genres,
    CASE
        WHEN b.status = 'Lost' THEN 'Unavailable'
        WHEN EXISTS (
            SELECT 1 FROM loans l
            WHERE l.bookid = b.bookid AND l.isreturned = false
        ) THEN 'Loaned'
        WHEN EXISTS (
            SELECT 1 FROM reservations r
            WHERE r.bookid = b.bookid AND r.iscompleted = false
        ) THEN 'Reserved'
        ELSE 'Available'
    END AS availabilitystatus
FROM books b
LEFT JOIN book_authors ba ON b.bookid = ba.bookid
LEFT JOIN authors a ON ba.authorid = a.authorid
LEFT JOIN book_genres bg ON b.bookid = bg.bookid
LEFT JOIN genres g ON bg.genreid = g.genreid
GROUP BY b.bookid;


CREATE OR REPLACE VIEW public.view_financial_summary AS
SELECT
    COALESCE((
        SELECT SUM(f.amount)
        FROM fines f
        WHERE f.ispaid = true
    ), 0) AS totalincomefines,
    COALESCE((
        SELECT SUM(o.totalprice)
        FROM orders o
        WHERE o.status IN ('Completed', 'In Progress')
    ), 0) AS expensesbooks,
    COALESCE((
        SELECT SUM(e.calculatedsalary)
        FROM employees e
    ), 0) AS expensessalaries,
    (
        COALESCE((SELECT SUM(f.amount) FROM fines f WHERE f.ispaid = true), 0) -
        COALESCE((SELECT SUM(o.totalprice) FROM orders o WHERE o.status IN ('Completed', 'In Progress')), 0) -
        COALESCE((SELECT SUM(e.calculatedsalary) FROM employees e), 0)
    ) AS netbalance,
    CURRENT_DATE AS reportdate;


CREATE OR REPLACE VIEW public.view_my_history AS
SELECT
    l.userid,
    l.issuedate AS eventdate,
    'Loan' AS eventtype,
    b.title AS description,
    CASE
        WHEN l.isreturned THEN 'Returned'
        WHEN l.duedate < CURRENT_DATE THEN 'Overdue!'
        ELSE 'Active'
    END AS status,
    0.00 AS amount
FROM loans l
JOIN books b ON l.bookid = b.bookid
UNION ALL
SELECT
    l.userid,
    f.issuedate AS eventdate,
    'Fine' AS eventtype,
    'Штраф: ' || f.amount || ' грн' AS description,
    CASE WHEN f.ispaid THEN 'Paid' ELSE 'Unpaid' END AS status,
    f.amount
FROM fines f
JOIN loans l ON f.loanid = l.loanid;


CREATE OR REPLACE VIEW public.view_author_ratings AS
WITH author_book_counts AS (
    SELECT
        a.authorid,
        a.fullname,
        COUNT(ba.bookid) AS total_books
    FROM authors a
    LEFT JOIN book_authors ba ON a.authorid = ba.authorid
    GROUP BY a.authorid, a.fullname
)
SELECT
    fullname,
    total_books,
    DENSE_RANK() OVER (ORDER BY total_books DESC) AS rank_by_books
FROM author_book_counts;


CREATE OR REPLACE VIEW public.view_genre_popularity AS
WITH book_loan_stats AS (
    SELECT
        b.title,
        g.genrename,
        COUNT(l.loanid) AS loan_count,
        RANK() OVER (PARTITION BY g.genrename ORDER BY COUNT(l.loanid) DESC) AS rank_in_genre
    FROM books b
    JOIN book_genres bg ON b.bookid = bg.bookid
    JOIN genres g ON bg.genreid = g.genreid
    LEFT JOIN loans l ON b.bookid = l.bookid
    GROUP BY b.title, g.genrename
)
SELECT title, genrename, loan_count
FROM book_loan_stats
WHERE rank_in_genre = 1;


CREATE OR REPLACE VIEW public.v_all_users_for_admin AS
SELECT
    u.userid,
    u.fullname,
    u.role,
    u.dateofbirth,
    u.contactinfo,
    u.violationcount,
    u.isblocked,
    u.registration_date,
    COUNT(DISTINCT l.loanid) as total_loans,
    COUNT(DISTINCT r.reservationid) as total_reservations,
    COUNT(DISTINCT f.fineid) FILTER (WHERE f.ispaid = false) as unpaid_fines_count,
    SUM(CASE WHEN f.ispaid = false THEN f.amount ELSE 0 END) as unpaid_fines_amount
FROM public.users u
LEFT JOIN public.loans l ON u.userid = l.userid
LEFT JOIN public.reservations r ON u.userid = r.userid
LEFT JOIN public.fines f ON l.loanid = f.loanid
GROUP BY u.userid, u.fullname, u.role, u.dateofbirth, u.contactinfo,
         u.violationcount, u.isblocked, u.registration_date;


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
  AND l.userid = NULLIF(current_setting('app.current_user_id', true), '')::integer;


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
    u.contactinfo,
    b.title as book_title
FROM public.fines f
JOIN public.loans l ON f.loanid = l.loanid
JOIN public.users u ON l.userid = u.userid
JOIN public.books b ON l.bookid = b.bookid
ORDER BY f.issuedate DESC;


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
    lib.fullname as librarian_name,
    CASE
        WHEN l.isreturned = false AND l.duedate < CURRENT_DATE THEN 'Overdue'
        WHEN l.isreturned = false THEN 'Active'
        ELSE 'Returned'
    END as loan_status
FROM public.loans l
JOIN public.books b ON l.bookid = b.bookid
LEFT JOIN public.users lib ON l.librarianid = lib.userid
WHERE l.userid = NULLIF(current_setting('app.current_user_id', true), '')::integer;


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
WHERE r.userid = NULLIF(current_setting('app.current_user_id', true), '')::integer;


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


CREATE OR REPLACE VIEW public.view_demand_forecast AS
WITH book_stats AS (
    SELECT
        b.title,
        COUNT(DISTINCT b.bookid) as total_copies,
        COUNT(DISTINCT CASE WHEN l.isreturned = false THEN l.loanid END) as active_loans,
        COUNT(DISTINCT r.reservationid) FILTER (WHERE r.iscompleted = false) as active_reservations,
        COUNT(l.loanid) as total_historical_loans,
        AVG(CASE WHEN l.isreturned = true THEN l.returndate - l.issuedate END) as avg_loan_duration
    FROM public.books b
    LEFT JOIN public.loans l ON b.bookid = l.bookid
    LEFT JOIN public.reservations r ON b.bookid = r.bookid
    WHERE b.status != 'Lost'
    GROUP BY b.title
)
SELECT
    title,
    total_copies,
    active_loans,
    active_reservations,
    total_historical_loans,
    ROUND(avg_loan_duration, 1) as avg_loan_duration_days,
    CASE
        WHEN total_copies > 0 THEN
            ROUND((active_loans::numeric / total_copies::numeric) * 100, 1)
        ELSE 0
    END as utilization_percentage,
    CASE
        WHEN total_copies > 0 AND (active_loans::numeric / total_copies::numeric) >= 0.8 THEN 'Високий попит'
        WHEN total_copies > 0 AND (active_loans::numeric / total_copies::numeric) >= 0.5 THEN 'Середній попит'
        ELSE 'Низький попит'
    END as demand_status,
    CASE
        WHEN total_copies > 0 AND (active_loans::numeric / total_copies::numeric) >= 0.8 THEN true
        ELSE false
    END as needs_ordering
FROM book_stats
ORDER BY utilization_percentage DESC;


CREATE OR REPLACE VIEW public.view_fine_statistics AS
SELECT
    DATE_TRUNC('month', f.issuedate) as month,
    COUNT(f.fineid) as total_fines,
    COUNT(CASE WHEN f.ispaid = true THEN 1 END) as paid_fines,
    COUNT(CASE WHEN f.ispaid = false AND f.payment_initiated_date IS NOT NULL THEN 1 END) as pending_confirmation,
    COUNT(CASE WHEN f.ispaid = false AND f.payment_initiated_date IS NULL THEN 1 END) as unpaid_fines,
    SUM(f.amount) as total_amount,
    SUM(CASE WHEN f.ispaid = true THEN f.amount ELSE 0 END) as paid_amount,
    SUM(CASE WHEN f.ispaid = false THEN f.amount ELSE 0 END) as outstanding_amount
FROM public.fines f
GROUP BY DATE_TRUNC('month', f.issuedate)
ORDER BY month DESC;


CREATE OR REPLACE VIEW public.view_user_activity_stats AS
SELECT
    u.userid,
    u.fullname,
    u.role,
    u.isblocked,
    u.violationcount,
    COUNT(DISTINCT l.loanid) as total_loans,
    COUNT(DISTINCT CASE WHEN l.isreturned = false THEN l.loanid END) as active_loans,
    COUNT(DISTINCT r.reservationid) as total_reservations,
    COUNT(DISTINCT f.fineid) as total_fines,
    SUM(CASE WHEN f.ispaid = false THEN f.amount ELSE 0 END) as outstanding_fines_amount,
    MAX(l.issuedate) as last_loan_date,
    CASE
        WHEN MAX(l.issuedate) >= CURRENT_DATE - INTERVAL '30 days' THEN 'Активний'
        WHEN MAX(l.issuedate) >= CURRENT_DATE - INTERVAL '90 days' THEN 'Помірно активний'
        WHEN MAX(l.issuedate) IS NOT NULL THEN 'Неактивний'
        ELSE 'Новий користувач'
    END as activity_status
FROM public.users u
LEFT JOIN public.loans l ON u.userid = l.userid
LEFT JOIN public.reservations r ON u.userid = r.userid
LEFT JOIN public.fines f ON l.loanid = f.loanid
WHERE u.role = 'Reader'
GROUP BY u.userid, u.fullname, u.role, u.isblocked, u.violationcount
ORDER BY total_loans DESC;


CREATE OR REPLACE VIEW public.view_pending_fine_payments AS
SELECT
    f.fineid,
    f.amount,
    f.issuedate,
    f.payment_initiated_date,
    l.loanid,
    l.userid,
    u.fullname as user_name,
    u.contactinfo,
    b.title as book_title,
    (CURRENT_DATE - f.payment_initiated_date) as days_pending
FROM public.fines f
JOIN public.loans l ON f.loanid = l.loanid
JOIN public.users u ON l.userid = u.userid
JOIN public.books b ON l.bookid = b.bookid
WHERE f.ispaid = false
  AND f.payment_initiated_date IS NOT NULL
ORDER BY f.payment_initiated_date ASC;


CREATE OR REPLACE VIEW public.view_pending_reservations AS
SELECT
    r.reservationid,
    r.reservationdate,
    r.userid,
    u.fullname as user_name,
    u.contactinfo,
    r.bookid,
    b.title as book_title,
    b.status as book_status,
    (CURRENT_DATE - r.reservationdate) as days_waiting,
    -- Перевірка доступності книги
    CASE
        WHEN EXISTS (
            SELECT 1 FROM public.loans l
            WHERE l.bookid = r.bookid AND l.isreturned = false
        ) THEN 'Книга зараз видана'
        WHEN b.status = 'Lost' THEN 'Книга втрачена'
        WHEN b.status = 'Damaged' THEN 'Книга пошкоджена'
        ELSE 'Книга доступна'
    END as availability_status
FROM public.reservations r
JOIN public.users u ON r.userid = u.userid
JOIN public.books b ON r.bookid = b.bookid
WHERE r.isconfirmed = false
  AND r.iscompleted = false
ORDER BY r.reservationdate ASC;


CREATE OR REPLACE VIEW public.view_orders_detailed AS
SELECT
    o.orderid,
    o.orderdate,
    o.supplier,
    o.status,
    o.totalprice,
    COUNT(oi.pricelistid) as items_count,
    STRING_AGG(pl.booktitle || ' (x' || oi.quantity || ')', ', ') as items_list
FROM public.orders o
LEFT JOIN public.order_items oi ON o.orderid = oi.orderid
LEFT JOIN public.price_list pl ON oi.pricelistid = pl.pricelistid
GROUP BY o.orderid, o.orderdate, o.supplier, o.status, o.totalprice
ORDER BY o.orderdate DESC;


CREATE OR REPLACE VIEW public.view_employees_detailed AS
SELECT
    e.employeeid,
    u.userid,
    u.fullname,
    u.contactinfo,
    u.role,
    e.position,
    e.salaryrate,
    e.workedhours,
    e.calculatedsalary,
    u.dateofbirth
FROM public.employees e
JOIN public.users u ON e.userid = u.userid
ORDER BY e.employeeid;


GRANT SELECT ON public.view_active_debtors TO role_librarian, role_admin;
GRANT SELECT ON public.view_catalog_extended TO role_reader, role_librarian, role_admin;
GRANT SELECT ON public.view_financial_summary TO role_accountant, role_admin;
GRANT SELECT ON public.view_my_history TO role_reader;
GRANT SELECT ON public.view_author_ratings TO role_reader, role_librarian, role_admin;
GRANT SELECT ON public.view_genre_popularity TO role_reader, role_librarian, role_admin;

GRANT SELECT ON public.v_all_users_for_admin TO role_admin, role_librarian;
GRANT SELECT ON public.v_reader_unpaid_fines TO role_reader;
GRANT SELECT ON public.v_all_fines TO role_admin, role_accountant;
GRANT SELECT ON public.v_reader_loans TO role_reader;
GRANT SELECT ON public.v_reader_reservations TO role_reader;
GRANT SELECT ON public.v_all_active_reservations TO role_librarian, role_admin;

GRANT SELECT ON public.view_demand_forecast TO role_admin, role_librarian;
GRANT SELECT ON public.view_fine_statistics TO role_admin, role_accountant;
GRANT SELECT ON public.view_user_activity_stats TO role_admin, role_librarian;
GRANT SELECT ON public.view_pending_fine_payments TO role_accountant, role_admin;
GRANT SELECT ON public.view_pending_reservations TO role_librarian, role_admin;
GRANT SELECT ON public.view_orders_detailed TO role_admin, role_accountant;
GRANT SELECT ON public.view_employees_detailed TO role_admin, role_accountant;

DO $$
BEGIN
    RAISE NOTICE '✅ Представлення (views) успішно створено!';
END $$;
