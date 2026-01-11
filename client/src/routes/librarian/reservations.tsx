import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import axiosInstance from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

interface Reservation {
    reservationid: number;
    book_title: string;
    user_fullname: string;
    pickupdate: string;
}

function LibrarianReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const { token } = useAuthStore();

    const fetchReservations = async () => {
        try {
            const response = await axiosInstance.get('/api/v1/reservations/all-active', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReservations(response.data);
        } catch (error) {
            console.error("Failed to fetch active reservations:", error);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, [token]);
    
    const handleComplete = async (reservationId: number) => {
        try {
            await axiosInstance.post(`/api/v1/reservations/${reservationId}/complete`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Reservation completed (book issued)!');
            fetchReservations(); // Refresh the list
        } catch (error) {
            console.error("Failed to complete reservation:", error);
            alert('Failed to complete reservation.');
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Active Reservations</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b">Book Title</th>
                            <th className="py-2 px-4 border-b">User Name</th>
                            <th className="py-2 px-4 border-b">Pickup Date</th>
                            <th className="py-2 px-4 border-b">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.map((res) => (
                            <tr key={res.reservationid}>
                                <td className="py-2 px-4 border-b">{res.book_title}</td>
                                <td className="py-2 px-4 border-b">{res.user_fullname}</td>
                                <td className="py-2 px-4 border-b">{new Date(res.pickupdate).toLocaleDateString()}</td>
                                <td className="py-2 px-4 border-b">
                                    <button
                                        onClick={() => handleComplete(res.reservationid)}
                                        className="bg-purple-500 text-white px-2 py-1 rounded"
                                    >
                                        Mark as Completed
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

export const Route = createFileRoute('/librarian/reservations')({
  component: LibrarianReservationsPage,
});
