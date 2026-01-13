import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomError } from '../utils/response/custom-error/CustomError';
import { JwtPayload } from '../types/JwtPayload';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    console.log('Running authMiddleware...');
    const authHeader = req.get('Authorization');
    console.log('Authorization header:', authHeader);

    if (!authHeader) {
        // Якщо немає Authorization header, користувач залишається неавторизованим
        // Роль role_guest буде встановлена в setDatabaseRole middleware
        console.log('No authorization header, user will be treated as guest');
        return next();
    }

    const token = authHeader.split(' ')[1];
    console.log('Token:', token);

    let jwtPayload: JwtPayload;
    try {
        jwtPayload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        req.jwtPayload = jwtPayload;
        console.log('JWT payload verified:', jwtPayload);

        // Роль БД встановлюється в setDatabaseRole middleware
    } catch (err) {
        console.error('JWT verification error:', err);
        const customError = new CustomError(401, 'Raw', 'JWT error', null, err);
        return next(customError);
    }

    return next();
};
