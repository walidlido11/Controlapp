const express = require('express');
const router = express.Router();
const Account = require('../models/accountModel'); // Ensure the model path is correct

// Route to get accounts by employee ID
router.get('/api/accounts/:employeeId', async (req, res) => {
  try {
    const accounts = await Account.find({ assignedEmployee: req.params.employeeId });

    // Check if any accounts were found
    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ message: 'No accounts found for this employee' });
    }

    // Send the found accounts as the response
    res.json(accounts);
  } catch (error) {
    // Log and send detailed error response
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router;
