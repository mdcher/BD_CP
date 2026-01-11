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

        const connection = getConnection();

        const users = await connection.query('SELECT * FROM login($1)', [contactInfo]);

        if (!users || users.length === 0) {
            throw new CustomError(404, 'General', 'Incorrect email or password', ['User not found.']);
        }

        const user = users[0];
        console.log('✅ User found:', { userid: user.userid, role: user.role });

        const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordMatch) {
            throw new CustomError(401, 'Unauthorized', 'Incorrect email or password', ['Password mismatch.']);
        }

        const jwtPayload: JwtPayload = {
            id: user.userid,
            fullName: user.fullname,
            contactInfo: user.contactinfo,
            role: user.role,
        };

        const token = createJwtToken(jwtPayload);
        res.customSuccess(200, 'Token successfully created.', `Bearer ${token}`);

    } catch (err: any) {
        console.error('❌ Login error:', err.message || err);
        if (err instanceof CustomError) {
            return next(err);
        }
        const customError = new CustomError(500, 'Raw', 'An unexpected error occurred', null, err);
        return next(customError);
    }
};