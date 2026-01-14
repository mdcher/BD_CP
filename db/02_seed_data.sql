SET client_encoding = 'UTF8';

INSERT INTO public.violation_types (name, cost) VALUES
('Прострочення повернення книги', 5.00),
('Пошкодження книги', 50.00),
('Втрата книги', 200.00),
('Порушення правил бібліотеки', 25.00);

INSERT INTO public.genres (genrename) VALUES
('Фантастика'),
('Детектив'),
('Роман'),
('Історія'),
('Наука'),
('Поезія'),
('Біографія'),
('Філософія'),
('Пригоди'),
('Драма');

INSERT INTO public.authors (fullname) VALUES
('Тарас Шевченко'),
('Іван Франко'),
('Леся Українка'),
('Михайло Коцюбинський'),
('Панас Мирний'),
('Олександр Довженко'),
('Ліна Костенко'),
('Василь Стус'),
('Іван Багряний'),
('Григорій Сковорода'),
('Марко Вовчок'),
('Остап Вишня'),
('Ernest Hemingway'),
('Gabriel García Márquez'),
('Haruki Murakami'),
('George Orwell'),
('J.K. Rowling'),
('Stephen King'),
('Agatha Christie'),
('Dan Brown');

INSERT INTO public.users (fullname, role, dateofbirth, contactinfo, password_hash) VALUES
('Іван Іванов', 'Reader', '1995-05-15', 'ivan@mail.com', '$2a$10$gs12d4QKQ4vv8lWlKAIEAusoZ9M4.W9Nd051j0q4iSOTsOQM77.4a'),
('Марія Петренко', 'Reader', '1998-08-20', 'maria@mail.com', '$2a$10$gs12d4QKQ4vv8lWlKAIEAusoZ9M4.W9Nd051j0q4iSOTsOQM77.4a'),
('Петро Сидоренко', 'Reader', '1992-03-10', 'petro@mail.com', '$2a$10$gs12d4QKQ4vv8lWlKAIEAusoZ9M4.W9Nd051j0q4iSOTsOQM77.4a'),
('Оксана Коваль', 'Reader', '2000-11-25', 'oksana@mail.com', '$2a$10$gs12d4QKQ4vv8lWlKAIEAusoZ9M4.W9Nd051j0q4iSOTsOQM77.4a'),
('Андрій Мельник', 'Reader', '1997-07-30', 'andriy@mail.com', '$2a$10$gs12d4QKQ4vv8lWlKAIEAusoZ9M4.W9Nd051j0q4iSOTsOQM77.4a');

INSERT INTO public.users (fullname, role, dateofbirth, contactinfo, password_hash) VALUES
('Олена Бібліотекар', 'Librarian', '1985-04-12', 'librarian@mail.com', '$2a$10$gs12d4QKQ4vv8lWlKAIEAusoZ9M4.W9Nd051j0q4iSOTsOQM77.4a'),
('Сергій Книжник', 'Librarian', '1988-09-05', 'librarian2@mail.com', '$2a$10$gs12d4QKQ4vv8lWlKAIEAusoZ9M4.W9Nd051j0q4iSOTsOQM77.4a');

INSERT INTO public.users (fullname, role, dateofbirth, contactinfo, password_hash) VALUES
('Наталія Фінансист', 'Accountant', '1990-06-18', 'accountant@mail.com', '$2a$10$gs12d4QKQ4vv8lWlKAIEAusoZ9M4.W9Nd051j0q4iSOTsOQM77.4a');

INSERT INTO public.users (fullname, role, dateofbirth, contactinfo, password_hash) VALUES
('Адмін Головний', 'Admin', '1980-01-01', 'admin@mail.com', '$2a$10$gs12d4QKQ4vv8lWlKAIEAusoZ9M4.W9Nd051j0q4iSOTsOQM77.4a');

INSERT INTO public.employees (userid, "position", salaryrate, workedhours) VALUES
(6, 'Бібліотекар', 150.00, 160),
(7, 'Бібліотекар', 150.00, 140),
(8, 'Бухгалтер', 200.00, 160),
(9, 'Директор', 250.00, 160);

