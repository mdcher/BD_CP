-- Додавання тестових користувачів
-- Пароль для всіх: password123
-- bcrypt hash: $2a$10$RVEwku4./tis/XHylpYf1e6i0x/c6fdQjYrpqnbLUCGkfuJBoBnWO

INSERT INTO public.users (fullname, contactinfo, password_hash, dateofbirth, role)
VALUES
    ('Admin User', 'admin@example.com', '$2a$10$RVEwku4./tis/XHylpYf1e6i0x/c6fdQjYrpqnbLUCGkfuJBoBnWO', '1990-01-01', 'Admin'),
    ('Librarian User', 'librarian@example.com', '$2a$10$RVEwku4./tis/XHylpYf1e6i0x/c6fdQjYrpqnbLUCGkfuJBoBnWO', '1992-05-15', 'Librarian'),
    ('Reader User', 'reader@example.com', '$2a$10$RVEwku4./tis/XHylpYf1e6i0x/c6fdQjYrpqnbLUCGkfuJBoBnWO', '1995-08-20', 'Reader'),
    ('Accountant User', 'accountant@example.com', '$2a$10$RVEwku4./tis/XHylpYf1e6i0x/c6fdQjYrpqnbLUCGkfuJBoBnWO', '1988-03-10', 'Accountant');

-- Додавання тестових книг
INSERT INTO public.authors (fullname)
VALUES
    ('Тарас Шевченко'),
    ('Леся Українка'),
    ('Іван Франко');

INSERT INTO public.books (title, publisher, language, year, location, status)
VALUES
    ('Кобзар', 'Наукова думка', 'Українська', 2020, 'Полиця A-1', 'Good'),
    ('Лісова пісня', 'Видавництво', 'Українська', 2019, 'Полиця A-2', 'Good'),
    ('Захар Беркут', 'Освіта', 'Українська', 2018, 'Полиця A-3', 'Good'),
    ('Камінний хрест', 'Книголюб', 'Українська', 2021, 'Полиця B-1', 'New'),
    ('Тіні забутих предків', 'Фоліо', 'Українська', 2017, 'Полиця B-2', 'Good');
