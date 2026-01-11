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
        await LoanService.issueBook(userId, bookId, librarianId, days);
        res.status(201).json({ message: 'Книгу успішно видано' });
    } catch (err) {
        next(err);
    }
};

export const returnBook = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; // loanId
    const librarianId = req.jwtPayload.id;
    try {
        await LoanService.returnBook(Number(id), librarianId);
        res.status(200).json({ message: 'Книгу повернуто' });
    } catch (err) {
        next(err);
    }
};

export const myHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const history = await LoanService.getHistory();
        res.status(200).json(history);
    } catch (err) {
        next(err);
    }
};