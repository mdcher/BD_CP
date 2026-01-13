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

  // Оплатити штраф (для Бухгалтера/Адміна)
  payFine: async (fineId: number, accountantId: number) => {
    const connection = getConnection();
    try {
      await connection.query('CALL pay_fine($1::integer, $2::integer)', [fineId, accountantId]);
      return { message: 'Fine paid successfully.' };
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Pay fine failed', [err.message]);
    }
  },
};
