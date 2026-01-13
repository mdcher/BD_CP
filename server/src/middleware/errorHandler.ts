import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/response/custom-error/CustomError';

interface PostgresError extends Error {
  code: string;
  detail: string;
}

export const errorHandler = (err: PostgresError, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof CustomError) {
    return res.status(err.HttpStatusCode).json(err.JSON);
  }

  // Обробка помилок від PostgreSQL, зокрема RAISE EXCEPTION (код P0001)
  if (err.code === 'P0001' && err.message) {
    console.error(`PostgreSQL User Error: ${err.message}`);
    return res.status(400).json({
      errorType: 'DatabaseLogicError',
      errorMessage: err.message, // Повідомлення з RAISE EXCEPTION
      errors: [err.message],
      errorRaw: err,
      errorsValidation: null,
    });
  }
  
  // Для всіх інших, непередбачених помилок
  console.error(err); // Логуємо помилку для діагностики
  return res.status(500).json({
    errorType: 'InternalServerError',
    errorMessage: 'Something went wrong on the server.',
    errors: [err.message],
    errorRaw: err,
    errorsValidation: null,
  });
};
