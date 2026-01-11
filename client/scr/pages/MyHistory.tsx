import React, { useState, useEffect } from 'react';
import { LibraryService } from '../services/LibraryService';
import { HistoryItem } from '../types/HistoryItem';
import { toast } from 'react-toastify';

const MyHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await LibraryService.getMyHistory();
        setHistory(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch history.');
        toast.error(err.message || 'Failed to load history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Іконки та кольори для типів подій
  const getEventIcon = (type: string) => {
    return type === 'Loan' ? '📚' : '💰';
  };

  const getEventColor = (type: string) => {
    return type === 'Loan' ? 'bg-blue-100 border-blue-400' : 'bg-red-100 border-red-400';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'Active': 'bg-green-500 text-white',
      'Returned': 'bg-gray-500 text-white',
      'Overdue!': 'bg-red-600 text-white animate-pulse',
      'Paid': 'bg-green-500 text-white',
      'Unpaid': 'bg-orange-500 text-white',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-400 text-white';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⏳</div>
          <p className="text-lg text-gray-600">Завантаження історії...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl text-red-600 font-semibold">Помилка: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📖 Моя Історія</h1>
          <p className="text-gray-600">Видачі книг та штрафи</p>
        </div>

        {/* Timeline */}
        {history.length > 0 ? (
          <div className="relative">
            {/* Вертикальна лінія Timeline */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-300 to-purple-300"></div>

            {/* Елементи Timeline */}
            <div className="space-y-6">
              {history.map((item, index) => (
                <div key={index} className="relative pl-20">
                  {/* Іконка на Timeline */}
                  <div className={`absolute left-4 w-10 h-10 rounded-full border-4 ${getEventColor(item.eventtype)} flex items-center justify-center text-2xl shadow-lg z-10`}>
                    {getEventIcon(item.eventtype)}
                  </div>

                  {/* Картка події */}
                  <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-5 border-l-4 border-indigo-400">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-sm font-semibold text-gray-500">
                          {new Date(item.eventdate).toLocaleDateString('uk-UA', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <h3 className="text-lg font-bold text-gray-800 mt-1">
                          {item.eventtype === 'Loan' ? 'Видача книги' : 'Штраф'}
                        </h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-2">
                      <span className="font-semibold">Опис:</span> {item.description}
                    </p>

                    {item.amount > 0 && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                        <span className="text-2xl">💵</span>
                        <span className="text-lg font-bold text-red-600">
                          {item.amount.toFixed(2)} грн
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Empty State
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl text-gray-600 font-semibold">Історія порожня</p>
            <p className="text-gray-500 mt-2">Ви ще не брали книги з бібліотеки</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyHistory;
