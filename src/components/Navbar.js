import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NavBar = ({ setUser, userRole }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Optional: If you have an API endpoint for logout, call it here
      // await fetch('http://localhost:5001/api/logout', { method: 'POST' });

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="bg-gray-800 p-4 flex justify-between items-center">
      <Link to="/" className="text-white text-xl font-bold">MyApp</Link>
      <div className="flex space-x-4">
        {userRole === 'admin' && (
          <>
            <Link to="/admin-dashboard" className="text-gray-300 hover:text-white">Admin Dashboard</Link>
            <Link to="/all-accounts" className="text-gray-300 hover:text-white">All Accounts</Link>
            <Link to="/admin-accounts" className="text-gray-300 hover:text-white">Admin Accounts</Link>
          </>
        )}
        {loading ? (
          <div className="text-gray-300">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0116 0v0a8 8 0 01-16 0v0zm2-5.293l1.414 1.414A6 6 0 0018 12h2a8 8 0 00-14.828-4.293z"></path>
            </svg>
          </div>
        ) : (
          <button onClick={handleLogout} className="text-gray-300 hover:text-white border border-gray-300 hover:border-white px-3 py-2 rounded">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
