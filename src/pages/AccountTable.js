import React from 'react';
import { Table, Button } from 'react-bootstrap';

const AccountTable = ({ accounts, selectedAccounts, handleSelectAccount, handleEdit, handleDelete }) => (
  <Table striped bordered hover responsive>
    <thead>
      <tr>
        <th>Select</th>
        <th>Email</th>
        <th>Code</th>
        <th>Status</th>
        <th>Quantity</th>
        <th>Search Count</th>
        <th>Employee</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {accounts.map(account => (
        <tr key={account._id} style={{ backgroundColor: getStatusColor(account.status) }}>
          <td>
            <input
              type="checkbox"
              checked={selectedAccounts.includes(account._id)}
              onChange={() => handleSelectAccount(account._id)}
            />
          </td>
          <td>{account.email}</td>
          <td>{account.code}</td>
          <td>{account.status}</td>
          <td>{account.quantity || 0}</td>
          <td>{account.searchCount || 0}</td>
          <td>{account.assignedEmployee ? account.assignedEmployee.name : 'Unassigned'}</td>
          <td>
            <Button variant="warning" onClick={() => handleEdit(account)}>Edit</Button>
            <Button variant="danger" onClick={() => handleDelete(account._id)}>Delete</Button>
          </td>
        </tr>
      ))}
    </tbody>
  </Table>
);

const getStatusColor = (status) => {
  switch (status) {
    case 'In Progress':
      return '#cce5ff'; // Blue
    case 'Completed':
      return '#d4edda'; // Green
    case 'Closed':
      return '#f8d7da'; // Red
    case 'Pending':
      return '#fff3cd'; // Yellow
    default:
      return '#ffffff'; // White for unknown status
  }
};

export default AccountTable;
