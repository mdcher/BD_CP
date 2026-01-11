import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import { axios } from '../lib/axios';
import { useAuthStore } from '../store/authStore';

// Define types for the data
interface Loan {
    loanid: number;
    book_title: string; // Assuming the view provides this
    issuedate: string;
    duedate: string;
    returndate: string | null;
}

interface Reservation {
    reservationid: number;
    book_title: string; // Assuming the view provides this
    reservationdate: string;
    status: string;
}

interface Fine {
    fineid: number;
    amount: number;
    reason: string;
    issuedate: string;
}

function MyHistoryPage() {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [fines, setFines] = useState<Fine[]>([]);
    const { token } = useAuthStore();

    useEffect(() => {
        if (token) {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // Fetch all data in parallel
            Promise.all([
                axios.get('/api/v1/loans/my', config),
                axios.get('/api/v1/reservations/my', config),
                axios.get('/api/v1/fines/my-unpaid', config)
            ]).then(([loansRes, reservationsRes, finesRes]) => {
                setLoans(loansRes.data.data || []);
                setReservations(reservationsRes.data.data || []);
                setFines(finesRes.data.data || []);
            }).catch(error => {
                console.error("Failed to fetch reader history:", error);
            });
        }
    }, [token]);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">My History</h1>
            
            {/* Loans Section */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">My Loans</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b">Book Title</th>
                                <th className="py-2 px-4 border-b">Issue Date</th>
                                <th className="py-2 px-4 border-b">Due Date</th>
                                <th className="py-2 px-4 border-b">Return Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.map(loan => (
                                <tr key={loan.loanid}>
                                    <td className="py-2 px-4 border-b">{loan.book_title}</td>
                                    <td className="py-2 px-4 border-b">{new Date(loan.issuedate).toLocaleDateString()}</td>
                                    <td className="py-2 px-4 border-b">{new Date(loan.duedate).toLocaleDateString()}</td>
                                    <td className="py-2 px-4 border-b">{loan.returndate ? new Date(loan.returndate).toLocaleDateString() : 'On Loan'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reservations Section */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">My Reservations</h2>
                 <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b">Book Title</th>
                                <th className="py-2 px-4 border-b">Reservation Date</th>
                                <th className="py-2 px-4 border-b">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map(res => (
                                <tr key={res.reservationid}>
                                    <td className="py-2 px-4 border-b">{res.book_title}</td>
                                    <td className="py-2 px-4 border-b">{new Date(res.reservationdate).toLocaleDateString()}</td>
                                    <td className="py-2 px-4 border-b">{res.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Fines Section */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">My Unpaid Fines</h2>
                 <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b">Reason</th>
                                <th className="py-2 px-4 border-b">Amount</th>
                                <th className="py-2 px-4 border-b">Issue Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fines.map(fine => (
                                <tr key={fine.fineid}>
                                    <td className="py-2 px-4 border-b">{fine.reason}</td>
                                    <td className="py-2 px-4 border-b">${fine.amount.toFixed(2)}</td>
                                    <td className="py-2 px-4 border-b">{new Date(fine.issuedate).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export const Route = createFileRoute('/my-history')({
  component: MyHistoryPage,
});
