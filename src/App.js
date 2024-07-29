import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AllAccountsPage from './pages/AllAccountsPage'; // Import All Accounts Page
import AdminAccountsPage from './pages/AdminAccountsPage'; // Import Admin Accounts Page
import NavBar from './components/Navbar'; // Import NavBar
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

function App() {
  const [user, setUser] = useState(null); // For storing user information
  const [loading, setLoading] = useState(true); // For loading state

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:5001/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          console.error('Failed to fetch user:', await response.text());
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const PrivateRoute = ({ element, role }) => {
    if (loading) return <div>Loading...</div>;
    if (user && user.role === role) return element;
    return <Navigate to="/" />; // Redirect to login page if not authorized
  };

  return (
    <Router>
      <NavBar setUser={setUser} userRole={user?.role} /> {/* Pass userRole to NavBar */}
      <Routes>
        <Route path="/" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin-dashboard" element={<PrivateRoute element={<AdminDashboard />} role="admin" />} />
        <Route path="/employee-dashboard" element={<PrivateRoute element={<EmployeeDashboard />} role="employee" />} />
        <Route path="/all-accounts" element={<PrivateRoute element={<AllAccountsPage />} role="admin" />} /> {/* Route for All Accounts Page */}
        <Route path="/admin-accounts" element={<PrivateRoute element={<AdminAccountsPage />} role="admin" />} /> {/* Route for Admin Accounts Page */}
        {/* Add a route for handling unauthorized access */}
        <Route path="*" element={<Navigate to="/" />} /> {/* Redirect to login page for any unknown paths */}
      </Routes>
    </Router>
  );
}

export default App;
