import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './EmployeeDashboard.css'; // تأكد من وجود هذا الملف

function EmployeeDashboard() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [accountCount, setAccountCount] = useState(0);
  const [showPassword, setShowPassword] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [accountsPerPage] = useState(10);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5001/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status !== 200) {
          throw new Error(`Failed to fetch user profile: ${response.statusText}`);
        }

        const userData = response.data;
        setUser(userData);
        fetchAccounts(userData._id);
      } catch (error) {
        console.error('Error fetching user profile:', error.message);
        setError('Error fetching user profile');
      }
    };

    const fetchAccounts = async (userId) => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`http://localhost:5001/api/accounts/employee/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status !== 200) {
          throw new Error(`Failed to fetch accounts: ${response.statusText}`);
        }

        const data = response.data;
        setAccounts(data);
        setAccountCount(data.length);
      } catch (error) {
        console.error('Error fetching accounts:', error.message);
        setError('Error fetching accounts');
      }
    };

    fetchUser();
  }, []);

  const handleStatusChange = async (accountId, newStatus) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found');
      return;
    }

    try {
      const response = await axios.put(`http://localhost:5001/api/accounts/${accountId}/status`, 
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.status !== 200) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      // Remove completed accounts from the current view
      if (newStatus === 'completed') {
        setAccounts(accounts.filter(acc => acc._id !== accountId));
      } else {
        setAccounts(accounts.map(acc => acc._id === accountId ? { ...acc, status: newStatus } : acc));
      }
    } catch (error) {
      console.error('Failed to update status:', error.message);
      setError('Failed to update status');
    }
  };

  const getRowClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100'; // Light green for completed
      case 'pending':
        return 'bg-yellow-100'; // Light yellow for pending
      case 'closed':
        return 'bg-gray-100'; // Light gray for closed
      case 'in-progress':
        return 'bg-blue-100'; // Light blue for in-progress
      default:
        return '';
    }
  };

  const togglePasswordVisibility = (accountId) => {
    setShowPassword(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  // Pagination logic
  const indexOfLastAccount = currentPage * accountsPerPage;
  const indexOfFirstAccount = indexOfLastAccount - accountsPerPage;
  const currentAccounts = accounts.slice(indexOfFirstAccount, indexOfLastAccount);
  const totalPages = Math.ceil(accounts.length / accountsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Employee Dashboard</h2>
      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}
      {user && <p className="mb-4">Welcome, {user.name}!</p>}
      <p className="mb-4">Total Accounts Added: {accountCount}</p>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {currentAccounts.map(account => (
            <tr key={account._id} className={getRowClass(account.status)}>
              <td className="px-6 py-4 whitespace-nowrap">{account.email}</td>
              <td className="px-6 py-4 whitespace-nowrap">{account.code}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select 
                  value={account.status} 
                  onChange={(e) => handleStatusChange(account._id, e.target.value)} 
                  className="form-select"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="closed">Closed</option>
                  <option value="in-progress">In Progress</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="relative">
                  <input 
                    type={showPassword[account._id] ? 'text' : 'password'} 
                    value={account.password}
                    readOnly
                    className="form-input"
                  />
                  <button 
                    type="button" 
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => togglePasswordVisibility(account._id)}
                  >
                    {showPassword[account._id] ? <FaEyeSlash className="text-gray-500" /> : <FaEye className="text-gray-500" />}
                  </button>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button 
                  onClick={() => handleStatusChange(account._id, account.status)}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Update Status
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-center">
        <nav aria-label="Page navigation">
          <ul className="flex list-style-none">
            {Array.from({ length: totalPages }, (_, index) => (
              <li key={index + 1} className="page-item">
                <button 
                  onClick={() => handlePageChange(index + 1)}
                  className={`page-link px-4 py-2 border border-gray-300 rounded-lg ${index + 1 === currentPage ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'}`}
                >
                  {index + 1}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
