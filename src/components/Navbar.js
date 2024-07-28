import React, { useState } from 'react';
import { Navbar, Nav, Button, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';

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
    <Navbar bg="dark" variant="dark" expand="lg">
      <Navbar.Brand as={Link} to="/">MyApp</Navbar.Brand>
      <Nav className="ml-auto">
        {userRole === 'admin' && (
          <>
            <Nav.Link as={Link} to="/admin-dashboard">Admin Dashboard</Nav.Link> {/* رابط للصفحة الجديدة */}
            <Nav.Link as={Link} to="/all-accounts">All Accounts</Nav.Link>
            <Nav.Link as={Link} to="/admin-accounts">Admin Accounts</Nav.Link>
          </>
        )}
        {loading ? (
          <Spinner animation="border" size="sm" variant="light" />
        ) : (
          <Button variant="outline-light" onClick={handleLogout}>Logout</Button>
        )}
      </Nav>
    </Navbar>
  );
};

export default NavBar;
