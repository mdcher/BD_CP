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
    // Бронювання очікує підтвердження бібліотекаря (isconfirmed=false, pickupdate=NULL)
    const query = `
      INSERT INTO public.reservations (bookid, userid, reservationdate, iscompleted, isconfirmed)
      VALUES ($1::integer, $2::integer, CURRENT_DATE, false, false)
      RETURNING reservationid, reservationdate;
    `;
    try {
      const result = await connection.query(query, [data.bookId, data.userId]);
      return result[0];
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

  // Скасувати бронювання (видаляємо запис)
  cancel: async (reservationId: number, userId: number) => {
    const connection = getConnection();
    // RLS політика в базі даних не дозволить користувачу скасувати чуже бронювання
    const query = `
      DELETE FROM public.reservations
      WHERE reservationid = $1::integer AND userid = $2::integer AND iscompleted = false
      RETURNING reservationid;
    `;
    const result = await connection.query(query, [reservationId, userId]);
    if (result.length === 0) {
        throw new CustomError(404, 'General', 'Active reservation not found or you do not have permission to cancel it.');
    }
    return { reservationId, status: 'Cancelled' };
  },

  // Завершити бронювання (для бібліотекарів - коли користувач забрав книгу)
  complete: async (reservationId: number) => {
    const connection = getConnection();
    const query = `
      UPDATE public.reservations
      SET iscompleted = true
      WHERE reservationid = $1::integer AND isconfirmed = true AND iscompleted = false
      RETURNING reservationid, userid, bookid;
    `;
    const result = await connection.query(query, [reservationId]);
    if (result.length === 0) {
      throw new CustomError(404, 'General', 'Confirmed reservation not found.');
    }
    return result[0];
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
