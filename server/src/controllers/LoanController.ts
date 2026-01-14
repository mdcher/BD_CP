import { Request, Response, NextFunction } from 'express';
import { LoanService } from '../services/LoanService';
import { CustomError } from '../utils/response/custom-error/CustomError';

export const issue = async (req: Request, res: Response, next: NextFunction) => {
    const { userId, bookId, days } = req.body;
    const librarianId = req.jwtPayload.id;
    try {
        if (!userId || !bookId) {
            throw new CustomError(400, 'Validation', 'UserId and BookId are required');
        }
        const result = await LoanService.issueBook(userId, bookId, librarianId, days);
        res.customSuccess(201, 'Книгу успішно видано', result);
    } catch (err) {
        next(err);
    }
};

export const returnBook = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; // loanId
    const librarianId = req.jwtPayload.id;
    try {
        const result = await LoanService.returnBook(Number(id), librarianId);
        res.customSuccess(200, 'Книгу повернуто', result);
    } catch (err) {
        next(err);
    }
};

export const myHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const history = await LoanService.getHistory();
        res.customSuccess(200, 'My loans history', history);
    } catch (err) {
        next(err);
    }
};

export const markAsLost = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; // loanId
    const librarianId = req.jwtPayload.id;
    try {
        const result = await LoanService.markAsLost(Number(id), librarianId);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};