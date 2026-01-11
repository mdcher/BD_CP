import { Router } from 'express';
import { ReservationController } from '../../controllers/ReservationController';
import { checkJwt } from '../../middleware/checkJwt';

const reservationRouter = Router();

// Забронювати книгу
reservationRouter.post('/', [checkJwt], ReservationController.create);

// Отримати список моїх бронювань
reservationRouter.get('/my', [checkJwt], ReservationController.getMyReservations);

// Скасувати бронювання
reservationRouter.delete('/:id', [checkJwt], ReservationController.cancel);

export default reservationRouter;
