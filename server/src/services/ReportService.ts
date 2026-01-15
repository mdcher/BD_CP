import { getConnection } from 'typeorm';

export const ReportService = {
  // Звіт про боржників (для бібліотекарів та адмінів)
  // View: view_active_debtors
  // Frontend Interface: Debtor (fullname, contactinfo, book_title, duedate, days_overdue)
  getActiveDebtors: async () => {
    const connection = getConnection();
    return await connection.query(`SELECT * FROM public.view_active_debtors`);
  },

  // Фінансовий звіт (для бухгалтерів та адмінів)
  // View: view_financial_summary
  // Frontend Interface: FinancialSummary (totalincomefines, expensesbooks, expensessalaries, netbalance, reportdate)
  getFinancialSummary: async () => {
    const connection = getConnection();
    // Використовуємо існуюче VIEW, яке вже рахує всі суми
    const result = await connection.query(`SELECT * FROM public.view_financial_summary`);

    // Перетворимо рядкові числа (які повертає Postgres для DECIMAL/BIGINT) в numbers
    if (result && result[0]) {
      return {
        ...result[0],
        totalincomefines: Number(result[0].totalincomefines),
        expensesbooks: Number(result[0].expensesbooks),
        expensessalaries: Number(result[0].expensessalaries),
        netbalance: Number(result[0].netbalance)
      };
    }
    return null;
  },

  // Рейтинг авторів (публічний або для персоналу)
  // View: view_author_ratings
  // Frontend Interface: AuthorRating (fullname, total_books, rank_by_books)
  getAuthorRatings: async () => {
    const connection = getConnection();
    const result = await connection.query(`SELECT * FROM public.view_author_ratings`);

    // Кастинг типів
    return result.map((row: any) => ({
      ...row,
      total_books: Number(row.total_books),
      rank_by_books: Number(row.rank_by_books)
    }));
  },

  // Популярність жанрів (публічний або для персоналу)
  // View: view_genre_popularity
  // Frontend Interface: GenrePopularity (title, genrename, loan_count)
  getGenrePopularity: async () => {
    const connection = getConnection();
    const result = await connection.query(`SELECT * FROM public.view_genre_popularity`);

    return result.map((row: any) => ({
      ...row,
      loan_count: Number(row.loan_count)
    }));
  },

  // Статистика читання
  // Frontend Interface: ReadingStatistic (fullname, total_loans, avg_reading_duration)
  getReadingStatistics: async () => {
    const connection = getConnection();
    const query = `
      SELECT
        u.fullname,
        COUNT(l.loanid)::integer as total_loans,
        ROUND(public.agg_avgreadingduration(l.issuedate, l.returndate)::numeric, 1) as avg_reading_duration
      FROM public.users u
      LEFT JOIN public.loans l ON u.userid = l.userid AND l.isreturned = TRUE
      GROUP BY u.userid, u.fullname
      HAVING COUNT(l.loanid) > 0
      ORDER BY avg_reading_duration DESC;
    `;
    return await connection.query(query);
  },

  // Топ читачів за кількістю прочитаних книг
  // Frontend Interface: TopReader (fullname, contactinfo, total_books_read, avg_days_per_book)
  getTopReaders: async (limit: number = 10) => {
    const connection = getConnection();
    const query = `
      SELECT
        u.fullname,
        u.contactinfo,
        COUNT(l.loanid)::integer as total_books_read,
        ROUND(public.agg_avgreadingduration(l.issuedate, l.returndate)::numeric, 1) as avg_days_per_book
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
    return await connection.query(`SELECT * FROM public.view_demand_forecast`);
  },

  // Статистика активності користувачів
  getUserActivityStats: async () => {
    const connection = getConnection();
    return await connection.query(`SELECT * FROM public.view_user_activity_stats`);
  },

  // Детальна інформація про замовлення
  getOrdersDetailed: async () => {
    const connection = getConnection();
    return await connection.query(`SELECT * FROM public.view_orders_detailed`);
  },

  // Активні видачі книг
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