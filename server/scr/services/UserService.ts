import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';

export const UserService = {
  // Отримати список всіх користувачів (для адмінів/бібліотекарів)
  getAll: async () => {
    const connection = getConnection();
    // Вибираємо тільки безпечні поля, не повертаємо хеш пароля
    const query = `SELECT userid, fullname, role, dateofbirth, contactinfo, violationcount, isblocked FROM public.users;`;
    return await connection.query(query);
  },

  // Оновити статус блокування користувача
  setLockStatus: async (userId: number, isBlocked: boolean) => {
    const connection = getConnection();
    const query = `
      UPDATE public.users
      SET isblocked = $1
      WHERE userid = $2
      RETURNING userid, fullname, isblocked;
    `;
    const result = await connection.query(query, [isBlocked, userId]);
    if (result[1] === 0) {
      throw new CustomError(404, 'General', `User with ID ${userId} not found.`);
    }
    return result[0][0];
  },
};
