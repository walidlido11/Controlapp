import React from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ isOpen, onClose, employeeName, accountDetails }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 md:w-1/2 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">{employeeName}'s Accounts</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accountDetails.map(account => (
              <tr key={account._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(account.updatedAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{account.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    document.body
  );
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return 'N/A';
  const date = new Date(dateTime);
  // Formatting to show only the date and time in a more readable format
  return `${date.toLocaleDateString('ar-EG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} ${date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
};

export default Modal;
