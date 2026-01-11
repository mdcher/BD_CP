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

// Скасувати бронювання
reservationRouter.delete('/:id', [checkJwt], ReservationController.cancel);

export default reservationRouter;
