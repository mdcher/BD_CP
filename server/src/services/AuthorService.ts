import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';

export const AuthorService = {
  // Отримати всіх авторів
  getAll: async () => {
    const connection = getConnection();
    const query = `SELECT authorid as id, fullname FROM public.authors ORDER BY fullname;`;
    return await connection.query(query);
  },

  // Отримати одного автора
  getOne: async (authorId: number) => {
    const connection = getConnection();
    const query = `SELECT authorid as id, fullname FROM public.authors WHERE authorid = $1::integer;`;
    const result = await connection.query(query, [authorId]);
    if (result.length === 0) {
      throw new CustomError(404, 'General', `Author with ID ${authorId} not found.`);
    }
    return result[0];
  },

  // Створити автора (ОНОВЛЕНО: використовуємо процедуру з БД)
  create: async (fullname: string, adminId: number = 1) => {
    const connection = getConnection();
    try {
      await connection.query('CALL public.create_author($1::varchar, $2::integer)', [fullname, adminId]);
      // Отримуємо створеного автора
      const result = await connection.query(
        'SELECT authorid as id, fullname FROM public.authors WHERE fullname = $1 ORDER BY authorid DESC LIMIT 1',
        [fullname]
      );
      return result[0];
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Failed to create author.', [err.message]);
    }
  },

  // Оновити автора (ОНОВЛЕНО: використовуємо процедуру з БД)
  update: async (authorId: number, fullname: string, adminId: number = 1) => {
    const connection = getConnection();
    try {
      await connection.query('CALL public.update_author($1::integer, $2::varchar, $3::integer)', [authorId, fullname, adminId]);
      // Отримуємо оновленого автора
      const result = await connection.query('SELECT authorid as id, fullname FROM public.authors WHERE authorid = $1', [authorId]);
      return result[0];
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Failed to update author.', [err.message]);
    }
  },

  // Видалити автора (ОНОВЛЕНО: використовуємо процедуру з БД)
  delete: async (authorId: number, adminId: number = 1) => {
    const connection = getConnection();
    try {
      await connection.query('CALL public.delete_author($1::integer, $2::integer)', [authorId, adminId]);
      return { authorId, deleted: true };
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Failed to delete author.', [err.message]);
    }
  },
};
