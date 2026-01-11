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
      VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 day', 'Active')
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

  // Отримати всі бронювання конкретного користувача
  getByUser: async (userId: number) => {
    const connection = getConnection();
    const query = `SELECT * FROM public.reservations WHERE userid = $1 ORDER BY reservationdate DESC;`;
    return await connection.query(query, [userId]);
  },

  // Скасувати бронювання
  cancel: async (reservationId: number, userId: number) => {
    const connection = getConnection();
    // RLS політика в базі даних не дозволить користувачу скасувати чуже бронювання
    const query = `
      UPDATE public.reservations 
      SET status = 'Cancelled' 
      WHERE reservationid = $1 AND userid = $2 AND status = 'Active'
      RETURNING reservationid;
    `;
    const result = await connection.query(query, [reservationId, userId]);
    if (result[1] === 0) { // result[1] це кількість змінених рядків
        throw new CustomError(404, 'General', 'Active reservation not found or you do not have permission to cancel it.');
    }
    return { reservationId, status: 'Cancelled' };
  },
};
