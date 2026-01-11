import React, { useState, useEffect } from 'react';
import { LibraryService } from '../services/LibraryService';
import { User } from '../types/User';
import { Book } from '../types/Book';
import { toast } from 'react-toastify';

const LibrarianDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]); // ВИПРАВЛЕНО
  const [books, setBooks] = useState<Book[]>([]); // Для управління книгами
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user && (user.role === 'Librarian' || user.role === 'Admin')) {
          const usersResponse = await LibraryService.getAllUsers();
          setUsers(usersResponse.data);
        }
        const booksResponse = await LibraryService.getAllBooks();
        setBooks(booksResponse.data);

      } catch (err: any) {
        setError(err.message || 'Failed to fetch data.');
        toast.error(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleBlockUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to block this user?')) return;
    try {
      await LibraryService.blockUser(userId);
      setUsers(users.map(u => u.userid === userId ? { ...u, isblocked: true } : u));
      toast.success('User blocked!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to block user.');
    }
  };

  const handleUnblockUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to unblock this user?')) return;
    try {
      await LibraryService.unblockUser(userId);
      setUsers(users.map(u => u.userid === userId ? { ...u, isblocked: false } : u));
      toast.success('User unblocked!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to unblock user.');
    }
  };

  const handleIssueBook = async (userId: number, bookId: number) => {
    // Проста заглушка. Потрібен більш складний UI для вибору книги, терміну тощо.
    if (!window.confirm(`Issue book ${bookId} to user ${userId}?`)) return;
    try {
      await LibraryService.issueBook(userId, bookId);
      toast.success('Book issued!');
      // Оновити список книг або статус
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue book.');
    }
  };

  const handleReturnBook = async (loanId: number) => {
    if (!window.confirm(`Return loan ${loanId}?`)) return;
    try {
      await LibraryService.returnBook(loanId);
      toast.success('Book returned!');
      // Оновити список позик
    } catch (err: any) {
      toast.error(err.message || 'Failed to return book.');
    }
  };

  if (loading) return <div className="text-center py-4">Loading dashboard...</div>;
  if (error) return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  if (!user || (user.role !== 'Librarian' && user.role !== 'Admin')) return <div className="text-center py-4 text-red-500">Access Denied.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Librarian / Admin Dashboard</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Manage Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border-collapse">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">ID</th>
                <th className="py-3 px-6 text-left">Full Name</th>
                <th className="py-3 px-6 text-left">Contact Info</th>
                <th className="py-3 px-6 text-left">Role</th>
                <th className="py-3 px-6 text-left">Violations</th>
                <th className="py-3 px-6 text-left">Blocked</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {users.map(u => (
                <tr key={u.userid} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left">{u.userid}</td>
                  <td className="py-3 px-6 text-left">{u.fullname}</td>
                  <td className="py-3 px-6 text-left">{u.contactinfo}</td>
                  <td className="py-3 px-6 text-left">{u.role}</td>
                  <td className="py-3 px-6 text-left">{u.violationcount}</td>
                  <td className="py-3 px-6 text-left"><span className={u.isblocked ? 'text-red-500' : 'text-green-500'}>{u.isblocked ? 'Yes' : 'No'}</span></td>
                  <td className="py-3 px-6 text-center">
                    {user?.role === 'Admin' && (
                        u.isblocked ? (
                            <button onClick={() => handleUnblockUser(u.userid)} className="bg-green-500 text-white px-3 py-1 rounded text-xs">Unblock</button>
                        ) : (
                            <button onClick={() => handleBlockUser(u.userid)} className="bg-red-500 text-white px-3 py-1 rounded text-xs">Block</button>
                        )
                    )}
                    {/* Тут можна додати кнопку для зміни ролі */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Manage Books (Simplified)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <div key={book.bookid} className="border p-4 rounded shadow-sm bg-white">
              <h3 className="text-lg font-semibold">{book.title}</h3>
              <p>ID: {book.bookid}</p>
              <p>Status: {book.physicalstatus}</p>
              <p>Availability: {book.availabilitystatus}</p>
              <div className="mt-2 space-x-2">
                {book.availabilitystatus === 'Available' && (
                  <button 
                    onClick={() => handleIssueBook(users[0]?.userid || 1, book.bookid)} 
                    className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
                  >
                    Issue (to User 1)
                  </button>
                )}
                {/* Для повернення потрібно знати loanId, що є складнішим UI */}
                {/* <button onClick={() => handleReturnBook(someLoanId)} className="bg-yellow-500 text-white px-3 py-1 rounded text-xs">Return</button> */}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LibrarianDashboard;
