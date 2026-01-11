import { Request, Response, NextFunction } from 'express';
import { getConnection } from 'typeorm';

/**
 * Middleware для встановлення ролі БД відповідно до ролі користувача з JWT
 * Це необхідно для правильної роботи Row Level Security (RLS) політик
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

        // Якщо користувач авторизований (checkJwt вже виконано)
        if (req.jwtPayload && req.jwtPayload.role) {
            dbRole = roleMapping[req.jwtPayload.role] || 'role_guest';
        }

        // Встановлюємо роль для цього з'єднання
        // ВАЖЛИВО: використовуємо SET LOCAL ROLE для застосування тільки в межах транзакції
        await connection.query(`SET LOCAL ROLE ${dbRole}`);

        next();
    } catch (err) {
        console.error('❌ Error setting database role:', err);
        // Не блокуємо запит, якщо не вдалося встановити роль
        next();
    }
};
