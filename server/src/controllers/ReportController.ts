import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/ReportService';

export const ReportController = {
  // Звіт про боржників
  getActiveDebtors: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ReportService.getActiveDebtors();
      res.customSuccess(200, 'Active debtors report.', data);
    } catch (err) {
      next(err);
    }
  },

  // Фінансовий звіт
  getFinancialSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ReportService.getFinancialSummary();
      res.customSuccess(200, 'Financial summary.', data);
    } catch (err) {
      next(err);
    }
  },

  // Рейтинг авторів
  getAuthorRatings: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ReportService.getAuthorRatings();
      res.customSuccess(200, 'Author ratings.', data);
    } catch (err) {
      next(err);
    }
  },

  // Популярність жанрів
  getGenrePopularity: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ReportService.getGenrePopularity();
      res.customSuccess(200, 'Genre popularity.', data);
    } catch (err) {
      next(err);
    }
  },

  // Статистика читання
  getReadingStatistics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ReportService.getReadingStatistics();
      res.customSuccess(200, 'Reading statistics.', data);
    } catch (err) {
      next(err);
    }
  },

  // Топ читачів
  getTopReaders: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const data = await ReportService.getTopReaders(limit);
      res.customSuccess(200, 'Top readers.', data);
    } catch (err) {
      next(err);
    }
  },

  // Прогнозування попиту
  getDemandForecast: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ReportService.getDemandForecast();
      res.customSuccess(200, 'Demand forecast.', data);
    } catch (err) {
      next(err);
    }
  },

  // Статистика активності користувачів
  getUserActivityStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ReportService.getUserActivityStats();
      res.customSuccess(200, 'User activity statistics.', data);
    } catch (err) {
      next(err);
    }
  },

  // Детальна інформація про замовлення
  getOrdersDetailed: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ReportService.getOrdersDetailed();
      res.customSuccess(200, 'Orders detailed.', data);
    } catch (err) {
      next(err);
    }
  },

  // Активні видачі книг
  getActiveLoans: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ReportService.getActiveLoans();
      res.customSuccess(200, 'Active loans.', data);
    } catch (err) {
      next(err);
    }
  },
};
