// LogoutButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';

function LogoutButton() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    // Remove the token and user information from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Redirect the user to the login page
    navigate('/login');
  };

  // Render nothing if there's no token
  if (!token) return null;

  return (
    <Button variant="danger" onClick={handleLogout}>
      Logout
    </Button>
  );
}

export default LogoutButton;
