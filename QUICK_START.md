# Швидкий старт системи управління бібліотекою

## Виправлені проблеми

### 1. Пошкоджені файли сервера
Відновлено файли з неповним кодом:
- `server/src/controllers/auth/login.ts` - виправлено формат запиту та відповіді
- `server/src/index.ts` - відновлено повний код
- `server/src/middleware/auth.ts` - відновлено middleware автентифікації
- `server/src/routes/v1/index.ts` - додано всі маршрути з authMiddleware

### 2. Проблема з автентифікацією
- Виправлено формат запиту: тепер клієнт відправляє `{email, password}`, сервер коректно обробляє як `{email: contactInfo, password}`
- Виправлено формат відповіді: тепер сервер повертає `{message, data: {token}}` замість `Bearer ${token}`

### 3. База даних
Створено тестові дані:
- **Користувачі** (пароль для всіх: `password123`):
  - `admin@example.com` - Admin
  - `librarian@example.com` - Librarian
  - `reader@example.com` - Reader
  - `accountant@example.com` - Accountant

- **Книги**: додано 5 тестових книг з українських авторів

- **Права доступу**: виправлено права на view_catalog_extended для гостей та всіх ролей

## Запуск проекту

### Сервер
```bash
cd server
npm run dev
```
Сервер запуститься на http://localhost:4000

### Клієнт
```bash
cd client
npm run dev
```
Клієнт запуститься на http://localhost:5173

## Тестування

### API
```bash
# Вхід
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Отримати каталог книг (без авторизації)
curl http://localhost:4000/api/v1/books

# Отримати каталог книг (з авторизацією)
curl http://localhost:4000/api/v1/books \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Web-інтерфейс
1. Відкрийте http://localhost:5173
2. Натисніть "Увійти"
3. Використайте облікові дані:
   - Email: `admin@example.com`
   - Пароль: `password123`
4. Після входу ви зможете:
   - Переглядати каталог книг
   - Управляти книгами (для Admin/Librarian)
   - Переглядати історію (для Reader)

## Корисні SQL-скрипти

### Відновлення бази даних
```bash
PGPASSWORD=1473 psql -U postgres -d library_db -f db/init.sql
```

### Додавання тестових даних
```bash
PGPASSWORD=1473 psql -U postgres -d library_db -f db/seed_test_users.sql
```

### Виправлення прав доступу
```bash
PGPASSWORD=1473 psql -U postgres -d library_db -f db/fix_permissions.sql
```

### Надання права Librarian створювати користувачів
```bash
PGPASSWORD=1473 psql -U postgres -d library_db -f db/grant_librarian_create_user.sql
```

## Структура проекту

```
Library/
├── client/              # React + TypeScript фронтенд
│   ├── src/
│   │   ├── features/   # API та бізнес-логіка
│   │   ├── routes/     # TanStack Router сторінки
│   │   ├── store/      # Zustand стан
│   │   └── lib/        # Axios конфігурація
│   └── package.json
├── server/              # Express + TypeORM бекенд
│   ├── src/
│   │   ├── controllers/   # API контролери
│   │   ├── middleware/    # Auth, transaction middleware
│   │   ├── routes/        # API маршрути
│   │   └── services/      # Бізнес-логіка
│   ├── config/
│   │   └── .env          # Конфігурація БД
│   └── package.json
└── db/                  # SQL скрипти
    ├── init.sql         # Ініціалізація БД
    ├── seed_test_users.sql  # Тестові дані
    └── fix_permissions.sql  # Виправлення прав
```

## Відомі проблеми та їх вирішення

### Проблема: "User not found"
**Рішення**: Переконайтеся, що ви виконали `db/seed_test_users.sql` для створення тестових користувачів

### Проблема: "permission denied for view view_catalog_extended"
**Рішення**: Виконайте `db/fix_permissions.sql` для надання прав доступу

### Проблема: Сервер не запускається
**Рішення**:
1. Перевірте, що PostgreSQL запущено
2. Перевірте конфігурацію в `server/config/.env`
3. Переконайтеся, що база даних `library_db` створена

## Технології

### Backend
- Node.js + Express
- TypeScript
- TypeORM
- PostgreSQL
- JWT автентифікація
- Row Level Security (RLS)

### Frontend
- React 18
- TypeScript
- TanStack Router
- TanStack Query (React Query)
- Zustand (стейт-менеджмент)
- Tailwind CSS
- React Hook Form + Zod

## Контакти та підтримка

Якщо виникли проблеми:
1. Перевірте логи сервера: `server/log/access.log`
2. Перевірте консоль браузера для помилок фронтенду
3. Перевірте, що всі SQL скрипти виконано успішно
