import { Request, Response, NextFunction } from 'express';
import { FineService } from '../services/FineService';

export const FineController = {
  // Отримати мої неоплачені штрафи
  getMyUnpaid: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.jwtPayload.id;
      const fines = await FineService.getMyUnpaid(userId);
      res.customSuccess(200, 'Your unpaid fines.', fines);
    } catch (err) {
      next(err);
    }
  },
  
  // Оплатити штраф (доступ для персоналу)
  payFine: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fineId = Number(req.params.id);
      const paymentResult = await FineService.payFine(fineId);
      res.customSuccess(200, 'Fine paid successfully.', paymentResult);
    } catch (err) {
      next(err);
    }
  },
};
