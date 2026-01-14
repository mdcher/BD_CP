import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';

interface ReservationData {
  bookId: number;
  userId: number;
}

export const ReservationService = {
  // Створити нове бронювання
  create: async (data: ReservationData) => {
    const connection = getConnection();
    // Викликаємо процедуру БД для створення бронювання
    // Тригер автоматично перевірить доступність книги
    try {
      await connection.query(
        'CALL public.create_reservation($1::integer, $2::integer)',
        [data.bookId, data.userId]
      );
      return { message: 'Reservation created successfully.' };
    } catch (dbError: any) {
      // Перехоплюємо помилку з бази даних (напр., "Всі примірники зайняті")
      throw new CustomError(409, 'Raw', dbError.message, [dbError.message]);
    }
  },

  // Підтвердити бронювання (для бібліотекарів)
  confirm: async (reservationId: number, librarianId: number, pickupDate?: string) => {
    const connection = getConnection();
    // Викликаємо процедуру підтвердження бронювання
    const query = `CALL public.confirm_reservation($1::integer, $2::integer, $3::date)`;
    try {
      await connection.query(query, [reservationId, librarianId, pickupDate || null]);
      // Повертаємо оновлені дані
      const result = await connection.query(
        `SELECT * FROM public.reservations WHERE reservationid = $1`,
        [reservationId]
      );
      return result[0];
    } catch (dbError: any) {
      throw new CustomError(400, 'Raw', dbError.message, [dbError.message]);
    }
  },

  // Отримати всі бронювання поточного користувача (через RLS)
  getByUser: async () => {
    const connection = getConnection();
    const query = `SELECT * FROM public.v_reader_reservations ORDER BY reservationdate DESC;`;
    return await connection.query(query);
  },

  // Скасувати бронювання (викликаємо процедуру БД)
  cancel: async (reservationId: number, userId: number) => {
    const connection = getConnection();
    try {
      await connection.query(
        'CALL public.cancel_reservation($1::integer, $2::integer)',
        [reservationId, userId]
      );
      return { reservationId, status: 'Cancelled' };
    } catch (dbError: any) {
      throw new CustomError(404, 'Raw', dbError.message, [dbError.message]);
    }
  },

  // Завершити бронювання (для бібліотекарів - коли користувач забрав книгу)
  complete: async (reservationId: number, librarianId: number = 1) => {
    const connection = getConnection();
    try {
      await connection.query(
        'CALL public.complete_reservation_by_librarian($1::integer, $2::integer)',
        [reservationId, librarianId]
      );
      return { message: 'Reservation completed successfully.' };
    } catch (dbError: any) {
      throw new CustomError(404, 'Raw', dbError.message, [dbError.message]);
    }
  },

  // Отримати всі активні бронювання (для бібліотекарів)
  getAllActive: async () => {
    const connection = getConnection();
    const query = `SELECT * FROM public.v_all_active_reservations ORDER BY reservationdate ASC;`;
    return await connection.query(query);
  },

  // Отримати непідтверджені бронювання (для бібліотекарів)
  getPending: async () => {
    const connection = getConnection();
    const query = `SELECT * FROM public.view_pending_reservations ORDER BY reservationdate ASC;`;
    return await connection.query(query);
  },
};
