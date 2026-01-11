import { Request, Response, NextFunction } from 'express';
import { getConnection } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../orm/entities/User';
import { CustomError } from '../../utils/response/custom-error/CustomError';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { fullName, contactInfo, password, dateOfBirth, role } = req.body;

  try {
    // Хешування пароля залишається на боці бекенду - це стандартна практика
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const connection = getConnection();
    await connection.query(
      `CALL public.create_user($1, $2, $3, $4, $5)`,
      [fullName, contactInfo, hashedPassword, dateOfBirth, role || 'Reader']
    );

    res.customSuccess(201, 'User successfully created.');
  } catch (err: any) {
    // Якщо користувач вже існує, база даних може повернути помилку унікальності
    const customError = new CustomError(400, 'Raw', 'Failed to create user.', [err.message]);
    return next(customError);
  }
};
