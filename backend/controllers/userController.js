const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// تسجيل مستخدم جديد
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // التحقق من وجود الحقول المطلوبة
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // التحقق من وجود المستخدم بالفعل
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // تشفير كلمة المرور
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // إنشاء مستخدم جديد
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // التحقق من إنشاء المستخدم بنجاح
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// مصادقة المستخدم
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // التحقق من وجود الحقول المطلوبة
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // العثور على المستخدم
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error authenticating user', error: error.message });
  }
};

// الحصول على جميع الموظفين
const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' });
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
};

// توليد رمز التوثيق
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

module.exports = {
  registerUser,
  authUser,
  getEmployees,
};
