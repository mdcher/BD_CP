import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';

export const GenreService = {
  // Отримати всі жанри
  getAll: async () => {
    const connection = getConnection();
    const query = `SELECT * FROM public.genres ORDER BY genrename;`;
    return await connection.query(query);
  },

  // Отримати один жанр
  getOne: async (genreId: number) => {
    const connection = getConnection();
    const query = `SELECT * FROM public.genres WHERE genreid = $1::integer;`;
    const result = await connection.query(query, [genreId]);
    if (result.length === 0) {
      throw new CustomError(404, 'General', `Genre with ID ${genreId} not found.`);
    }
    return result[0];
  },

  // Створити жанр (ОНОВЛЕНО: використовуємо процедуру з БД)
  create: async (genrename: string, adminId: number = 1) => {
    const connection = getConnection();
    try {
      await connection.query('CALL public.create_genre($1::varchar, $2::integer)', [genrename, adminId]);
      // Отримуємо створений жанр
      const result = await connection.query(
        'SELECT * FROM public.genres WHERE genrename = $1 ORDER BY genreid DESC LIMIT 1',
        [genrename]
      );
      return result[0];
    } catch (err: any) {
      if (err.message.includes('duplicate key')) {
        throw new CustomError(409, 'General', 'Genre with this name already exists.');
      }
      throw new CustomError(400, 'Raw', 'Failed to create genre.', [err.message]);
    }
  },

  // Оновити жанр (ОНОВЛЕНО: використовуємо процедуру з БД)
  update: async (genreId: number, genrename: string, adminId: number = 1) => {
    const connection = getConnection();
    try {
      await connection.query('CALL public.update_genre($1::integer, $2::varchar, $3::integer)', [genreId, genrename, adminId]);
      // Отримуємо оновлений жанр
      const result = await connection.query('SELECT * FROM public.genres WHERE genreid = $1', [genreId]);
      return result[0];
    } catch (err: any) {
      if (err.message.includes('duplicate key')) {
        throw new CustomError(409, 'General', 'Genre with this name already exists.');
      }
      throw new CustomError(400, 'Raw', 'Failed to update genre.', [err.message]);
    }
  },

  // Видалити жанр (ОНОВЛЕНО: використовуємо процедуру з БД)
  delete: async (genreId: number, adminId: number = 1) => {
    const connection = getConnection();
    try {
      await connection.query('CALL public.delete_genre($1::integer, $2::integer)', [genreId, adminId]);
      return { genreId, deleted: true };
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Failed to delete genre.', [err.message]);
    }
  },
};
