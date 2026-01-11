import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import { axios } from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

interface Fine {
    fineid: number;
    user_fullname: string;
    amount: number;
    reason: string;
    issuedate: string;
    ispaid: boolean;
}

function AccountantFinancialsPage() {
    const [fines, setFines] = useState<Fine[]>([]);
    const { token } = useAuthStore();

    const fetchFines = async () => {
        try {
            const response = await axios.get('/api/v1/fines', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFines(response.data.data);
        } catch (error) {
            console.error("Failed to fetch fines:", error);
        }
    };

    useEffect(() => {
        fetchFines();
    }, [token]);

    const handlePayFine = async (fineId: number) => {
        try {
            await axios.post(`/api/v1/fines/${fineId}/pay`, 
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Fine marked as paid!');
            fetchFines(); // Refresh the list
        } catch (error) {
            console.error("Failed to pay fine:", error);
            alert('Failed to pay fine.');
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Financial Reports - All Fines</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b">User</th>
                            <th className="py-2 px-4 border-b">Reason</th>
                            <th className="py-2 px-4 border-b">Amount</th>
                            <th className="py-2 px-4 border-b">Issue Date</th>
                            <th className="py-2 px-4 border-b">Status</th>
                            <th className="py-2 px-4 border-b">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fines.map((fine) => (
                            <tr key={fine.fineid}>
                                <td className="py-2 px-4 border-b">{fine.user_fullname}</td>
                                <td className="py-2 px-4 border-b">{fine.reason}</td>
                                <td className="py-2 px-4 border-b">${fine.amount.toFixed(2)}</td>
                                <td className="py-2 px-4 border-b">{new Date(fine.issuedate).toLocaleDateString()}</td>
                                <td className="py-2 px-4 border-b">
                                    <span className={`px-2 py-1 rounded-full text-xs ${fine.ispaid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                        {fine.ispaid ? 'Paid' : 'Unpaid'}
                                    </span>
                                </td>
                                <td className="py-2 px-4 border-b">
                                    {!fine.ispaid && (
                                        <button
                                            onClick={() => handlePayFine(fine.fineid)}
                                            className="bg-green-500 text-white px-2 py-1 rounded"
                                        >
                                            Mark as Paid
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export const Route = createFileRoute('/accountant/financials')({
  component: AccountantFinancialsPage,
});
