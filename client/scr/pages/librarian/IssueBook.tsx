import React from 'react';
import { useForm } from 'react-hook-form';
import { LibraryService } from '../../services/LibraryService';
import { toast } from 'react-toastify';

const LibrarianDashboard = () => {
    const { register: registerIssue, handleSubmit: handleIssue } = useForm();
    const { register: registerReturn, handleSubmit: handleReturn } = useForm();

    // 1. Видача книги
    const onIssue = async (data: any) => {
        try {
            // Викликаємо процедуру issue_book
            await LibraryService.issueBook(Number(data.userId), Number(data.bookId));
            toast.success('Книгу успішно видано!');
        } catch (err: any) {
            // Тут ми ловимо помилку з тригера БД ("User Blocked" або "Fines exist")
            const message = err.response?.data?.message || 'Помилка видачі';
            toast.error(`Помилка: ${message}`);
        }
    };

    // 2. Повернення книги
    const onReturn = async (data: any) => {
        try {
            // Викликаємо процедуру return_book (вона ж нарахує штраф, якщо треба)
            await LibraryService.returnBook(Number(data.loanId));
            toast.success('Книгу повернуто (Штрафи нараховано автоматично, якщо були)');
        } catch (err: any) {
            toast.error(`Помилка: ${err.response?.data?.message}`);
        }
    };

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Форма Видачі */}
            <div className="bg-white p-6 rounded shadow border border-blue-200">
                <h2 className="text-xl font-bold mb-4 text-blue-800">Видача книги (Issue)</h2>
                <form onSubmit={handleIssue(onIssue)} className="flex flex-col gap-3">
                    <input
                        {...registerIssue('userId', { required: true })}
                        placeholder="User ID"
                        className="border p-2 rounded"
                        type="number"
                    />
                    <input
                        {...registerIssue('bookId', { required: true })}
                        placeholder="Book ID"
                        className="border p-2 rounded"
                        type="number"
                    />
                    <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                        Видати книгу
                    </button>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                    * Система автоматично заблокує видачу, якщо користувач має борги.
                </p>
            </div>

            {/* Форма Повернення */}
            <div className="bg-white p-6 rounded shadow border border-green-200">
                <h2 className="text-xl font-bold mb-4 text-green-800">Повернення (Return)</h2>
                <form onSubmit={handleReturn(onReturn)} className="flex flex-col gap-3">
                    <input
                        {...registerReturn('loanId', { required: true })}
                        placeholder="Loan ID"
                        className="border p-2 rounded"
                        type="number"
                    />
                    <button type="submit" className="bg-green-600 text-white py-2 rounded hover:bg-green-700">
                        Прийняти книгу
                    </button>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                    * Штраф за прострочення буде нараховано автоматично тригером.
                </p>
            </div>

        </div>
    );
};

export default LibrarianDashboard;