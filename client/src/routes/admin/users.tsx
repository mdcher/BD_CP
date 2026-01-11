import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import { axios } from '../../lib/axios'; // Assuming axios is configured
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
            const response = await axios.get('/api/v1/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data.data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const handleUpdateUser = async (userId: number, newRole: string, newStatus: boolean) => {
        try {
            await axios.put(`/api/v1/users/${userId}`, 
            { role: newRole, isBlocked: newStatus },
            {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refetch users to see changes
            fetchUsers(); 
        } catch (error) {
            console.error("Failed to update user:", error)
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">User Management</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b">ID</th>
                            <th className="py-2 px-4 border-b">Full Name</th>
                            <th className="py-2 px-4 border-b">Contact Info</th>
                            <th className="py-2 px-4 border-b">Role</th>
                            <th className="py-2 px-4 border-b">Status</th>
                            <th className="py-2 px-4 border-b">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.userid}>
                                <td className="py-2 px-4 border-b">{user.userid}</td>
                                <td className="py-2 px-4 border-b">{user.fullname}</td>
                                <td className="py-2 px-4 border-b">{user.contactinfo}</td>
                                <td className="py-2 px-4 border-b">{user.role}</td>
                                <td className="py-2 px-4 border-b">{user.isblocked ? 'Blocked' : 'Active'}</td>
                                <td className="py-2 px-4 border-b">
                                    {/* A simple implementation with prompts for now */}
                                    <button 
                                        onClick={() => {
                                            const newRole = prompt("Enter new role:", user.role);
                                            const newStatus = confirm(`Current status: ${user.isblocked ? 'Blocked' : 'Active'}. Block user?`);
                                            if (newRole) {
                                                handleUpdateUser(user.userid, newRole, newStatus);
                                            }
                                        }}
                                        className="bg-blue-500 text-white px-2 py-1 rounded"
                                    >
                                        Edit
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
