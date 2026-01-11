import React, { useState, useEffect } from 'react';
import { LibraryService } from '../services/LibraryService';
import { Book } from '../types/Book';
import { toast } from 'react-toastify';

const Catalog = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await LibraryService.getAllBooks();
        // ВИПРАВЛЕНО: Дані знаходяться в response.data.data
        setBooks(response.data.data); 
      } catch (err: any) {
        const errorMessage = err.response?.data?.errorMessage || err.message || 'Failed to fetch books.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Book['availabilitystatus']) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Loaned':
        return 'bg-yellow-100 text-yellow-800';
      case 'Reserved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  if (loading) return <div className="text-center py-10">Loading catalog...</div>;
  if (error) return <div className="text-center py-10 text-red-600 font-semibold">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Book Catalog</h1>
        <input
          type="text"
          placeholder="Search for a book by title..."
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <div key={book.bookid} className="bg-white border rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <div className="p-6 flex-grow">
                <h2 className="text-xl font-bold text-gray-900 mb-2 truncate" title={book.title}>{book.title}</h2>
                <p className="text-gray-600 mb-1"><strong>Author(s):</strong> {book.authors || 'N/A'}</p>
                <p className="text-gray-600 mb-4"><strong>Genre(s):</strong> {book.genres || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between items-center">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(book.availabilitystatus)}`}>
                  {book.availabilitystatus}
                </span>
                {/* <button className="text-indigo-600 hover:text-indigo-800 font-semibold">Details</button> */}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">No books found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Catalog;