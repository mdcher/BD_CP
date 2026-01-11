import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/response/custom-error/CustomError';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof CustomError) {
    return res.status(err.HttpStatusCode).json(err.JSON);
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
