import { Router } from 'express';
import { EmployeeController } from '../../controllers/EmployeeController';
import { checkJwt } from '../../middleware/checkJwt';
import { checkRole } from '../../middleware/checkRole';
import { setDatabaseRole } from '../../middleware/setDatabaseRole';
import { UserRole } from '../../orm/entities/User';

const employeeRouter = Router();

// ВАЖЛИВО: Застосовуємо setDatabaseRole для RLS політик
employeeRouter.use(setDatabaseRole);

// Всі маршрути доступні тільки для Admin та Accountant
const allowedRoles = [UserRole.Admin, 'Accountant' as UserRole];

// GET /employees - список всіх співробітників
employeeRouter.get('/', [checkJwt, checkRole(allowedRoles)], EmployeeController.getAll);

// GET /employees/:id - отримати одного співробітника
employeeRouter.get('/:id', [checkJwt, checkRole(allowedRoles)], EmployeeController.getOne);

// POST /employees - створити співробітника (тільки Admin)
employeeRouter.post('/', [checkJwt, checkRole([UserRole.Admin])], EmployeeController.create);

// PUT /employees/:id - оновити дані співробітника
employeeRouter.put('/:id', [checkJwt, checkRole(allowedRoles)], EmployeeController.update);

// DELETE /employees/:id - видалити співробітника (тільки Admin)
employeeRouter.delete('/:id', [checkJwt, checkRole([UserRole.Admin])], EmployeeController.delete);

export default employeeRouter;
