// Sidebar.js
import React from 'react';
import { ListGroup, Container } from 'react-bootstrap';
import LogoutButton from './LogoutButton'; // Import the LogoutButton component

function Sidebar({ employees, onSelectEmployee }) {
  // Check if a token exists to conditionally render the LogoutButton
  const token = localStorage.getItem('token');

  return (
    <Container className="p-3">
      <h4>Employee List</h4>
      <ListGroup>
        {employees.map(employee => (
          <ListGroup.Item 
            key={employee._id} 
            action 
            onClick={() => onSelectEmployee(employee)}
            style={{ cursor: 'pointer' }} // Make it clear that it's clickable
          >
            {employee.name}
          </ListGroup.Item>
        ))}
      </ListGroup>
      {token && <LogoutButton />} {/* Render LogoutButton only if token exists */}
    </Container>
  );
}

export default Sidebar;
