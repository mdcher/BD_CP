import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';

export const FineService = {
  // Отримати всі неоплачені штрафи користувача (через RLS)
  getMyUnpaid: async () => {
    const connection = getConnection();
    const query = `SELECT * FROM public.v_reader_unpaid_fines ORDER BY issuedate DESC;`;
    return await connection.query(query);
  },

  // Отримати всі штрафи (для Адмінів/Бухгалтерів)
  getAll: async () => {
    const connection = getConnection();
    const query = `SELECT * FROM v_all_fines ORDER BY issuedate DESC;`;
    return await connection.query(query);
  },

  // Оплатити штраф (для всіх авторизованих користувачів)
  // Контроль прав здійснюється на рівні БД: читачі - тільки свої штрафи
  payFine: async (fineId: number, userId: number) => {
    const connection = getConnection();
    try {
      await connection.query('CALL pay_fine($1::integer, $2::integer)', [fineId, userId]);
      return { message: 'Fine paid successfully.' };
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Pay fine failed', [err.message]);
    }
  },

  // Ініціювати оплату штрафу (для читачів)
  // Читач вказує, що оплатив, але потребує підтвердження бухгалтера
  initiatePayment: async (fineId: number, userId: number) => {
    const connection = getConnection();
    try {
      await connection.query('CALL public.reader_initiate_fine_payment($1::integer, $2::integer)', [fineId, userId]);
      return { message: 'Payment initiated. Waiting for accountant confirmation.' };
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Payment initiation failed', [err.message]);
    }
  },

  // Підтвердити оплату штрафу (для бухгалтерів)
  confirmPayment: async (fineId: number, accountantId: number, approve: boolean = true) => {
    const connection = getConnection();
    try {
      await connection.query(
        'CALL public.confirm_fine_payment($1::integer, $2::integer, $3::boolean)',
        [fineId, accountantId, approve]
      );
      return {
        message: approve ? 'Payment confirmed successfully.' : 'Payment rejected.',
        approved: approve
      };
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Payment confirmation failed', [err.message]);
    }
  },

  // Отримати непідтверджені платежі (для бухгалтерів)
  getPendingPayments: async () => {
    const connection = getConnection();
    const query = `SELECT * FROM public.view_pending_fine_payments ORDER BY payment_initiated_date ASC;`;
    return await connection.query(query);
  },

  // Отримати статистику штрафів (для адмінів/бухгалтерів)
  getStatistics: async () => {
    const connection = getConnection();
    const query = `SELECT * FROM public.view_fine_statistics ORDER BY month DESC LIMIT 12;`;
    return await connection.query(query);
  },
};
