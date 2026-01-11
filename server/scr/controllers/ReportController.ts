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
};
