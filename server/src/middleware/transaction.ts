import { Request, Response, NextFunction } from 'express';
import { getConnection } from 'typeorm';
import { CustomError } from '../utils/response/custom-error/CustomError';

/**
 * Middleware для обгортання кожного запиту в окрему транзакцію бази даних.
 * Це гарантує, що всі операції в межах одного HTTP-запиту є атомарними
 * і що налаштування сесії RLS не "просочуються" між різними запитами.
 */
export const transactionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const connection = getConnection();
        const queryRunner = connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        // Прикріплюємо queryRunner до об'єкта запиту, щоб він був доступний
        // у наступних middleware та контролерах.
        (req as any).queryRunner = queryRunner;

        // Коли відповідь буде надіслана, ми автоматично закомітимо транзакцію.
        res.on('finish', async () => {
            try {
                if (queryRunner.isTransactionActive) {
                    await queryRunner.commitTransaction();
                }
            } catch (commitError) {
                console.error('Failed to commit transaction:', commitError);
            } finally {
                if (!queryRunner.isReleased) {
                    await queryRunner.release();
                }
            }
        });
        
        // Якщо з'єднання розірветься раптово (наприклад, клієнт закрив браузер),
        // ми відкотимо транзакцію.
        res.on('close', async () => {
             try {
                if (queryRunner.isTransactionActive) {
                    await queryRunner.rollbackTransaction();
                }
            } catch (rollbackError) {
                console.error('Failed to rollback transaction on close:', rollbackError);
            } finally {
                if (!queryRunner.isReleased) {
                    await queryRunner.release();
                }
            }
        });

        next();
    } catch (err) {
        const customError = new CustomError(500, 'Raw', 'Failed to start transaction', null, err);
        return next(customError);
    }
};
