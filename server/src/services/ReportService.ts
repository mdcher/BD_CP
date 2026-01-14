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

  // Статистика читання: середня тривалість читання книг користувачами
  // Використовує агрегатну функцію agg_avgreadingduration з БД
  getReadingStatistics: async () => {
    const connection = getConnection();
    const query = `
      SELECT
        u.userid,
        u.fullname,
        COUNT(l.loanid) as total_books_read,
        public.agg_avgreadingduration(l.issuedate, l.returndate) as avg_reading_duration_days
      FROM public.users u
      LEFT JOIN public.loans l ON u.userid = l.userid AND l.isreturned = TRUE
      GROUP BY u.userid, u.fullname
      HAVING COUNT(l.loanid) > 0
      ORDER BY avg_reading_duration_days DESC;
    `;
    return await connection.query(query);
  },

  // Топ читачів за кількістю прочитаних книг
  getTopReaders: async (limit: number = 10) => {
    const connection = getConnection();
    const query = `
      SELECT
        u.userid,
        u.fullname,
        u.contactinfo,
        COUNT(l.loanid) as total_books_read,
        public.agg_avgreadingduration(l.issuedate, l.returndate) as avg_reading_duration_days
      FROM public.users u
      JOIN public.loans l ON u.userid = l.userid AND l.isreturned = TRUE
      GROUP BY u.userid, u.fullname, u.contactinfo
      ORDER BY total_books_read DESC
      LIMIT $1::integer;
    `;
    return await connection.query(query, [limit]);
  },

  // Прогнозування попиту (для адмінів та бібліотекарів)
  getDemandForecast: async () => {
    const connection = getConnection();
    return await connection.query(`SELECT * FROM public.view_demand_forecast;`);
  },

  // Статистика активності користувачів (для адмінів та бібліотекарів)
  getUserActivityStats: async () => {
    const connection = getConnection();
    return await connection.query(`SELECT * FROM public.view_user_activity_stats;`);
  },

  // Детальна інформація про замовлення (для адмінів та бухгалтерів)
  getOrdersDetailed: async () => {
    const connection = getConnection();
    return await connection.query(`SELECT * FROM public.view_orders_detailed;`);
  },

  // Активні видачі книг (для бібліотекарів та адмінів)
  getActiveLoans: async () => {
    const connection = getConnection();
    const query = `
      SELECT
        l.loanid,
        u.fullname as username,
        b.title as booktitle,
        l.issuedate,
        l.duedate,
        CASE WHEN l.duedate < CURRENT_DATE THEN TRUE ELSE FALSE END as is_overdue,
        CASE
          WHEN l.duedate < CURRENT_DATE THEN CURRENT_DATE - l.duedate
          ELSE NULL
        END as days_overdue
      FROM public.loans l
      JOIN public.users u ON l.userid = u.userid
      JOIN public.books b ON l.bookid = b.bookid
      WHERE l.isreturned = FALSE
      ORDER BY l.duedate ASC;
    `;
    return await connection.query(query);
  },
};
