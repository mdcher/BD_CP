import { Request, Response, NextFunction } from 'express';
import { getConnection } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from '../../types/JwtPayload';
import { createJwtToken } from '../../utils/createJwtToken';
import { CustomError } from '../../utils/response/custom-error/CustomError';

export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { contactInfo, password } = req.body;

    try {
        console.log('🔍 Login attempt:', contactInfo);

        // ВИПРАВЛЕНО: Використовуємо прямий SQL запит з явними типами
        const connection = getConnection();

        // Діагностика БД
        const dbCheck = await connection.query('SELECT current_database() as db, current_user as usr');
        console.log('📌 Connected to DB:', dbCheck[0]);

        // Перевіримо, чи існує таблиця
        const tableCheck = await connection.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') as exists`);
        console.log('📌 Table users exists:', tableCheck[0]);

        // Тестовий запит
        const testQuery = await connection.query('SELECT COUNT(*) FROM public.users');
        console.log('📌 Users count:', testQuery[0]);

        const result = await connection.query(
            `SELECT u.userid, u.fullname, u.contactinfo, u.role::text as role, u.password_hash
             FROM public.users u
             WHERE u.contactinfo = $1::text`,
            [contactInfo]
        );

        console.log('📦 DB result:', result);

        if (!result || result.length === 0) {
            const customError = new CustomError(404, 'General', 'Incorrect email or password', ['User not found.']);
            return next(customError);
        }

        const user = result[0];
        console.log('👤 User found:', { userid: user.userid, role: user.role });

        // Перевіряємо пароль
        const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
        console.log('🔐 Password match:', isPasswordMatch);

        if (!isPasswordMatch) {
            const customError = new CustomError(401, 'Unauthorized', 'Incorrect email or password', ['Password mismatch.']);
            return next(customError);
        }

        const jwtPayload: JwtPayload = {
            id: user.userid,
            fullName: user.fullname,
            contactInfo: user.contactinfo,
            role: user.role,
        };

        const token = createJwtToken(jwtPayload);
        res.customSuccess(200, 'Token successfully created.', `Bearer ${token}`);

    } catch (err) {
        console.error('❌ Login error:', err);
        const customError = new CustomError(500, 'Raw', 'An unexpected error occurred', null, err);
        return next(customError);
    }
};
