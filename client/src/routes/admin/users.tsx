import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import axiosInstance from '../../lib/axios'; // Assuming axios is configured
import { useAuthStore } from '../../store/authStore';

// Define the User type according to your data structure
interface User {
    userid: number;
    fullname: string;
    contactinfo: string;
    role: string;
    isblocked: boolean;
    dateofbirth: string;
    violationcount: number;
    registration_date: string;
    total_loans: number;
    total_reservations: number;
    unpaid_fines_count: number;
    unpaid_fines_amount: number;
}

function AdminUsersPanel() {
    const [users, setUsers] = useState<User[]>([]);
    const { token } = useAuthStore();

    const fetchUsers = async () => {
        try {
            const response = await axiosInstance.get('/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const handleToggleBlock = async (userId: number, isBlocked: boolean) => {
        if (confirm(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this user?`)) {
            try {
                await axiosInstance.patch(
                    `/users/${userId}/block`,
                    { isBlocked: !isBlocked },
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                fetchUsers(); // Refresh the list
            } catch (error) {
                console.error("Failed to toggle block status:", error);
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Управління користувачами</h1>
                    <p className="text-slate-500">Перегляд та управління всіма користувачами системи</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl bg-white shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">Ім'я</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">Роль</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">Контакти</th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-700">Порушення</th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-700">Активні видачі</th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-700">Бронювання</th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-700">Неоплачені штрафи</th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-700">Статус</th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-700">Дії</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-12 text-center text-slate-500">
                                        Користувачі не знайдені
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.userid} className="transition-colors hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">{user.userid}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{user.fullname}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'Librarian' ? 'bg-blue-100 text-blue-800' :
                                                user.role === 'Accountant' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{user.contactinfo}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-center text-sm">
                                            {user.violationcount > 0 ? (
                                                <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                                                    {user.violationcount}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">0</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-slate-900">
                                            {user.total_loans || 0}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-slate-900">
                                            {user.total_reservations || 0}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-center text-sm">
                                            {user.unpaid_fines_count > 0 ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800">
                                                        {user.unpaid_fines_count}
                                                    </span>
                                                    <span className="mt-1 text-xs text-orange-600">
                                                        {Number(user.unpaid_fines_amount || 0).toFixed(2)} грн
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">Немає</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-center text-sm">
                                            {user.isblocked ? (
                                                <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                                                    Заблоковано
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                                                    Активний
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-center text-sm">
                                            <button
                                                onClick={() => handleToggleBlock(user.userid, user.isblocked)}
                                                className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:shadow-md active:scale-95 ${
                                                    user.isblocked
                                                        ? 'bg-green-500 hover:bg-green-600'
                                                        : 'bg-red-500 hover:bg-red-600'
                                                }`}
                                            >
                                                {user.isblocked ? 'Розблокувати' : 'Заблокувати'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPanel,
});
