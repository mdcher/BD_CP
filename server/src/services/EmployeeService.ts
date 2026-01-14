import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';

export const EmployeeService = {
  // Отримати всіх співробітників з розрахованою зарплатою
  // ОНОВЛЕНО: Використовуємо view_employees_detailed
  getAll: async () => {
    const connection = getConnection();
    const query = `SELECT * FROM public.view_employees_detailed ORDER BY employeeid;`;
    return await connection.query(query);
  },

  // Отримати одного співробітника
  getOne: async (employeeId: number) => {
    const connection = getConnection();
    const query = `
      SELECT
        e.employeeid,
        e.userid,
        u.fullname,
        u.contactinfo,
        u.role,
        e.position,
        e.salaryrate,
        e.workedhours,
        e.calculatedsalary
      FROM public.employees e
      JOIN public.users u ON e.userid = u.userid
      WHERE e.employeeid = $1::integer;
    `;
    const result = await connection.query(query, [employeeId]);
    if (result.length === 0) {
      throw new CustomError(404, 'General', `Employee with ID ${employeeId} not found.`);
    }
    return result[0];
  },

  // Створити співробітника
  create: async (data: { userId: number; position: string; salaryRate: number; workedHours?: number }) => {
    const connection = getConnection();
    const query = `
      INSERT INTO public.employees (userid, position, salaryrate, workedhours)
      VALUES ($1::integer, $2::varchar, $3::numeric, $4::integer)
      RETURNING employeeid, userid, position, salaryrate, workedhours, calculatedsalary;
    `;
    try {
      const result = await connection.query(query, [
        data.userId,
        data.position,
        data.salaryRate,
        data.workedHours || 0,
      ]);
      return result[0];
    } catch (err: any) {
      throw new CustomError(400, 'Raw', 'Failed to create employee.', [err.message]);
    }
  },

  // Оновити дані співробітника (годин праці, ставку)
  update: async (employeeId: number, data: { position?: string; salaryRate?: number; workedHours?: number }) => {
    const connection = getConnection();

    // Формуємо динамічний UPDATE запит
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.position !== undefined) {
      updates.push(`position = $${paramIndex++}::varchar`);
      values.push(data.position);
    }
    if (data.salaryRate !== undefined) {
      updates.push(`salaryrate = $${paramIndex++}::numeric`);
      values.push(data.salaryRate);
    }
    if (data.workedHours !== undefined) {
      updates.push(`workedhours = $${paramIndex++}::integer`);
      values.push(data.workedHours);
    }

    if (updates.length === 0) {
      throw new CustomError(400, 'General', 'No fields to update.');
    }

    values.push(employeeId);
    const query = `
      UPDATE public.employees
      SET ${updates.join(', ')}
      WHERE employeeid = $${paramIndex}::integer
      RETURNING employeeid, userid, position, salaryrate, workedhours, calculatedsalary;
    `;

    const result = await connection.query(query, values);
    if (result.length === 0) {
      throw new CustomError(404, 'General', `Employee with ID ${employeeId} not found.`);
    }
    return result[0];
  },

  // Видалити співробітника
  delete: async (employeeId: number) => {
    const connection = getConnection();
    const query = `
      DELETE FROM public.employees
      WHERE employeeid = $1::integer
      RETURNING employeeid;
    `;
    const result = await connection.query(query, [employeeId]);
    if (result[1] === 0) {
      throw new CustomError(404, 'General', `Employee with ID ${employeeId} not found.`);
    }
    return { employeeId, deleted: true };
  },
};
