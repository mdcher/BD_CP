import { Request, Response, NextFunction } from 'express';
import { LoanService } from '../services/LoanService';
import { CustomError } from '../utils/response/custom-error/CustomError';

export const issue = async (req: Request, res: Response, next: NextFunction) => {
    const { userId, bookId, days } = req.body;
    try {
        if (!userId || !bookId) {
            throw new CustomError(400, 'Validation', 'UserId and BookId are required');
        }
        await LoanService.issueBook(userId, bookId, days);
        res.status(201).json({ message: 'Книгу успішно видано' });
    } catch (err) {
        next(err);
    }
};

export const returnBook = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; // loanId
    try {
        await LoanService.returnBook(Number(id));
        res.status(200).json({ message: 'Книгу повернуто' });
    } catch (err) {
        next(err);
    }
};

export const myHistory = async (req: Request, res: Response, next: NextFunction) => {
    // id юзера беремо з токена (middleware checkJwt додає jwtPayload)
    const userId = req.jwtPayload.id;
    try {
        const history = await LoanService.getHistory(userId);
        res.status(200).json(history);
    } catch (err) {
        next(err);
    }
};