import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './modal'; // استيراد مكون المودال

const AdminAccountsPage = () => {
  const [employees, setEmployees] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [employeeAccounts, setEmployeeAccounts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }

        const employeesResponse = await axios.get('http://localhost:5001/api/employees', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const accountsResponse = await axios.get('http://localhost:5001/api/accounts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (employeesResponse.status !== 200 || accountsResponse.status !== 200) {
          throw new Error('Failed to fetch data');
        }

        setEmployees(employeesResponse.data);
        setAccounts(accountsResponse.data);
      } catch (error) {
        setError('Error fetching data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    const interval = setInterval(() => {
      fetchData();
    }, 24 * 60 * 60 * 1000); // 24 ساعة

    return () => clearInterval(interval);
  }, []);

  const handleToggle = (employeeId) => {
    if (expandedEmployee === employeeId) {
      setExpandedEmployee(null);
      setModalOpen(false);
    } else {
      setExpandedEmployee(employeeId);
      const accountsForEmployee = accounts.filter(account => account.assignedEmployee?._id === employeeId);
      setCurrentEmployee(employees.find(emp => emp._id === employeeId)?.name || '');
      setEmployeeAccounts(accountsForEmployee);
      setModalOpen(true);
    }
  };

  const getCompletedAccountsForMonth = (employeeId) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return accounts.filter(account => 
      account.assignedEmployee?._id === employeeId &&
      account.status === 'completed' &&
      new Date(account.updatedAt) >= startOfMonth
    ).length;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Accounts Overview</h1>
      {loading && (
        <div className="flex justify-center">
          <div className="spinner-border" role="status"></div>
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50">Employee Name</th>
              <th className="px-6 py-3 bg-gray-50">Total Accounts</th>
              <th className="px-6 py-3 bg-gray-50">Pending</th>
              <th className="px-6 py-3 bg-gray-50">Completed</th>
              <th className="px-6 py-3 bg-gray-50">In Progress</th>
              <th className="px-6 py-3 bg-gray-50">Closed</th>
              <th className="px-6 py-3 bg-gray-50">Details</th>
              <th className="px-6 py-3 bg-gray-50">Completed This Month</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map(employee => {
              const employeeAccounts = accounts.filter(account => account.assignedEmployee?._id === employee._id);
              const totalAccounts = employeeAccounts.length;
              const statusCounts = employeeAccounts.reduce((counts, account) => {
                counts[account.status] = (counts[account.status] || 0) + 1;
                return counts;
              }, {});

              return (
                <React.Fragment key={employee._id}>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">{employee.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{totalAccounts}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{statusCounts['pending'] || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{statusCounts['completed'] || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{statusCounts['in-progress'] || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{statusCounts['closed'] || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggle(employee._id)}
                        className="text-blue-500 hover:text-blue-700 focus:outline-none"
                      >
                        {expandedEmployee === employee._id ? '▲' : '▼'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCompletedAccountsForMonth(employee._id)}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        employeeName={currentEmployee}
        accountDetails={employeeAccounts}
      />
    </div>
  );
};

export default AdminAccountsPage;
