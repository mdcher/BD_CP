import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';

export const UserService = {
  // Отримати список всіх користувачів (для адмінів/бібліотекарів)
  getAll: async () => {
    const connection = getConnection();
    // Логіка перенесена в SQL VIEW. RLS політики відфільтрують дані автоматично.
    const query = `SELECT * FROM v_all_users_for_admin;`;
    return await connection.query(query);
  },

  // Оновити статус блокування користувача
  setLockStatus: async (userId: number, isBlocked: boolean) => {
    const connection = getConnection();
    const query = `
      UPDATE public.users
      SET isblocked = $1::boolean
      WHERE userid = $2::integer
      RETURNING userid, fullname, isblocked;
    `;
    const result = await connection.query(query, [isBlocked, userId]);
    if (result[1] === 0) {
      throw new CustomError(404, 'General', `User with ID ${userId} not found.`);
    }
    return result[0][0];
  },

  // Оновити дані користувача (роль, статус блокування)
  updateUser: async (adminId: number, targetUserId: number, data: { role: string, isBlocked: boolean }) => {
    const connection = getConnection();
    try {
      await connection.query(
        `CALL update_user_by_admin($1::integer, $2::integer, $3::text, $4::boolean)`,
        [adminId, targetUserId, data.role, data.isBlocked]
      );
      return { message: 'User updated successfully.' };
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Update user failed', [err.message]);
    }
  },

  create: async (data: any) => {
    const connection = getConnection();
    const { fullName, email, password, dateOfBirth, role } = data;
    await connection.query(
      `CALL create_user($1, $2, $3, $4, $5)`,
      [fullName, email, password, dateOfBirth, role]
    );
    return { message: 'User created successfully.' };
  },

  toggleBlock: async (userId: number, isBlocked: boolean) => {
    return UserService.setLockStatus(userId, isBlocked);
  },
};
