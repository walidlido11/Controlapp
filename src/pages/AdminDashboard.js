import React, { useState, useEffect } from 'react';
import AccountManagement from '../components/AccountManagement';

function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState('');
  const [employeeAccounts, setEmployeeAccounts] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const response = await fetch('http://localhost:5001/api/employees', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Failed to fetch employees: ${response.statusText}`);

        const data = await response.json();
        setEmployees(data);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setError('Error fetching employees');
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchEmployeeAccounts = async () => {
      if (!selectedEmployee) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const response = await fetch(`http://localhost:5001/api/accounts/employee/${selectedEmployee._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Failed to fetch employee accounts: ${response.statusText}`);

        const data = await response.json();
        setEmployeeAccounts(data);
      } catch (error) {
        console.error('Error fetching employee accounts:', error);
        setError('Error fetching employee accounts');
      }
    };

    fetchEmployeeAccounts();
  }, [selectedEmployee]);

  const handleEmployeeSelect = (e) => {
    const selectedId = e.target.value;
    const employee = employees.find(emp => emp._id === selectedId);
    setSelectedEmployee(employee);
  };

  const handleBulkUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
  
      const response = await fetch('http://localhost:5001/api/accounts/bulk-update', {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accountIds: selectedAccounts, status: bulkStatus })
      });
  
      if (!response.ok) throw new Error(`Failed to update accounts: ${response.statusText}`);
  
      const data = await response.json();
      console.log('Accounts updated successfully', data);
  
      setEmployeeAccounts(prev => 
        prev.map(account => 
          selectedAccounts.includes(account._id)
            ? { ...account, status: bulkStatus }
            : account
        )
      );
      setSelectedAccounts([]);
      setBulkStatus('');
    } catch (error) {
      console.error('Error updating accounts:', error);
      setError('Error updating accounts');
    }
  };
  
  const handleCheckboxChange = (accountId) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId) 
        : [...prev, accountId]
    );
  };

  const countAccountsByStatus = (status) => employeeAccounts.filter(account => account.status === status).length;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">{error}</span>
      </div>}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <div className="mb-4">
            <label htmlFor="formEmployeeSelect" className="block text-gray-700 text-sm font-bold mb-2">Select Employee</label>
            <select 
              id="formEmployeeSelect" 
              onChange={handleEmployeeSelect} 
              value={selectedEmployee?._id || ''} 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">-- Select Employee --</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name}</option>
              ))}
            </select>
          </div>
          
          {selectedEmployee && (
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
              <h5 className="text-xl font-bold mb-2">Selected Employee</h5>
              <table className="min-w-full divide-y divide-gray-200">
                <tbody>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <td className="px-6 py-4 whitespace-nowrap">{selectedEmployee.name}</td>
                  </tr>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <td className="px-6 py-4 whitespace-nowrap">{selectedEmployee.email}</td>
                  </tr>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <td className="px-6 py-4 whitespace-nowrap">{selectedEmployee.phone}</td>
                  </tr>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">National ID</th>
                    <td className="px-6 py-4 whitespace-nowrap">{selectedEmployee.nationalId}</td>
                  </tr>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Accounts</th>
                    <td className="px-6 py-4 whitespace-nowrap">{employeeAccounts.length}</td>
                  </tr>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Accounts</th>
                    <td className="px-6 py-4 whitespace-nowrap">{countAccountsByStatus('completed')}</td>
                  </tr>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Accounts</th>
                    <td className="px-6 py-4 whitespace-nowrap">{countAccountsByStatus('pending')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="col-span-2">
          {selectedEmployee && (
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
              <h5 className="text-xl font-bold mb-2">Employee Accounts</h5>
              <div className="mb-4">
                <label htmlFor="formBulkActions" className="block text-gray-700 text-sm font-bold mb-2">Bulk Actions</label>
                <select 
                  id="formBulkActions" 
                  value={bulkStatus} 
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  {/* Add other statuses as needed */}
                </select>
                <button 
                  onClick={handleBulkUpdate}
                  disabled={selectedAccounts.length === 0 || !bulkStatus}
                  className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Apply to Selected Accounts
                </button>
              </div>

              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employeeAccounts.length > 0 ? (
                    employeeAccounts.map(account => (
                      <tr key={account._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input 
                            type="checkbox" 
                            checked={selectedAccounts.includes(account._id)} 
                            onChange={() => handleCheckboxChange(account._id)} 
                            className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{account.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{account.status}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{account.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(account.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">No accounts found for this employee.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={() => setShowAll(prev => !prev)}
        className="mt-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        {showAll ? 'Hide All Employees' : 'Show All Employees'}
      </button>

      {showAll && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mt-4">
          <h5 className="text-xl font-bold mb-2">All Employees</h5>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">National ID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.length > 0 ? (
                employees.map(emp => (
                  <tr key={emp._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{emp.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{emp.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{emp.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{emp.nationalId}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AccountManagement employeeAccounts={employeeAccounts} />
    </div>
  );
}

export default AdminDashboard;
