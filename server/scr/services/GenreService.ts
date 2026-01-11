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

  // Створити жанр
  create: async (genrename: string) => {
    const connection = getConnection();
    const query = `
      INSERT INTO public.genres (genrename)
      VALUES ($1::varchar)
      RETURNING genreid, genrename;
    `;
    try {
      const result = await connection.query(query, [genrename]);
      return result[0];
    } catch (err: any) {
      if (err.message.includes('duplicate key')) {
        throw new CustomError(409, 'General', 'Genre with this name already exists.');
      }
      throw new CustomError(400, 'Raw', 'Failed to create genre.', [err.message]);
    }
  },

  // Оновити жанр
  update: async (genreId: number, genrename: string) => {
    const connection = getConnection();
    const query = `
      UPDATE public.genres
      SET genrename = $1::varchar
      WHERE genreid = $2::integer
      RETURNING genreid, genrename;
    `;
    try {
      const result = await connection.query(query, [genrename, genreId]);
      if (result[0].length === 0) {
        throw new CustomError(404, 'General', `Genre with ID ${genreId} not found.`);
      }
      return result[0];
    } catch (err: any) {
      if (err.message.includes('duplicate key')) {
        throw new CustomError(409, 'General', 'Genre with this name already exists.');
      }
      throw new CustomError(400, 'Raw', 'Failed to update genre.', [err.message]);
    }
  },

  // Видалити жанр
  delete: async (genreId: number) => {
    const connection = getConnection();
    const query = `
      DELETE FROM public.genres
      WHERE genreid = $1::integer
      RETURNING genreid;
    `;
    const result = await connection.query(query, [genreId]);
    if (result[1] === 0) {
      throw new CustomError(404, 'General', `Genre with ID ${genreId} not found.`);
    }
    return { genreId, deleted: true };
  },
};
