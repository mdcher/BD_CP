import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';

export const LoanService = {
  // Видача книги (викликаємо процедуру issue_book)
  issueBook: async (userId: number, bookId: number, days: number = 14) => {
    const connection = getConnection();
    try {
      // Параметри (p_user_id, p_book_id, p_loan_days)
      await connection.query('CALL issue_book($1, $2, $3)', [userId, bookId, days]);
      return { message: 'Book issued successfully.' };
    } catch (err: any) {
      // Postgres викине помилку з тригера, якщо юзер заблокований або книга зайнята
      throw new CustomError(400, 'Raw', 'Issue book failed', [err.message]);
    }
  },

  // Повернення книги (викликаємо процедуру return_book)
  returnBook: async (loanId: number) => {
    const connection = getConnection();
    try {
      // Процедура сама оновить статус і нарахує штраф, якщо потрібно
      await connection.query('CALL return_book($1)', [loanId]);
      return { message: 'Book returned successfully.' };
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Return book failed', [err.message]);
    }
  },

  // Отримати історію (використовуємо VIEW)
  getHistory: async (userId: number) => {
    const connection = getConnection();
    // ВИПРАВЛЕНО: lowercase назви колонок
    const history = await connection.query(
      `SELECT * FROM view_my_history WHERE userid = $1 ORDER BY eventdate DESC`,
      [userId],
    );
    return history;
  },
};
