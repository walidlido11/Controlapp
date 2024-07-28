import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditAccountModal from './EditAccountModal'; // Import the EditAccountModal component
import './styles.css'; // Import the unified CSS file

const EmployeeCard = ({ employeeId }) => {
  const [employee, setEmployee] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    if (!employeeId) return; // تأكد من أن `employeeId` ليس `undefined`

    const fetchEmployee = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/employees/${employeeId}`);
        setEmployee(response.data);
      } catch (error) {
        console.error('Error fetching employee data:', error);
      }
    };

    fetchEmployee();
  }, [employeeId]);

  const handleEditClick = (account) => {
    setSelectedAccount(account);
  };

  const handleCloseModal = () => {
    setSelectedAccount(null);
  };

  if (!employee) {
    return <div>Loading...</div>;
  }

  return (
    <div className="employee-card">
      <h2>{employee.name}</h2>
      <table className="accounts-table">
        <thead>
          <tr>
            <th>Assigned Employee</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employee.accounts.length ? (
            employee.accounts.map(account => (
              <tr key={account._id}>
                <td>{account.assignedEmployee}</td>
                <td>{account.email}</td>
                <td>{account.status}</td>
                <td>
                  <button onClick={() => handleEditClick(account)}>Edit</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No accounts available</td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedAccount && (
        <EditAccountModal 
          account={selectedAccount} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default EmployeeCard;
