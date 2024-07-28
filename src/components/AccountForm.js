import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AccountForm({ selectedEmployee }) {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    nationalId: '',
    type: ''
  });
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State to control dropdown visibility

  useEffect(() => {
    if (selectedEmployee) {
      setFormData({
        email: selectedEmployee.email || '',
        phone: selectedEmployee.phone || '',
        nationalId: selectedEmployee.nationalId || '',
        type: selectedEmployee.type || ''
      });
    }
  }, [selectedEmployee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const checkEmailExists = async (email) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/check-email/${email}`);
      return response.data.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError(''); // Clear any previous email error
    setIsSubmitting(true);

    // Check if the email is already registered
    const emailExists = await checkEmailExists(formData.email);
    if (emailExists) {
      setEmailError('Email is already registered.');
      setIsSubmitting(false);
      return;
    }

    // Submit data to the server
    try {
      console.log('Form data submitted:', formData);
      await axios.post('http://localhost:5001/api/update-account', formData);
      // Optionally reset the form or show a success message
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {isDropdownOpen ? 'Close Form' : 'Open Form'}
      </button>

      {isDropdownOpen && (
        <div className="absolute z-10 mt-2 w-full max-w-lg bg-white shadow-md rounded-lg p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${emailError ? 'focus:ring-red-500 border-red-500' : 'focus:ring-blue-500'}`}
                required
              />
              {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
            </div>
            <div className="mb-4">
              <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">Phone</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="nationalId" className="block text-gray-700 font-medium mb-2">National ID</label>
              <input
                type="text"
                id="nationalId"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="type" className="block text-gray-700 font-medium mb-2">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Select Type --</option>
                <option value="pc">PC</option>
                <option value="ps">PS</option>
              </select>
            </div>
            <button
              type="submit"
              className={`w-full p-2 ${isSubmitting ? 'bg-gray-500' : 'bg-blue-500'} text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AccountForm;
