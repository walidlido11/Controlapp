// src/routes/employees.js
const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee'); // تأكد من المسار الصحيح
const Account = require('../models/Account'); // تأكد من المسار الصحيح

// Endpoint لجلب بيانات موظف مع حساباته
router.get('/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const employee = await Employee.findById(employeeId).populate('accounts'); // جلب الموظف وحساباته

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
