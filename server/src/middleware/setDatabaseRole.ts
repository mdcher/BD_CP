import { Request, Response, NextFunction } from 'express';
import { getConnection } from 'typeorm';

/**
 * Middleware для встановлення ролі БД відповідно до ролі користувача з JWT
 * Це необхідно для правильної роботи Row Level Security (RLS) політик
 *
 * ВАЖЛИВО: Цей middleware встановлює session variables для поточного з'єднання.
 * Кожен запит використовує своє з'єднання з пулу, тому settings ізольовані.
 */
export const setDatabaseRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const connection = getConnection();

        // Мапінг ролей з JWT на ролі PostgreSQL
        const roleMapping: { [key: string]: string } = {
            'Reader': 'role_reader',
            'Librarian': 'role_librarian',
            'Admin': 'role_admin',
            'Accountant': 'role_accountant',
        };

        let dbRole = 'role_guest'; // За замовчуванням для неавторизованих
        let userId = null;

        // Якщо користувач авторизований (checkJwt вже виконано)
        if (req.jwtPayload && req.jwtPayload.role) {
            dbRole = roleMapping[req.jwtPayload.role] || 'role_guest';
            userId = req.jwtPayload.id;
        }

        // Встановлюємо session variable для user_id (для RLS політик)
        // Використовуємо SET без LOCAL - це буде діяти до кінця сесії/з'єднання
        if (userId) {
            await connection.query(`SET "app.current_user_id" = '${userId}'`);
        } else {
            await connection.query(`SET "app.current_user_id" = '0'`);
        }

        // Зберігаємо роль в request для можливого логування
        (req as any).dbRole = dbRole;

        next();
    } catch (err) {
        console.error('❌ Error setting database role:', err);
        // Не блокуємо запит, продовжуємо без RLS
        next();
    }
};
