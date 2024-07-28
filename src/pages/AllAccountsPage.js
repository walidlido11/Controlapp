import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import ReactPaginate from 'react-paginate';
import axios from 'axios';
import './AllAccountsPage.css'; // Custom styles

// Utility functions
const fetchAccountsAndEmployees = async (token) => {
  try {
    const [accountsResponse, employeesResponse] = await Promise.all([
      axios.get('http://localhost:5001/api/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      axios.get('http://localhost:5001/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    if (accountsResponse.status !== 200 || employeesResponse.status !== 200) {
      throw new Error(`Failed to fetch data: ${accountsResponse.statusText}`);
    }

    return [accountsResponse.data, employeesResponse.data];
  } catch (error) {
    throw new Error('Error fetching data: ' + error.message);
  }
};

const AllAccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [editingAccount, setEditingAccount] = useState(null);
  const [batchEditing, setBatchEditing] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [sortBy, setSortBy] = useState('quantity');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }

        const [accountsData, employeesData] = await fetchAccountsAndEmployees(token);

        setAccounts(accountsData);
        setEmployees(employeesData);
        setPageCount(Math.ceil(accountsData.length / 10)); // Assuming 10 items per page
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filtered = accounts
      .filter(account =>
        (searchEmployee === '' || (account.assignedEmployee && account.assignedEmployee.name.toLowerCase().includes(searchEmployee.toLowerCase()))) &&
        (selectedEmployee === '' || (account.assignedEmployee && account.assignedEmployee._id === selectedEmployee)) &&
        (account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.code.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    const sorted = filtered.sort((a, b) => {
      if (sortBy === 'quantity') {
        return (b.quantity || 0) - (a.quantity || 0);
      } else if (sortBy === 'searchCount') {
        return (b.searchCount || 0) - (a.searchCount || 0);
      } else if (sortBy === 'alphabetical') {
        return a.email.localeCompare(b.email);
      }
      return 0;
    });

    setFilteredAccounts(sorted.slice(currentPage * 10, (currentPage + 1) * 10));
  }, [accounts, searchQuery, searchEmployee, currentPage, sortBy, selectedEmployee]);

  const handleEdit = (account) => {
    setEditingAccount(account);
    setValue('code', account.code);
    setValue('status', account.status);
    setValue('quantity', account.quantity || '');
    setValue('searchCount', account.searchCount || '');
    setValue('assignedEmployee', account.assignedEmployee ? account.assignedEmployee._id : '');
  };

  const handleUpdate = async (formData) => {
    if (!editingAccount) return;

    try {
      const updatedData = {
        code: formData.code,
        status: formData.status,
        quantity: formData.quantity || 0, // Ensure quantity is a number
        searchCount: formData.searchCount || 0, // Ensure searchCount is a number
        assignedEmployee: formData.assignedEmployee || null
      };

      const response = await fetch(`http://localhost:5001/api/accounts/${editingAccount._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Failed to update account: ${errorDetails}`);
      }

      const updatedAccount = await response.json();
      setAccounts(prevAccounts =>
        prevAccounts.map(account =>
          account._id === updatedAccount._id ? updatedAccount : account
        )
      );
      setEditingAccount(null);
      reset();
    } catch (error) {
      setError('Failed to update account: ' + error.message);
    }
  };

  const handleBatchUpdate = async (formData) => {
    try {
      const updatedData = {
        status: formData.status,
        assignedEmployee: formData.assignedEmployee || null
      };

      const updatePromises = selectedAccounts.map(accountId =>
        fetch(`http://localhost:5001/api/accounts/${accountId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(updatedData)
        }).then(response => response.json())
      );

      const updatedAccounts = await Promise.all(updatePromises);
      setAccounts(prevAccounts =>
        prevAccounts.map(account =>
          updatedAccounts.find(updatedAccount => updatedAccount._id === account._id) || account
        )
      );
      setSelectedAccounts([]);
      reset();
      setBatchEditing(false);
    } catch (error) {
      setError('Failed to update accounts: ' + error.message);
    }
  };

  const handleDelete = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        const response = await fetch(`http://localhost:5001/api/accounts/${accountId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorDetails = await response.text();
          throw new Error(`Failed to delete account: ${errorDetails}`);
        }

        setAccounts(prevAccounts => prevAccounts.filter(account => account._id !== accountId));
      } catch (error) {
        setError('Failed to delete account: ' + error.message);
      }
    }
  };

  const handleSelectAccount = (accountId) => {
    setSelectedAccounts(prevSelected =>
      prevSelected.includes(accountId)
        ? prevSelected.filter(id => id !== accountId)
        : [...prevSelected, accountId]
    );
  };

  const handleSelectAll = () => {
    setSelectedAccounts(filteredAccounts.map(account => account._id));
  };

  const handleDeselectAll = () => {
    setSelectedAccounts([]);
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0);
  };

  const handleEmployeeSearch = (e) => {
    setSearchEmployee(e.target.value);
    setCurrentPage(0);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleEmployeeSelect = (e) => {
    setSelectedEmployee(e.target.value);
    setCurrentPage(0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">All Accounts</h1>
      {loading && (
        <div className="flex justify-center">
          <div className="spinner-border" role="status"></div>
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="flex flex-wrap mb-4">
        <div className="w-full md:w-1/4 mb-4 md:mb-0">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search accounts"
              value={searchQuery}
              onChange={handleSearch}
              className="form-control"
            />
            <div className="input-group-append">
              <span className="input-group-text">
                <i className="bi bi-search" />
              </span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/4 mb-4 md:mb-0">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search employee"
              value={searchEmployee}
              onChange={handleEmployeeSearch}
              className="form-control"
            />
            <div className="input-group-append">
              <span className="input-group-text">
                <i className="bi bi-search" />
              </span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/4 mb-4 md:mb-0">
          <select onChange={handleSortChange} value={sortBy} className="form-select">
            <option value="quantity">Sort by Quantity</option>
            <option value="searchCount">Sort by Search Count</option>
            <option value="alphabetical">Sort Alphabetically</option>
          </select>
        </div>
        <div className="w-full md:w-1/4">
          <select onChange={handleEmployeeSelect} value={selectedEmployee} className="form-select">
            <option value="">All Employees</option>
            {employees.map(employee => (
              <option key={employee._id} value={employee._id}>{employee.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex mb-4">
        <button onClick={handleSelectAll} className="btn btn-secondary mr-2">Select All</button>
        <button onClick={handleDeselectAll} className="btn btn-secondary">Deselect All</button>
        <button onClick={() => setBatchEditing(true)} className="btn btn-secondary ml-2">Edit Selected</button>
      </div>
      <div className="overflow-auto">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={() => {
                    if (selectedAccounts.length === filteredAccounts.length) {
                      handleDeselectAll();
                    } else {
                      handleSelectAll();
                    }
                  }}
                  checked={selectedAccounts.length === filteredAccounts.length}
                />
              </th>
              <th>Email</th>
              <th>Code</th>
              <th>Status</th>
              <th>Quantity</th>
              <th>Search Count</th>
              <th>Assigned Employee</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map(account => (
              <tr key={account._id} style={{ backgroundColor: account.status === 'completed' ? 'lightgreen' : 'inherit' }}>
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
                <td>{account.quantity}</td>
                <td>{account.searchCount}</td>
                <td>{account.assignedEmployee ? account.assignedEmployee.name : 'Unassigned'}</td>
                <td>
                  <button onClick={() => handleEdit(account)} className="btn btn-primary btn-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(account._id)} className="btn btn-danger btn-sm">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center mt-4">
        <ReactPaginate
          previousLabel={'Previous'}
          nextLabel={'Next'}
          pageCount={pageCount}
          onPageChange={handlePageChange}
          containerClassName={'pagination'}
          activeClassName={'active'}
        />
      </div>
      {editingAccount && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Account</h5>
                <button type="button" className="close" onClick={() => setEditingAccount(null)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit(handleUpdate)}>
                  <div className="form-group">
                    <label htmlFor="code">Code</label>
                    <input id="code" {...register('code')} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select id="status" {...register('status')} className="form-select">
                      <option value="">Select Status</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="in-progress">In Progress</option>
                      {/* Add other statuses if needed */}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="quantity">Quantity</label>
                    <input id="quantity" {...register('quantity')} type="number" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="searchCount">Search Count</label>
                    <input id="searchCount" {...register('searchCount')} type="number" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="assignedEmployee">Assigned Employee</label>
                    <select id="assignedEmployee" {...register('assignedEmployee')} className="form-select">
                      <option value="">Unassigned</option>
                      {employees.map(employee => (
                        <option key={employee._id} value={employee._id}>{employee.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary">Save</button>
                  <button type="button" className="btn btn-secondary ml-2" onClick={() => setEditingAccount(null)}>Cancel</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {batchEditing && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Batch Edit Accounts</h5>
                <button type="button" className="close" onClick={() => setBatchEditing(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit(handleBatchUpdate)}>
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select id="status" {...register('status')} className="form-select">
                      <option value="">Select Status</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="in-progress">In Progress</option>
                      {/* Add other statuses if needed */}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="assignedEmployee">Assigned Employee</label>
                    <select id="assignedEmployee" {...register('assignedEmployee')} className="form-select">
                      <option value="">Unassigned</option>
                      {employees.map(employee => (
                        <option key={employee._id} value={employee._id}>{employee.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary">Save</button>
                  <button type="button" className="btn btn-secondary ml-2" onClick={() => setBatchEditing(false)}>Cancel</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAccountsPage;
