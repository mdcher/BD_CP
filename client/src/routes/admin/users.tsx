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
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">User Management</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    {/* ... table headers ... */}
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.userid}>
                                {/* ... user data cells ... */}
                                <td className="py-2 px-4 border-b">
                                    <button
                                        onClick={() => handleToggleBlock(user.userid, user.isblocked)}
                                        className={`px-2 py-1 rounded text-white ${user.isblocked ? 'bg-green-500' : 'bg-red-500'}`}
                                    >
                                        {user.isblocked ? 'Unblock' : 'Block'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPanel,
});
