import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 p-4 mb-4 rounded">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-lg font-bold">Universal Library</Link>
        <div className="space-x-4">
          {user ? (
            <>
              <Link to="/" className="text-gray-300 hover:text-white">Catalog</Link>
              {user.role === 'Reader' && <Link to="/my-history" className="text-gray-300 hover:text-white">My History</Link>}
              {(user.role === 'Librarian' || user.role === 'Admin' || user.role === 'Accountant') && (
                <Link to="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
              )}
              <span className="text-gray-400">Welcome, {user.fullName}!</span>
              <button onClick={handleLogout} className="text-gray-300 hover:text-white">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
              <Link to="/register" className="text-gray-300 hover:text-white">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
