import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/EmployeeService';
import { CustomError } from '../utils/response/custom-error/CustomError';

export const EmployeeController = {
  // GET /employees - отримати всіх співробітників
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employees = await EmployeeService.getAll();
      res.customSuccess(200, 'Employees retrieved successfully.', employees);
    } catch (err) {
      next(err);
    }
  },

  // GET /employees/:id - отримати одного співробітника
  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = parseInt(req.params.id, 10);
      if (isNaN(employeeId)) {
        throw new CustomError(400, 'General', 'Invalid employee ID.');
      }
      const employee = await EmployeeService.getOne(employeeId);
      res.customSuccess(200, 'Employee retrieved successfully.', employee);
    } catch (err) {
      next(err);
    }
  },

  // POST /employees - створити співробітника
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, position, salaryRate, workedHours } = req.body;

      if (!userId || !position || salaryRate === undefined) {
        throw new CustomError(400, 'General', 'Missing required fields: userId, position, salaryRate');
      }

      const employee = await EmployeeService.create({
        userId,
        position,
        salaryRate,
        workedHours,
      });

      res.customSuccess(201, 'Employee created successfully.', employee);
    } catch (err) {
      next(err);
    }
  },

  // PUT /employees/:id - оновити дані співробітника
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = parseInt(req.params.id, 10);
      if (isNaN(employeeId)) {
        throw new CustomError(400, 'General', 'Invalid employee ID.');
      }

      const { position, salaryRate, workedHours } = req.body;
      const employee = await EmployeeService.update(employeeId, {
        position,
        salaryRate,
        workedHours,
      });

      res.customSuccess(200, 'Employee updated successfully.', employee);
    } catch (err) {
      next(err);
    }
  },

  // DELETE /employees/:id - видалити співробітника
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = parseInt(req.params.id, 10);
      if (isNaN(employeeId)) {
        throw new CustomError(400, 'General', 'Invalid employee ID.');
      }

      const result = await EmployeeService.delete(employeeId);
      res.customSuccess(200, 'Employee deleted successfully.', result);
    } catch (err) {
      next(err);
    }
  },
};
