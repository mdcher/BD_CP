import { Router } from 'express';
import { ReportController } from '../../controllers/ReportController';
import { checkJwt } from '../../middleware/checkJwt';
import { checkRole } from '../../middleware/checkRole';
import { setDatabaseRole } from '../../middleware/setDatabaseRole';
import { UserRole } from '../../orm/entities/User';

const reportRouter = Router();

// ВАЖЛИВО: Застосовуємо setDatabaseRole для RLS політик
reportRouter.use(setDatabaseRole);

// Звіт про боржників (для бібліотекарів та адмінів)
reportRouter.get(
  '/debtors',
  [checkJwt, checkRole([UserRole.Admin, UserRole.Librarian])],
  ReportController.getActiveDebtors
);

// Фінансовий звіт (для бухгалтерів та адмінів)
reportRouter.get(
  '/financial-summary',
  [checkJwt, checkRole([UserRole.Admin, 'Accountant' as UserRole])],
  ReportController.getFinancialSummary
);

// Рейтинг авторів (доступний усім авторизованим)
reportRouter.get(
  '/author-ratings',
  [checkJwt],
  ReportController.getAuthorRatings
);

// Популярність жанрів (доступний усім авторизованим)
reportRouter.get(
  '/genre-popularity',
  [checkJwt],
  ReportController.getGenrePopularity
);

// Статистика читання (для персоналу)
reportRouter.get(
  '/reading-statistics',
  [checkJwt, checkRole([UserRole.Admin, UserRole.Librarian])],
  ReportController.getReadingStatistics
);

// Топ читачів (для персоналу)
reportRouter.get(
  '/top-readers',
  [checkJwt, checkRole([UserRole.Admin, UserRole.Librarian])],
  ReportController.getTopReaders
);

export default reportRouter;
