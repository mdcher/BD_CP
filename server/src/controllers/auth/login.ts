import { Request, Response, NextFunction } from 'express';
import { getConnection, createConnection } from 'typeorm';
import { JwtPayload } from '../../types/JwtPayload';
import { createJwtToken } from '../../utils/createJwtToken';
import { CustomError } from '../../utils/response/custom-error/CustomError';

export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email: contactInfo, password } = req.body;

    try {
        console.log('🔍 Login attempt:', contactInfo);

        const connection = getConnection();

        // Викликаємо функцію login в БД для отримання інформації про користувача
        const users = await connection.query(
            `SELECT userid, fullname, contactinfo, role::varchar as role, isblocked, db_username
             FROM public.login($1, $2)`,
            [contactInfo, password]
        );

        if (!users || users.length === 0) {
            throw new CustomError(404, 'General', 'Incorrect email or password', ['User not found.']);
        }

        const user = users[0];
        console.log('✅ User found:', { userid: user.userid, role: user.role, db_user: user.db_username });

        // Перевіряємо, чи користувач заблокований
        if (user.isblocked) {
            throw new CustomError(403, 'Forbidden', 'User is blocked', ['Your account has been blocked.']);
        }

        // Перевіряємо автентифікацію через спробу підключення з DB credentials
        if (user.db_username) {
            try {
                // Намагаємось підключитись як цей DB користувач
                const testConnection = await createConnection({
                    name: `test_${user.db_username}_${Date.now()}`,
                    type: 'postgres',
                    host: process.env.POSTGRES_HOST || 'localhost',
                    port: parseInt(process.env.POSTGRES_PORT || '5432'),
                    username: user.db_username,
                    password: password,
                    database: process.env.POSTGRES_DB || 'library_db',
                    synchronize: false,
                    logging: false,
                });

                // Якщо підключення успішне, закриваємо його
                await testConnection.close();
                console.log('✅ DB authentication successful for:', user.db_username);

            } catch (authError: any) {
                console.error('❌ DB authentication failed:', authError.message);
                throw new CustomError(401, 'Unauthorized', 'Incorrect email or password', ['Invalid credentials.']);
            }
        } else {
            // Якщо db_username відсутній, користувач потребує міграції
            console.warn('⚠️ User needs migration:', contactInfo);
            throw new CustomError(403, 'Forbidden', 'Account migration required', [
                'Your account needs to be migrated. Please contact administrator.'
            ]);
        }

        const jwtPayload: JwtPayload = {
            id: user.userid,
            fullName: user.fullname,
            contactInfo: user.contactinfo,
            role: user.role,
        };

        const token = createJwtToken(jwtPayload);
        res.customSuccess(200, 'Token successfully created.', { token });

    } catch (err: any) {
        console.error('❌ Login error:', err.message || err);
        if (err instanceof CustomError) {
            return next(err);
        }
        const customError = new CustomError(500, 'Raw', 'An unexpected error occurred', null, err);
        return next(customError);
    }
};
