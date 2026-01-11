import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer, toast } from 'react-toastify'; // ВИПРАВЛЕНО: додано toast
import 'react-toastify/dist/ReactToastify.css';

// Імпорт реальних сторінок
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import MyHistory from './pages/MyHistory';
import LibrarianDashboard from './pages/LibrarianDashboard';
import Navbar from './components/Navbar'; // ДОДАНО
import { JwtPayload } from './types/JwtPayload'; // Додаємо JwtPayload

// Компонент для захищених роутів
const PrivateRoute = ({ children, roles }: { children: JSX.Element, roles?: JwtPayload['role'][] }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    // Перевірка ролей
    if (roles && !roles.includes(user.role)) {
      toast.error('Access Denied: Insufficient permissions.');
      return <Navigate to="/" />;
    }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="container mx-auto p-4">
                    <Navbar />
                    <Routes>
                        {/* Публічні роути */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={<Catalog />} /> {/* ВИПРАВЛЕНО: Каталог тепер публічний */}

                        {/* Приватні роути */}
                        <Route path="/my-history" element={
                            <PrivateRoute roles={['Reader']}>
                                <MyHistory />
                            </PrivateRoute>
                        } />
                        <Route path="/dashboard" element={
                            <PrivateRoute roles={['Librarian', 'Admin', 'Accountant']}>
                                <LibrarianDashboard />
                            </PrivateRoute>
                        } />
                        
                        {/* Перенаправлення для невідомих роутів */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                    <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;