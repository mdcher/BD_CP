import React, { useEffect, useState } from 'react';
import { LibraryService } from '../../services/LibraryService';
import { Book } from '../../types';

const CatalogPage = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        LibraryService.getAllBooks()
            .then((res) => setBooks(res.data))
            .catch((err) => console.error(err));
    }, []);

    // Функція для фарбування статусу доступності
    const getStatusBadge = (status: string) => {
        const styles = {
            'Available': 'bg-green-500 text-white',
            'Loaned': 'bg-red-500 text-white',
            'Reserved': 'bg-yellow-500 text-white',
            'Unavailable': 'bg-gray-500 text-white',
        };
        return styles[status as keyof typeof styles] || 'bg-gray-400 text-white';
    };

    // Функція для кольору фізичного стану
    const getPhysicalStatusColor = (status: string) => {
        const colors = {
            'New': 'text-green-700',
            'Good': 'text-blue-700',
            'Damaged': 'text-orange-600',
            'Lost': 'text-red-700',
        };
        return colors[status as keyof typeof colors] || 'text-gray-700';
    };

    // Фільтрація книг по пошуковому запиту
    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.authors?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.genres?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Заголовок */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">📚 Каталог бібліотеки</h1>
                    <p className="text-gray-600">Знайдіть свою наступну улюблену книгу</p>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-2xl mx-auto">
                        <input
                            type="text"
                            placeholder="🔍 Пошук за назвою, автором або жанром..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-full shadow-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-2">
                        Знайдено книг: {filteredBooks.length}
                    </p>
                </div>

                {/* Grid of Book Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBooks.map((book) => (
                        <div
                            key={book.bookid}
                            className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-200"
                        >
                            {/* Book Cover Placeholder */}
                            <div className="h-48 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                <div className="text-white text-6xl">📖</div>
                            </div>

                            {/* Book Info */}
                            <div className="p-5">
                                {/* Title */}
                                <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 h-14">
                                    {book.title}
                                </h3>

                                {/* Author */}
                                <p className="text-sm text-gray-600 mb-1">
                                    <span className="font-semibold">Автор:</span> {book.authors || 'Невідомо'}
                                </p>

                                {/* Genre */}
                                <p className="text-sm text-gray-600 mb-3">
                                    <span className="font-semibold">Жанр:</span> {book.genres || 'Невідомо'}
                                </p>

                                {/* Availability Status Badge */}
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(book.availabilitystatus)}`}>
                                        {book.availabilitystatus}
                                    </span>
                                    <span className={`text-sm font-semibold ${getPhysicalStatusColor(book.physicalstatus)}`}>
                                        {book.physicalstatus}
                                    </span>
                                </div>

                                {/* Book ID & Location */}
                                <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200">
                                    <p>ID: {book.bookid} • 📍 {book.location}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredBooks.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-xl text-gray-600">Нічого не знайдено</p>
                        <p className="text-gray-500 mt-2">Спробуйте інший пошуковий запит</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CatalogPage;