-- Виправлення прав доступу для view_catalog_extended та інших публічних представлень

-- Надаємо права на читання каталогу для всіх (включно з гостями)
GRANT SELECT ON public.view_catalog_extended TO role_guest, role_reader, role_librarian, role_accountant, role_admin;

-- Надаємо права на читання інших публічних представлень
GRANT SELECT ON public.view_financial_summary TO role_accountant, role_admin;
GRANT SELECT ON public.view_my_history TO role_reader;

-- Надаємо права на читання таблиць книг, авторів і жанрів для гостей (для каталогу)
GRANT SELECT ON public.books TO role_guest;
GRANT SELECT ON public.authors TO role_guest;
GRANT SELECT ON public.genres TO role_guest;
GRANT SELECT ON public.book_authors TO role_guest;
GRANT SELECT ON public.book_genres TO role_guest;