INSERT INTO public.books (title, publisher, language, year, location, status) VALUES
('Кобзар', 'Наукова думка', 'Українська', 1940, 'Зал А, полиця 1', 'Good'),
('Захар Беркут', 'Українська книга', 'Українська', 1983, 'Зал А, полиця 2', 'Good'),
('Лісова пісня', 'Освіта', 'Українська', 1911, 'Зал А, полиця 3', 'New'),
('Тіні забутих предків', 'Київ', 'Українська', 1911, 'Зал А, полиця 4', 'Good'),
('Хіба ревуть воли, як ясла повні', 'Дніпро', 'Українська', 1980, 'Зал А, полиця 5', 'Good'),

('1984', 'Penguin Books', 'Англійська', 1949, 'Зал Б, полиця 1', 'New'),
('Animal Farm', 'Penguin Books', 'Англійська', 1945, 'Зал Б, полиця 2', 'Good'),
('Harry Potter and the Philosopher Stone', 'Bloomsbury', 'Англійська', 1997, 'Зал Б, полиця 3', 'New'),
('The Da Vinci Code', 'Doubleday', 'Англійська', 2003, 'Зал Б, полиця 4', 'Good'),
('Murder on the Orient Express', 'Collins Crime Club', 'Англійська', 1934, 'Зал Б, полиця 5', 'Good'),

('The Old Man and the Sea', 'Scribner', 'Англійська', 1952, 'Зал В, полиця 1', 'Good'),
('One Hundred Years of Solitude', 'Harper & Row', 'Англійська', 1967, 'Зал В, полиця 2', 'New'),
('Norwegian Wood', 'Kodansha', 'Англійська', 1987, 'Зал В, полиця 3', 'Good'),
('The Shining', 'Doubleday', 'Англійська', 1977, 'Зал В, полиця 4', 'Good'),
('It', 'Viking', 'Англійська', 1986, 'Зал В, полиця 5', 'Damaged');

INSERT INTO public.book_authors (bookid, authorid) VALUES
(1, 1),   -- Кобзар - Шевченко
(2, 2),   -- Захар Беркут - Франко
(3, 3),   -- Лісова пісня - Леся Українка
(4, 4),   -- Тіні забутих предків - Коцюбинський
(5, 5),   -- Хіба ревуть воли - Панас Мирний
(6, 16),  -- 1984 - Orwell
(7, 16),  -- Animal Farm - Orwell
(8, 17),  -- Harry Potter - Rowling
(9, 20),  -- Da Vinci Code - Brown
(10, 19), -- Murder on Orient Express - Christie
(11, 13), -- Old Man and the Sea - Hemingway
(12, 14), -- 100 Years of Solitude - Márquez
(13, 15), -- Norwegian Wood - Murakami
(14, 18), -- The Shining - King
(15, 18); -- It - King

INSERT INTO public.book_genres (bookid, genreid) VALUES
(1, 6),   -- Кобзар - Поезія
(2, 4),   -- Захар Беркут - Історія
(2, 9),   -- Захар Беркут - Пригоди
(3, 6),   -- Лісова пісня - Поезія
(3, 10),  -- Лісова пісня - Драма
(4, 3),   -- Тіні забутих предків - Роман
(5, 3),   -- Хіба ревуть воли - Роман
(6, 1),   -- 1984 - Фантастика
(7, 1),   -- Animal Farm - Фантастика
(8, 1),   -- Harry Potter - Фантастика
(8, 9),   -- Harry Potter - Пригоди
(9, 2),   -- Da Vinci Code - Детектив
(10, 2),  -- Murder on Orient Express - Детектив
(11, 3),  -- Old Man and the Sea - Роман
(12, 3),  -- 100 Years of Solitude - Роман
(13, 3),  -- Norwegian Wood - Роман
(14, 1),  -- The Shining - Фантастика (жахи)
(15, 1);  -- It - Фантастика (жахи)

