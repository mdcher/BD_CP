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

  // Оплатити штраф (доступ для персоналу)
  payFine: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fineId = Number(req.params.id);
      const accountantId = req.jwtPayload.id;
      const paymentResult = await FineService.payFine(fineId, accountantId);
      res.customSuccess(200, 'Fine paid successfully.', paymentResult);
    } catch (err) {
      next(err);
    }
  },
};
