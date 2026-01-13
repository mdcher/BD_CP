import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getConnection } from 'typeorm';

import { JwtPayload } from '../types/JwtPayload';
import { createJwtToken } from '../utils/createJwtToken';
import { CustomError } from '../utils/response/custom-error/CustomError';

export const checkJwt = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        const customError = new CustomError(400, 'General', 'Authorization header not provided');
        return next(customError);
    }

    const token = authHeader.split(' ')[1];
    let jwtPayload: { [key: string]: any };
    try {
        jwtPayload = jwt.verify(token, process.env.JWT_SECRET as string) as { [key: string]: any };
        ['iat', 'exp'].forEach((keyToRemove) => delete jwtPayload[keyToRemove]);
        req.jwtPayload = jwtPayload as JwtPayload;
    } catch (err) {
        const customError = new CustomError(401, 'Raw', 'JWT error', null, err);
        return next(customError);
    }

    // Встановлюємо роль БД для RLS (Row Level Security)
    try {
        const roleMapping: { [key: string]: string } = {
            'Reader': 'role_reader',
            'Librarian': 'role_librarian',
            'Admin': 'role_admin',
            'Accountant': 'role_accountant',
        };
        const dbRole = roleMapping[jwtPayload.role] || 'role_reader';
        const connection = getConnection();
        await connection.query(`SET ROLE ${dbRole}`);
    } catch (roleErr) {
        console.warn('⚠️ Could not set database role:', roleErr);
        // Продовжуємо навіть якщо не вдалося встановити роль
    }

    try {
        // Refresh and send a new token on every request
        const newToken = createJwtToken(jwtPayload as JwtPayload);
        res.setHeader('token', `Bearer ${newToken}`);
        return next();
    } catch (err) {
        const customError = new CustomError(400, 'Raw', "Token can't be created", null, err);
        return next(customError);
    }
};
