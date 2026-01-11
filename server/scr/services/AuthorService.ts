import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';

export const AuthorService = {
  // Отримати всіх авторів
  getAll: async () => {
    const connection = getConnection();
    const query = `SELECT * FROM public.authors ORDER BY fullname;`;
    return await connection.query(query);
  },

  // Отримати одного автора
  getOne: async (authorId: number) => {
    const connection = getConnection();
    const query = `SELECT * FROM public.authors WHERE authorid = $1::integer;`;
    const result = await connection.query(query, [authorId]);
    if (result.length === 0) {
      throw new CustomError(404, 'General', `Author with ID ${authorId} not found.`);
    }
    return result[0];
  },

  // Створити автора
  create: async (fullname: string) => {
    const connection = getConnection();
    const query = `
      INSERT INTO public.authors (fullname)
      VALUES ($1::varchar)
      RETURNING authorid, fullname;
    `;
    try {
      const result = await connection.query(query, [fullname]);
      return result[0];
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Failed to create author.', [err.message]);
    }
  },

  // Оновити автора
  update: async (authorId: number, fullname: string) => {
    const connection = getConnection();
    const query = `
      UPDATE public.authors
      SET fullname = $1::varchar
      WHERE authorid = $2::integer
      RETURNING authorid, fullname;
    `;
    const result = await connection.query(query, [fullname, authorId]);
    if (result[0].length === 0) {
      throw new CustomError(404, 'General', `Author with ID ${authorId} not found.`);
    }
    return result[0];
  },

  // Видалити автора
  delete: async (authorId: number) => {
    const connection = getConnection();
    const query = `
      DELETE FROM public.authors
      WHERE authorid = $1::integer
      RETURNING authorid;
    `;
    const result = await connection.query(query, [authorId]);
    if (result[1] === 0) {
      throw new CustomError(404, 'General', `Author with ID ${authorId} not found.`);
    }
    return { authorId, deleted: true };
  },
};
