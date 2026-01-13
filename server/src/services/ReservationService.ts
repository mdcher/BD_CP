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
    // База даних сама перевірить доступність книги за допомогою тригера
    // Встановлюємо, що книгу треба забрати протягом 2 днів
    const query = `
      INSERT INTO public.reservations (bookid, userid, reservationdate, pickupdate, status)
      VALUES ($1::integer, $2::integer, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 day', 'Active')
      RETURNING reservationid, pickupdate;
    `;
    try {
      const result = await connection.query(query, [data.bookId, data.userId]);
      return result[0];
    } catch (dbError: any) {
      // Перехоплюємо помилку з бази даних (напр., "Всі примірники зайняті")
      throw new CustomError(409, 'Raw', dbError.message, [dbError.message]);
    }
  },

  // Отримати всі бронювання поточного користувача (через RLS)
  getByUser: async () => {
    const connection = getConnection();
    const query = `SELECT * FROM public.v_reader_reservations ORDER BY reservationdate DESC;`;
    return await connection.query(query);
  },

  // Скасувати бронювання
  cancel: async (reservationId: number, userId: number) => {
    const connection = getConnection();
    // RLS політика в базі даних не дозволить користувачу скасувати чуже бронювання
    const query = `
      UPDATE public.reservations
      SET status = 'Cancelled'
      WHERE reservationid = $1::integer AND userid = $2::integer AND status = 'Active'
      RETURNING reservationid;
    `;
    const result = await connection.query(query, [reservationId, userId]);
    if (result[1] === 0) { // result[1] це кількість змінених рядків
        throw new CustomError(404, 'General', 'Active reservation not found or you do not have permission to cancel it.');
    }
    return { reservationId, status: 'Cancelled' };
  },

  // Завершити бронювання (для бібліотекарів - коли користувач забрав книгу)
  complete: async (reservationId: number) => {
    const connection = getConnection();
    const query = `
      UPDATE public.reservations
      SET status = 'Completed'
      WHERE reservationid = $1::integer AND status = 'Active'
      RETURNING reservationid, userid, bookid;
    `;
    const result = await connection.query(query, [reservationId]);
    if (result[1] === 0) {
      throw new CustomError(404, 'General', 'Active reservation not found.');
    }
    return result[0];
  },

  // Отримати всі активні бронювання (для бібліотекарів)
  getAllActive: async () => {
    const connection = getConnection();
    const query = `SELECT * FROM v_all_active_reservations ORDER BY pickupdate ASC;`;
    return await connection.query(query);
  },
};
