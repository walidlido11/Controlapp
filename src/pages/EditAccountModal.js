import React, { useState } from 'react';
import './styles.css'; // Import the unified CSS file

const EditAccountModal = ({ account, onClose }) => {
  const [editedAccount, setEditedAccount] = useState(account);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedAccount(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      // Send updated data to the server
      await fetch(`http://localhost:5001/api/accounts/${account._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedAccount),
      });
      onClose(); // Close the modal after saving
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Account</h2>
        <form>
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={editedAccount.email}
              onChange={handleChange}
            />
          </label>
          <label>
            Status:
            <select
              name="status"
              value={editedAccount.status}
              onChange={handleChange}
            >
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
              <option value="Pending">Pending</option>
            </select>
          </label>
          <button type="button" onClick={handleSave}>Save</button>
          <button type="button" onClick={onClose}>Close</button>
        </form>
      </div>
    </div>
  );
};

export default EditAccountModal;
