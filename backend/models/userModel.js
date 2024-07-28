const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Use `bcryptjs` for compatibility

// Define the schema for a user
const userSchema = new mongoose.Schema({
  // User name
  name: {
    type: String,
    required: true
  },
  // User email
  email: {
    type: String,
    required: true,
    unique: true, // Ensure email is unique
    trim: true,
    lowercase: true, // Convert email to lowercase
    match: [/.+@.+\..+/, 'Please fill a valid email address'] // Validate email format
  },
  // User password
  password: {
    type: String,
    required: true
  },
  // User role (admin or employee)
  role: {
    type: String,
    required: true,
    enum: ['admin', 'employee'], // Allowed values
    default: 'employee'
  }
}, { timestamps: true });

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Skip if password hasn't been modified

  try {
    const salt = await bcrypt.genSalt(10); // Generate salt for hashing
    this.password = await bcrypt.hash(this.password, salt); // Hash the password
    next();
  } catch (error) {
    // Handle hashing error
    next(new Error('Error hashing password: ' + error.message));
  }
});

// Compare password for authentication
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password); // Compare given password with hashed password
  } catch (error) {
    // Handle comparison error
    throw new Error('Error comparing passwords: ' + error.message);
  }
};

// Create and export the User model
const User = mongoose.model('User', userSchema);
module.exports = User;
