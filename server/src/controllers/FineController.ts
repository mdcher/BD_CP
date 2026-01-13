import { Request, Response, NextFunction } from 'express';
import { FineService } from '../services/FineService';

export const FineController = {
  // Отримати мої неоплачені штрафи
  getMyUnpaid: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fines = await FineService.getMyUnpaid();
      res.customSuccess(200, 'Your unpaid fines.', fines);
    } catch (err) {
      next(err);
    }
  },

  // Отримати всі штрафи (для Адмінів/Бухгалтерів)
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fines = await FineService.getAll();
      res.customSuccess(200, 'All fines.', fines);
    } catch (err) {
      next(err);
    }
  },

  // Оплатити штраф (доступ для всіх авторизованих користувачів)
  // Читачі можуть оплачувати тільки свої штрафи (перевірка в процедурі БД)
  payFine: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fineId = Number(req.params.id);
      const userId = req.jwtPayload.id; // ID користувача, який оплачує
      const paymentResult = await FineService.payFine(fineId, userId);
      res.customSuccess(200, 'Fine paid successfully.', paymentResult);
    } catch (err) {
      next(err);
    }
  },
};
