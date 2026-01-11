import { createFileRoute } from '@tanstack/react-router';
import React, { useState } from 'react';
import axiosInstance from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

function IssueReturnPage() {
    const { token } = useAuthStore();
    const [issueUserId, setIssueUserId] = useState('');
    const [issueBookId, setIssueBookId] = useState('');
    const [returnLoanId, setReturnLoanId] = useState('');

    const handleIssue = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/api/v1/loans', 
                { userId: Number(issueUserId), bookId: Number(issueBookId) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Book issued successfully!');
            setIssueUserId('');
            setIssueBookId('');
        } catch (error) {
            console.error('Failed to issue book:', error);
            alert('Failed to issue book.');
        }
    };

    const handleReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`/api/v1/loans/${returnLoanId}/return`, 
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Book returned successfully!');
            setReturnLoanId('');
        } catch (error) {
            console.error('Failed to return book:', error);
            alert('Failed to return book.');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Issue Book Form */}
            <div className="p-4 border rounded shadow">
                <h2 className="text-2xl font-bold mb-4">Issue Book</h2>
                <form onSubmit={handleIssue} className="space-y-4">
                    <div>
                        <label htmlFor="issueUserId" className="block font-medium">User ID</label>
                        <input
                            id="issueUserId"
                            type="text"
                            value={issueUserId}
                            onChange={(e) => setIssueUserId(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="issueBookId" className="block font-medium">Book ID</label>
                        <input
                            id="issueBookId"
                            type="text"
                            value={issueBookId}
                            onChange={(e) => setIssueBookId(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Issue Book</button>
                </form>
            </div>

            {/* Return Book Form */}
            <div className="p-4 border rounded shadow">
                <h2 className="text-2xl font-bold mb-4">Return Book</h2>
                <form onSubmit={handleReturn} className="space-y-4">
                    <div>
                        <label htmlFor="returnLoanId" className="block font-medium">Loan ID</label>
                        <input
                            id="returnLoanId"
                            type="text"
                            value={returnLoanId}
                            onChange={(e) => setReturnLoanId(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">Return Book</button>
                </form>
            </div>
        </div>
    );
}

export const Route = createFileRoute('/librarian/issue-return')({
  component: IssueReturnPage,
});
