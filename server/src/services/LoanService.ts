import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';

export const LoanService = {
  // Видача книги (викликаємо процедуру issue_book)
  issueBook: async (userId: number, bookId: number, librarianId: number, days: number = 14) => {
    const connection = getConnection();
    try {
      // Процедура в БД сама перевірить права бібліотекаря
      // Параметри: p_user_id, p_book_id, p_librarian_id, p_days
      await connection.query('CALL public.issue_book($1::integer, $2::integer, $3::integer, $4::integer)', [userId, bookId, librarianId, days]);
      return { message: 'Book issued successfully.' };
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Issue book failed', [err.message]);
    }
  },

  // Повернення книги (викликаємо процедуру return_book)
  returnBook: async (loanId: number, librarianId: number) => {
    const connection = getConnection();
    try {
      // Процедура сама оновить статус і нарахує штраф, якщо потрібно
      // Процедура приймає тільки один параметр: p_loan_id
      await connection.query('CALL public.return_book($1::integer)', [loanId]);
      return { message: 'Book returned successfully.' };
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Return book failed', [err.message]);
    }
  },

  // Отримати історію (використовуємо VIEW з RLS)
  getHistory: async () => {
    const connection = getConnection();
    // RLS політика в БД автоматично відфільтрує записи для поточного користувача
    const history = await connection.query(
      `SELECT * FROM public.v_reader_loans ORDER BY issuedate DESC`
    );
    return history;
  },

  // Позначити книгу як втрачену (для бібліотекарів)
  markAsLost: async (loanId: number, librarianId: number) => {
    const connection = getConnection();
    try {
      // Процедура перевірить, що прострочення >= 180 днів, позначить книгу як Lost та додасть штраф 200 грн
      await connection.query('CALL public.mark_book_as_lost($1::integer, $2::integer)', [loanId, librarianId]);
      return { message: 'Book marked as lost successfully.' };
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Mark as lost failed', [err.message]);
    }
  },
};
