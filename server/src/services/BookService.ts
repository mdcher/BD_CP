import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';

interface BookData {
  title: string;
  publisher: string;
  language: string;
  year: number;
  location: string;
  status: string;
  authorIds?: number[];
  genreIds?: number[];
}

interface IBookService {
  getAll: () => Promise<any>;
  getOne: (id: number) => Promise<any>;
  create: (data: BookData) => Promise<any>;
  update: (bookId: number, data: BookData) => Promise<any>;
}

export const BookService: IBookService = {
  getAll: async (): Promise<any> => {
    const connection = getConnection();
    try {
      return await connection.query('SELECT * FROM view_catalog_extended');
    } catch (err) {
      throw new CustomError(500, 'Raw', 'Failed to fetch books', null, err);
    }
  },

  getOne: async (id: number): Promise<any> => {
    const connection = getConnection();
    try {
      const res = await connection.query('SELECT * FROM public.view_catalog_extended WHERE bookid = $1::integer', [id]);
      if (res.length === 0) {
        throw new CustomError(404, 'General', `Book with id ${id} not found`);
      }
      return res[0];
    } catch (err) {
      throw new CustomError(500, 'Raw', `Failed to fetch book with id ${id}`, null, err);
    }
  },

  create: async (data: BookData): Promise<any> => {
    const connection = getConnection();
    try {
      await connection.query(
        `CALL public.create_book($1, $2, $3, $4, $5, $6, $7, $8)`,
        [data.title, data.publisher, data.language, data.year, data.location, data.status, data.authorIds, data.genreIds]
      );
      return data;
    } catch (err) {
      throw new CustomError(500, 'Raw', 'Failed to create book', null, err);
    }
  },

  update: async (bookId: number, data: BookData): Promise<any> => {
    const connection = getConnection();
    try {
      await connection.query(
        `CALL public.update_book($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [bookId, data.title, data.publisher, data.language, data.year, data.location, data.status, data.authorIds, data.genreIds]
      );
      return { bookId, ...data };
    } catch (err) {
      throw new CustomError(500, 'Raw', `Failed to update book with id ${bookId}`, null, err);
    }
  },
};