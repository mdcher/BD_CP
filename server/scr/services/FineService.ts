import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';

export const FineService = {
  // Отримати всі неоплачені штрафи користувача
  getMyUnpaid: async (userId: number) => {
    const connection = getConnection();
    const query = `
      SELECT f.fineid, f.amount, f.issuedate, vt.name as reason
      FROM public.fines f
      JOIN public.violation_types vt ON f.typeid = vt.typeid
      WHERE f.userid = $1 AND f.ispaid = false
      ORDER BY f.issuedate DESC;
    `;
    return await connection.query(query, [userId]);
  },
  
  // Оплатити штраф (для Бухгалтера/Адміна)
  payFine: async (fineId: number) => {
    const connection = getConnection();
    const query = `
      UPDATE public.fines
      SET ispaid = true, paiddate = CURRENT_DATE
      WHERE fineid = $1 AND ispaid = false
      RETURNING fineid, paiddate;
    `;
    const result = await connection.query(query, [fineId]);
    if (result[1] === 0) {
      throw new CustomError(404, 'General', `Fine with ID ${fineId} not found or is already paid.`);
    }
    return result[0][0];
  },
};
