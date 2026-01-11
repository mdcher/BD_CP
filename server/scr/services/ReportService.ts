import { getConnection } from 'typeorm';

export const ReportService = {
  // Звіт про боржників (для бібліотекарів та адмінів)
  getActiveDebtors: async () => {
    const connection = getConnection();
    return await connection.query(`SELECT * FROM public.view_active_debtors;`);
  },

  // Фінансовий звіт (для бухгалтерів та адмінів)
  getFinancialSummary: async () => {
    const connection = getConnection();
    return await connection.query(`SELECT * FROM public.view_financial_summary;`);
  },

  // Рейтинг авторів (публічний або для персоналу)
  getAuthorRatings: async () => {
    const connection = getConnection();
    return await connection.query(`SELECT * FROM public.view_author_ratings;`);
  },

  // Популярність жанрів (публічний або для персоналу)
  getGenrePopularity: async () => {
    const connection = getConnection();
    return await connection.query(`SELECT * FROM public.view_genre_popularity;`);
  },
};
