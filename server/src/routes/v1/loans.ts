import { Router } from 'express';
import { issue, returnBook, myHistory, markAsLost } from '../../controllers/LoanController';
import { checkJwt } from '../../middleware/checkJwt';
import { checkRole } from '../../middleware/checkRole';
import { setDatabaseRole } from '../../middleware/setDatabaseRole';
import { UserRole } from '../../orm/entities/User';

const loanRouter = Router();

// ВАЖЛИВО: Застосовуємо setDatabaseRole для RLS політик
loanRouter.use(setDatabaseRole);

// Видати книгу (доступ: Бібліотекар, Адмін)
loanRouter.post('/', [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])], issue);

// Повернути книгу (доступ: Бібліотекар, Адмін)
loanRouter.post('/:id/return', [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])], returnBook);

// Позначити книгу як втрачену (доступ: Бібліотекар, Адмін)
loanRouter.post('/:id/mark-as-lost', [checkJwt, checkRole([UserRole.Librarian, UserRole.Admin])], markAsLost);

// Моя історія (доступ: Будь-який авторизований юзер)
loanRouter.get('/my', [checkJwt], myHistory);

export default loanRouter;