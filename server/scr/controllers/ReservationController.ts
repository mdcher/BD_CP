import { Request, Response, NextFunction } from 'express';
import { ReservationService } from '../services/ReservationService';

export const ReservationController = {
  // Створити бронювання
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookId } = req.body;
      const userId = req.jwtPayload.id; // Беремо ID користувача з JWT токена
      const newReservation = await ReservationService.create({ bookId, userId });
      res.customSuccess(201, 'Book reserved successfully.', newReservation);
    } catch (err) {
      next(err);
    }
  },

  // Отримати мої бронювання
  getMyReservations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.jwtPayload.id;
      const reservations = await ReservationService.getByUser(userId);
      res.customSuccess(200, 'Your reservations.', reservations);
    } catch (err) {
      next(err);
    }
  },

  // Скасувати бронювання
  cancel: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reservationId = Number(req.params.id);
      const userId = req.jwtPayload.id;
      const cancelledReservation = await ReservationService.cancel(reservationId, userId);
      res.customSuccess(200, 'Reservation cancelled.', cancelledReservation);
    } catch (err) {
      next(err);
    }
  },
};
