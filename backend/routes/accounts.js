const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Account = require('../models/accountModel'); // Ensure the path is correct
const { check, validationResult } = require('express-validator'); // For data validation

// GET accounts by employee ID
router.get('/employee/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'Invalid employee ID' });
    }

    const accounts = await Account.find({ assignedEmployee: employeeId }).populate('assignedEmployee');
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts by employee:', error);
    res.status(500).json({ message: 'Error fetching accounts by employee', error: error.message });
  }
});

// GET all accounts or filter by employee
router.get('/', async (req, res) => {
  try {
    const employeeId = req.query.assignedEmployee;
    const query = employeeId ? { assignedEmployee: employeeId } : {};
    const accounts = await Account.find(query).populate('assignedEmployee');
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'Error fetching accounts', error: error.message });
  }
});

// POST create a new account
router.post(
  '/',
  [
    check('email').isEmail().withMessage('Invalid email'),
    check('password').not().isEmpty().withMessage('Password is required'),
    check('status').not().isEmpty().withMessage('Status is required'),
    // Add additional validation rules as needed
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const account = new Account(req.body);
      await account.save();
      res.status(201).json(account);
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({ message: 'Error creating account', error: error.message });
    }
  }
);

// PUT update an account by ID
router.put(
  '/:id',
  [
    check('email').optional().isEmail().withMessage('Invalid email'),
    check('password').optional().not().isEmpty().withMessage('Password cannot be empty'),
    check('status').optional().not().isEmpty().withMessage('Status is required if provided'),
    // Add additional validation rules as needed
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const accountId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        return res.status(400).json({ message: 'Invalid account ID' });
      }

      const account = await Account.findByIdAndUpdate(accountId, req.body, { new: true }).populate('assignedEmployee');
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }
      res.json(account);
    } catch (error) {
      console.error('Error updating account:', error);
      res.status(500).json({ message: 'Error updating account', error: error.message });
    }
  }
);

// PUT update account status by ID
router.put(
  '/:id/status',
  [
    check('status').not().isEmpty().withMessage('Status is required'),
    check('status').isIn(['pending', 'completed', 'closed', 'in-progress']).withMessage('Invalid status value')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid account ID' });
      }

      const account = await Account.findByIdAndUpdate(id, { status }, { new: true }).populate('assignedEmployee');
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }
      res.json(account);
    } catch (error) {
      console.error('Error updating account status:', error);
      res.status(500).json({ message: 'Error updating account status', error: error.message });
    }
  }
);

// DELETE an account by ID
router.delete('/:id', async (req, res) => {
  try {
    const accountId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }

    const result = await Account.findByIdAndDelete(accountId);
    if (!result) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
});

// POST bulk update accounts
router.post(
  '/bulk-update',
  [
    check('ids').isArray().withMessage('IDs should be an array'),
    check('status').not().isEmpty().withMessage('Status is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { ids, status } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Invalid IDs array' });
      }

      const result = await Account.updateMany({ _id: { $in: ids } }, { status });
      res.json(result);
    } catch (error) {
      console.error('Error updating accounts:', error);
      res.status(500).json({ message: 'Error updating accounts', error: error.message });
    }
  }
);

 const fetchAllDailyStats = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/accounts/completed/daily/stats?date=2024-07-26');
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Daily stats data:', data); // تحقق من البيانات المستلمة
    // Handle the data
  } catch (error) {
    console.error('Error fetching daily stats:', error);
  }
};


// Function to get completed accounts by date
const getCompletedAccounts = async (date) => {
  try {
    if (!date) throw new Error('Date parameter is missing');
    
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    return await Account.find({
      status: 'completed',
      completedDate: {
        $gte: startDate,
        $lt: endDate
      }
    }).populate('assignedEmployee');
  } catch (error) {
    console.error('Error in getCompletedAccounts:', error);
    throw new Error(`Failed to get completed accounts: ${error.message}`);
  }
};

// GET daily statistics
// Example route in routes/accounts.js
router.get('/completed/daily/stats', async (req, res) => {
  const { date } = req.query;
  try {
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const accounts = await getCompletedAccounts(date);

    const stats = {
      totalAccounts: accounts.length,
      // Add more statistics if needed
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ message: 'Error fetching daily stats', error: error.message });
  }
});

// GET completed accounts by date
router.get('/completed/daily', async (req, res) => {
  const { date } = req.query;
  try {
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const accounts = await getCompletedAccounts(date);
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching completed accounts:', error);
    res.status(500).json({ message: 'Error fetching completed accounts', error: error.message });
  }
});

// POST upload accounts from file
router.post('/upload', async (req, res) => {
  try {
    const accounts = req.body;
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return res.status(400).json({ message: 'Invalid accounts data' });
    }
    const result = await Account.insertMany(accounts);
    res.json(result);
  } catch (error) {
    console.error('Error uploading accounts:', error);
    res.status(500).json({ message: 'Error uploading accounts', error: error.message });
  }
});

module.exports = router;
