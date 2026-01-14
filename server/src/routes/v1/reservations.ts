import { Router } from 'express';
import { ReservationController } from '../../controllers/ReservationController';
import { checkJwt } from '../../middleware/checkJwt';
import { checkRole } from '../../middleware/checkRole';
import { setDatabaseRole } from '../../middleware/setDatabaseRole';
import { UserRole } from '../../orm/entities/User';

const reservationRouter = Router();

// ВАЖЛИВО: Застосовуємо setDatabaseRole для RLS політик
reservationRouter.use(setDatabaseRole);

// Отримати всі активні бронювання (тільки для персоналу)
reservationRouter.get(
  '/all-active',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])],
  ReservationController.getAllActive
);

// Забронювати книгу
reservationRouter.post('/', [checkJwt], ReservationController.create);

// Отримати список моїх бронювань
reservationRouter.get('/my', [checkJwt], ReservationController.getMyReservations);

// Завершити бронювання (тільки для персоналу)
reservationRouter.post(
  '/:id/complete',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])],
  ReservationController.complete
);

// Підтвердити бронювання (тільки для бібліотекарів)
reservationRouter.post(
  '/:id/confirm',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])],
  ReservationController.confirm
);

// Отримати непідтверджені бронювання (для бібліотекарів)
reservationRouter.get(
  '/pending',
  [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])],
  ReservationController.getPending
);

// Скасувати бронювання
reservationRouter.delete('/:id', [checkJwt], ReservationController.cancel);

export default reservationRouter;