INSERT INTO public.price_list (booktitle, price) VALUES
('Кобзар', 150.00),
('1984', 200.00),
('Harry Potter', 250.00),
('The Da Vinci Code', 180.00),
('Захар Беркут', 120.00);

INSERT INTO public.loans (userid, bookid, issuedate, duedate, returndate, isreturned, librarianid) VALUES
(1, 1, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '4 days', NULL, false, 6),
(2, 6, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '9 days', NULL, false, 6),
(3, 8, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '11 days', NULL, false, 7);

INSERT INTO public.loans (userid, bookid, issuedate, duedate, returndate, isreturned, librarianid) VALUES
(4, 10, CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '11 days', NULL, false, 6),
(5, 12, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '16 days', NULL, false, 7);

INSERT INTO public.loans (userid, bookid, issuedate, duedate, returndate, isreturned, librarianid) VALUES
(1, 7, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '16 days', CURRENT_DATE - INTERVAL '15 days', true, 6),
(2, 9, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '5 days', true, 7),
(3, 11, CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '11 days', CURRENT_DATE - INTERVAL '9 days', true, 6);

INSERT INTO public.fines (loanid, amount, ispaid, issuedate, paymentdate, payment_initiated_date, confirmed_by_accountant_id) VALUES
(8, 10.00, true, CURRENT_DATE - INTERVAL '9 days', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '6 days', 8);

INSERT INTO public.fines (loanid, amount, ispaid, issuedate, paymentdate, payment_initiated_date, confirmed_by_accountant_id) VALUES
(4, 70.00, false, CURRENT_DATE - INTERVAL '11 days', NULL, CURRENT_DATE - INTERVAL '2 days', NULL);

INSERT INTO public.fines (loanid, amount, ispaid, issuedate, paymentdate, payment_initiated_date, confirmed_by_accountant_id) VALUES
(5, 80.00, false, CURRENT_DATE - INTERVAL '16 days', NULL, NULL, NULL);

INSERT INTO public.reservations (userid, bookid, reservationdate, pickupdate, iscompleted, isconfirmed, librarianid) VALUES
(1, 14, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '3 days', false, true, 6);

INSERT INTO public.reservations (userid, bookid, reservationdate, pickupdate, iscompleted, isconfirmed, librarianid) VALUES
(2, 15, CURRENT_DATE - INTERVAL '1 day', NULL, false, false, NULL);

INSERT INTO public.reservations (userid, bookid, reservationdate, pickupdate, iscompleted, isconfirmed, librarianid) VALUES
(3, 13, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '1 day', true, true, 7);

INSERT INTO public.orders (orderdate, supplier, totalprice, status) VALUES
(CURRENT_DATE - INTERVAL '30 days', 'Видавництво "Наукова думка"', 1050.00, 'Completed'),
(CURRENT_DATE - INTERVAL '15 days', 'BookChef Publishing', 1400.00, 'In Progress'),
(CURRENT_DATE - INTERVAL '5 days', 'А-БА-БА-ГА-ЛА-МА-ГА', 0.00, 'Pending');

INSERT INTO public.order_items (orderid, pricelistid, quantity) VALUES
-- Замовлення 1 (завершене)
(1, 1, 5),   -- 5 примірників Кобзар
(1, 4, 2),   -- 2 примірники Код да Вінчі
-- Замовлення 2 (в процесі)
(2, 2, 10),  -- 10 примірників 1984
(2, 3, 4),   -- 4 примірники Harry Potter
-- Замовлення 3 (очікує)
(3, 5, 3);   -- 3 примірники Захар Беркут

DO $$
BEGIN
    RAISE NOTICE 'База даних успішно заповнена тестовими даними!';
    RAISE NOTICE 'Логіни та паролі для тестування:';
    RAISE NOTICE '  Читач: ivan@mail.com / password123';
    RAISE NOTICE '  Бібліотекар: librarian@mail.com / password123';
    RAISE NOTICE '  Бухгалтер: accountant@mail.com / password123';
    RAISE NOTICE '  Адмін: admin@mail.com / password123';
END $$;
