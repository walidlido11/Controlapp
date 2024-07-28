import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';
import ReactPaginate from 'react-paginate';
import styled from 'styled-components';
import './accountmanagement.css'; // Ensure to import the CSS file

// Styled Components
const Container = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 0.25rem;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const FormWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  width: 100%;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    width: 50%;
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  color: #495057;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
`;

const AccountTypeSelect = styled(Select)`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  color: #fff;
  background-color: ${props => props.primary ? '#007bff' : props.secondary ? '#6c757d' : '#28a745'};
  &:hover {
    background-color: ${props => props.primary ? '#0056b3' : props.secondary ? '#5a6268' : '#218838'};
  }
  margin-right: ${props => props.marginRight ? '0.5rem' : '0'};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  border: 1px solid #ced4da;
`;

const TableHeader = styled.th`
  padding: 0.75rem;
  text-align: left;
  background-color: #f8f9fa;
`;

const TableCell = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid #ced4da;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.show ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
`;

const Modal = styled.div`
  background-color: #fff;
  padding: 1rem;
  border-radius: 0.25rem;
  width: 100%;
  max-width: 500px;
`;

function AccountManagement() {
  const [accounts, setAccounts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [editingAccount, setEditingAccount] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [accountsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountType, setAccountType] = useState(''); // Default value is empty
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        return;
      }

      const response = await axios.get('http://localhost:5001/api/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError('Error fetching accounts: ' + error.message);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        return;
      }

      const response = await axios.get('http://localhost:5001/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Error fetching employees: ' + error.message);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchEmployees();
  }, [editingAccount]);

  const onSubmit = async (data) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        return;
      }

      data.accountType = accountType; // Add accountType to data

      const emailExists = accounts.some(account => account.email === data.email);
      if (emailExists) {
        setError('An account with this email already exists');
        return;
      }

      const response = await axios.post('http://localhost:5001/api/accounts', data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      setAccounts(prevAccounts => [...prevAccounts, response.data]);
      reset();
    } catch (error) {
      console.error('Error creating account:', error);
      setError('Error creating account: ' + error.message);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setValue('email', account.email);
    setValue('password', account.password);
    setValue('code', account.code);
    setValue('status', account.status);
    setValue('assignedEmployee', account.assignedEmployee?._id || '');
    setAccountType(account.accountType || ''); // Set accountType
  };

  const handleUpdate = async (data) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        return;
      }

      data.accountType = accountType; // Add accountType to data

      const response = await axios.put(`http://localhost:5001/api/accounts/${editingAccount._id}`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      setAccounts(prevAccounts => prevAccounts.map(acc => acc._id === response.data._id ? response.data : acc));
      setEditingAccount(null);
      reset();
    } catch (error) {
      console.error('Error updating account:', error);
      setError('Error updating account: ' + error.message);
    }
  };

  const handleDelete = async (accountId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        return;
      }

      await axios.delete(`http://localhost:5001/api/accounts/${accountId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setAccounts(prevAccounts => prevAccounts.filter(acc => acc._id !== accountId));
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Error deleting account: ' + error.message);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet);

        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setError('No token found');
            return;
          }

          json.forEach(async (item) => {
            item.accountType = accountType; // Add accountType to each item

            await axios.post('http://localhost:5001/api/accounts/upload', item, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
          });

          setAccounts(prevAccounts => [...prevAccounts, ...json]);
          setShowUploadModal(false);
        } catch (error) {
          console.error('Error uploading file:', error);
          setError('Error uploading file: ' + error.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleSelectAll = () => {
    setSelectedAccounts(accounts.map(account => account._id));
  };

  const handleDeselectAll = () => {
    setSelectedAccounts([]);
  };

  const handleBulkEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        return;
      }

      const selectedAccountsData = accounts.filter(account => selectedAccounts.includes(account._id));

      for (const account of selectedAccountsData) {
        const response = await axios.put(`http://localhost:5001/api/accounts/${account._id}`, {
          ...account,
          accountType
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        setAccounts(prevAccounts => prevAccounts.map(acc => acc._id === response.data._id ? response.data : acc));
      }

      setSelectedAccounts([]);
      setAccountType('');
    } catch (error) {
      console.error('Error updating accounts:', error);
      setError('Error updating accounts: ' + error.message);
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentAccounts = filteredAccounts.slice(
    currentPage * accountsPerPage,
    (currentPage + 1) * accountsPerPage
  );

  return (
    <Container>
      <Title>Account Management</Title>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <FormWrapper>
        <FormGroup>
          <Label>Email</Label>
          <Input type="email" {...register('email')} />
        </FormGroup>
        <FormGroup>
          <Label>Password</Label>
          <Input type="password" {...register('password')} />
        </FormGroup>
        <FormGroup>
          <Label>Code</Label>
          <Input type="text" {...register('code')} />
        </FormGroup>
        <FormGroup>
          <Label>Status</Label>
          <Select {...register('status')}>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </Select>
        </FormGroup>
        <FormGroup>
          <Label>Assigned Employee</Label>
          <Select {...register('assignedEmployee')}>
            <option value="">Select Employee</option>
            {employees.map(employee => (
              <option key={employee._id} value={employee._id}>
                {employee.name}
              </option>
            ))}
          </Select>
        </FormGroup>
        <FormGroup>
          <Label>Account Type</Label>
          <AccountTypeSelect value={accountType} onChange={e => setAccountType(e.target.value)}>
            <option value="">Select Account Type</option>
            <option value="ps">PS</option>
            <option value="pc">PC</option>
          </AccountTypeSelect>
        </FormGroup>
        <FormGroup>
          <Button
            primary
            onClick={editingAccount ? handleSubmit(handleUpdate) : handleSubmit(onSubmit)}
          >
            {editingAccount ? 'Update Account' : 'Create Account'}
          </Button>
          <Button secondary onClick={() => { setEditingAccount(null); reset(); }}>
            Cancel
          </Button>
        </FormGroup>
      </FormWrapper>
      <Button onClick={() => setShowUploadModal(true)}>Upload Accounts</Button>
      <Button onClick={handleSelectAll}>Select All</Button>
      <Button onClick={handleDeselectAll}>Deselect All</Button>
      <Button onClick={handleBulkEdit} disabled={selectedAccounts.length === 0}>
        Edit Selected
      </Button>
      <Table>
        <thead>
          <tr>
            <TableHeader>Select</TableHeader>
            <TableHeader>Email</TableHeader>
            <TableHeader>Code</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Assigned Employee</TableHeader>
            <TableHeader>Account Type</TableHeader>
            <TableHeader>Actions</TableHeader>
          </tr>
        </thead>
        <tbody>
          {currentAccounts.map(account => (
            <tr key={account._id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedAccounts.includes(account._id)}
                  onChange={() => {
                    setSelectedAccounts(prev =>
                      prev.includes(account._id)
                        ? prev.filter(id => id !== account._id)
                        : [...prev, account._id]
                    );
                  }}
                />
              </TableCell>
              <TableCell>{account.email}</TableCell>
              <TableCell>{account.code}</TableCell>
              <TableCell>{account.status}</TableCell>
              <TableCell>{account.assignedEmployee?.name || 'N/A'}</TableCell>
              <TableCell>{account.accountType}</TableCell>
              <TableCell>
                <Button primary onClick={() => handleEdit(account)}>Edit</Button>
                <Button secondary onClick={() => handleDelete(account._id)}>Delete</Button>
              </TableCell>
            </tr>
          ))}
        </tbody>
      </Table>
      <ReactPaginate
        pageCount={Math.ceil(filteredAccounts.length / accountsPerPage)}
        onPageChange={handlePageChange}
        containerClassName="pagination"
        pageClassName="page-item"
        pageLinkClassName="page-link"
        previousClassName="page-item"
        nextClassName="page-item"
        breakClassName="page-item"
        activeClassName="active"
        previousLinkClassName="page-link"
        nextLinkClassName="page-link"
        breakLinkClassName="page-link"
      />
      <ModalBackdrop show={showUploadModal}>
        <Modal>
          <h3>Upload Accounts</h3>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
          <Button primary onClick={() => setShowUploadModal(false)}>Close</Button>
        </Modal>
      </ModalBackdrop>
    </Container>
  );
}

export default AccountManagement;
