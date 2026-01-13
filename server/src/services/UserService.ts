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

  setLockStatus: async (userId: number, isBlocked: boolean) => {
    const connection = getConnection();
    try {
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
    } catch (err) {
      throw new CustomError(500, 'Raw', 'Failed to update user lock status', null, err);
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
};
