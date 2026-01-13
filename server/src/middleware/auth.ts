import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';
import { JwtPayload } from '../types/JwtPayload';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    console.log('Running authMiddleware...');
    const authHeader = req.get('Authorization');
    console.log('Authorization header:', authHeader);

    if (!authHeader) {
        try {
            const connection = getConnection();
            await connection.query('SET ROLE role_guest');
            console.log('Set role to role_guest');
        } catch (err) {
            console.error('Failed to set role_guest:', err);
        }
        return next();
    }

    const token = authHeader.split(' ')[1];
    console.log('Token:', token);

    let jwtPayload: JwtPayload;
    try {
        jwtPayload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        req.jwtPayload = jwtPayload;
        console.log('JWT payload verified:', jwtPayload);

        if (jwtPayload && jwtPayload.role) {
            const roleMapping: { [key: string]: string } = {
                'Reader': 'role_reader',
                'Librarian': 'role_librarian',
                'Admin': 'role_admin',
                'Accountant': 'role_accountant',
            };

            const dbRole = roleMapping[jwtPayload.role] || 'role_guest';
            const connection = getConnection();
            await connection.query(`SET ROLE "${dbRole}"`);
            console.log(`Set role to ${dbRole}`);
        }
    } catch (err) {
        console.error('JWT verification or role setting error:', err);
        const customError = new CustomError(401, 'Raw', 'JWT error', null, err);
        return next(customError);
    }

    return next();
};
