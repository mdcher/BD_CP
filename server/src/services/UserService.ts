import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';
import * as bcrypt from 'bcryptjs';

export const UserService = {
  getAll: async () => {
    const connection = getConnection();
    try {
      const query = `SELECT * FROM v_all_users_for_admin;`;
      return await connection.query(query);
    } catch (err) {
      throw new CustomError(500, 'Raw', 'Failed to fetch users', null, err);
    }
  },

  setLockStatus: async (userId: number, isBlocked: boolean, adminId?: number) => {
    const connection = getConnection();
    try {
      // Використовуємо процедури БД для блокування/розблокування користувачів
      if (isBlocked) {
        await connection.query('CALL public.block_user($1::integer, $2::integer)', [userId, adminId || 1]);
      } else {
        await connection.query('CALL public.unblock_user($1::integer, $2::integer)', [userId, adminId || 1]);
      }
      // Повертаємо оновлені дані
      const result = await connection.query('SELECT userid, fullname, isblocked FROM public.users WHERE userid = $1', [userId]);
      return result[0];
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Failed to update user lock status', [err.message]);
    }
  },

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
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await connection.query(
        `CALL create_user($1, $2, $3, $4, $5)`,
        [fullName, email, hashedPassword, dateOfBirth, role]
      );
      return { message: 'User created successfully.' };
    } catch (err) {
      throw new CustomError(500, 'Raw', 'Failed to create user', null, err);
    }
  },

  toggleBlock: async (userId: number, isBlocked: boolean) => {
    return UserService.setLockStatus(userId, isBlocked);
  },

  // Оновити вартість типу порушення (для адмінів)
  updateViolationCost: async (typeId: number, newCost: number, adminId: number) => {
    const connection = getConnection();
    try {
      await connection.query(
        'CALL public.update_violation_type_cost($1::integer, $2::numeric, $3::integer)',
        [typeId, newCost, adminId]
      );
      return { message: 'Violation cost updated successfully.', typeId, newCost };
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Update violation cost failed', [err.message]);
    }
  },

  // Отримати всі типи порушень
  getViolationTypes: async () => {
    const connection = getConnection();
    try {
      return await connection.query('SELECT * FROM public.violation_types ORDER BY typeid;');
    } catch (err: any) {
      throw new CustomError(500, 'Raw', 'Failed to fetch violation types', [err.message]);
    }
  },
};
