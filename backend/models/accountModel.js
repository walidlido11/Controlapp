const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Account schema
const accountSchema = new Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true, // Ensure emails are unique
    match: [/.+@.+\..+/, 'Please enter a valid email address'] // Basic email validation
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 6 // Enforce a minimum password length for security
  },
  code: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10 // Adjust length as needed for your application
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'closed', 'in-progress'],
    required: true,
    default: 'pending' // Default status if not provided
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0 // Ensure quantity is not negative
  },
  searchCount: {
    type: Number,
    default: 0,
    min: 0 // Ensure searchCount is not negative
  },
  assignedEmployee: {
    type: Schema.Types.ObjectId,
    ref: 'Employee', // Reference to the Employee model
    required: true
  },
  completedDate: {
    type: Date,
    default: null // Default to null if no completion date
  },
  accountType: {
    type: String,
    enum: ['ps', 'pc'], // Define the allowed values for accountType
    default: 'ps' // Default accountType if not provided
  },
  }, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
});

// Create the Account model
const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
