import { Router } from 'express';
import { FineController } from '../../controllers/FineController';
import { checkJwt } from '../../middleware/checkJwt';
import { checkRole } from '../../middleware/checkRole';
import { setDatabaseRole } from '../../middleware/setDatabaseRole';
import { UserRole } from '../../orm/entities/User';

const fineRouter = Router();

// ВАЖЛИВО: Застосовуємо setDatabaseRole для RLS політик
fineRouter.use(setDatabaseRole);

// Маршрут для адмінів/бухгалтерів для перегляду всіх штрафів
fineRouter.get(
  '/',
  [checkJwt, checkRole([UserRole.Admin, 'Accountant' as UserRole])],
  FineController.getAll
);

// Маршрут для користувача, щоб побачити свої неоплачені штрафи
fineRouter.get('/my-unpaid', [checkJwt], FineController.getMyUnpaid);

// Маршрут для оплати штрафу (доступний для всіх авторизованих користувачів)
// Читачі можуть оплачувати тільки свої штрафи (контроль в процедурі БД)
// Бухгалтери та Адміни можуть оплачувати будь-які штрафи
fineRouter.post(
  '/:id/pay',
  [checkJwt], // Дозволяємо всім авторизованим користувачам (контроль прав у БД)
  FineController.payFine
);

// Ініціювати оплату штрафу (для читачів)
fineRouter.post(
  '/:id/initiate-payment',
  [checkJwt],
  FineController.initiatePayment
);

// Підтвердити оплату штрафу (для бухгалтерів)
fineRouter.post(
  '/:id/confirm-payment',
  [checkJwt, checkRole(['Accountant' as UserRole, UserRole.Admin])],
  FineController.confirmPayment
);

// Отримати непідтверджені платежі (для бухгалтерів)
fineRouter.get(
  '/pending-payments',
  [checkJwt, checkRole(['Accountant' as UserRole, UserRole.Admin])],
  FineController.getPendingPayments
);

// Отримати статистику штрафів (для адмінів/бухгалтерів)
fineRouter.get(
  '/statistics',
  [checkJwt, checkRole(['Accountant' as UserRole, UserRole.Admin])],
  FineController.getStatistics
);

export default fineRouter;
