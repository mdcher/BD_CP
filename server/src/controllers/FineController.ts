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

  // Ініціювати оплату штрафу (для читачів)
  initiatePayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fineId = Number(req.params.id);
      const userId = req.jwtPayload.id;
      const result = await FineService.initiatePayment(fineId, userId);
      res.customSuccess(200, result.message, result);
    } catch (err) {
      next(err);
    }
  },

  // Підтвердити оплату штрафу (для бухгалтерів)
  confirmPayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fineId = Number(req.params.id);
      const accountantId = req.jwtPayload.id;
      const { approve } = req.body; // true або false
      const result = await FineService.confirmPayment(fineId, accountantId, approve !== false);
      res.customSuccess(200, result.message, result);
    } catch (err) {
      next(err);
    }
  },

  // Отримати непідтверджені платежі (для бухгалтерів)
  getPendingPayments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payments = await FineService.getPendingPayments();
      res.customSuccess(200, 'Pending fine payments.', payments);
    } catch (err) {
      next(err);
    }
  },

  // Отримати статистику штрафів (для адмінів/бухгалтерів)
  getStatistics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await FineService.getStatistics();
      res.customSuccess(200, 'Fine statistics.', statistics);
    } catch (err) {
      next(err);
    }
  },
};
