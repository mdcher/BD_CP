import { getConnection } from 'typeorm';

// Очікуваний тип даних для створення/оновлення книги
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

export const BookService = {
  getAll: async () => {
    const connection = getConnection();
    // ВИПРАВЛЕНО: view без лапок, назви колонок lowercase
    return connection.query('SELECT * FROM view_catalog_extended');
  },

  getOne: async (id: number) => {
    const connection = getConnection();
    // ВИПРАВЛЕНО: назва колонки lowercase з явним приведенням типу
    const res = await connection.query('SELECT * FROM public.view_catalog_extended WHERE bookid = $1::integer', [id]);
    return res[0];
  },

  // ВИПРАВЛЕНО: Виклик процедури
  create: async (data: BookData) => {
    const connection = getConnection();
    return connection.query(
      `CALL public.create_book($1, $2, $3, $4, $5, $6, $7, $8)`,
      [data.title, data.publisher, data.language, data.year, data.location, data.status, data.authorIds, data.genreIds]
    );
  },

  // ВИПРАВЛЕНО: Виклик процедури
  update: async (bookId: number, data: BookData) => {
    const connection = getConnection();
    return connection.query(
      `CALL public.update_book($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [bookId, data.title, data.publisher, data.language, data.year, data.location, data.status, data.authorIds, data.genreIds]
    );
  },
};