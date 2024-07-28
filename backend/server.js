const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = 'Bndjfkrh35i45njfgjdcxk'; // تأكد من تغيير هذا السر إلى قيمة آمنة

// Middleware
app.use(cors({ origin: '*' })); // إعداد CORS للسماح بالطلبات من جميع المصادر
app.use(express.json()); // لتحليل جسم الطلب بصيغة JSON
app.use(bodyParser.json()); // لتحليل جسم الطلب بصيغة JSON

// اتصال بقاعدة بيانات MongoDB
mongoose.connect('mongodb+srv://lidodidopc3:po95vzfTYDCU5xpK@cluster0.7rpbiib.mongodb.net/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.log('Error connecting to MongoDB:', err));

// نموذج المستخدم
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  nationalId: String,
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' }
});

const User = mongoose.model('User', UserSchema);

// نموذج الحساب
const AccountSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  code: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'completed', 'closed', 'in-progress'], 
    default: 'pending' 
  },
  assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // حقل لتخزين موظف مرتبط
  quantity: { type: Number, default: 0 },
  searchCount: { type: Number, default: 0 }
}, { timestamps: true });

const Account = mongoose.model('Account', AccountSchema);

// Middleware للتحقق من التوكن
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// تسجيل مستخدم جديد
app.post('/api/register', async (req, res) => {
  const { name, email, password, phone, nationalId } = req.body;
  
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword, phone, nationalId });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ message: 'Error registering user', error });
  }
});

// تسجيل الدخول
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful!', token, user: { id: user._id, role: user.role } });
  } catch (error) {
    console.error('Error logging in:', error); // Log the error
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// تسجيل مستخدم إداري افتراضي
app.post('/api/admin/setup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({ email, password: hashedPassword, role: 'admin' });
    await admin.save();

    res.status(201).json({ message: 'Admin user created successfully!' });
  } catch (error) {
    console.error('Error creating admin user:', error); // Log the error
    res.status(500).json({ message: 'Error creating admin user', error });
  }
});

app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// الحصول على جميع الحسابات مع بيانات الموظف
app.get('/api/accounts', authenticateToken, async (req, res) => {
  try {
    // استرجاع جميع الحسابات ودمج بيانات الموظف المرتبط بكل حساب
    const accounts = await Account.find()
      .populate('assignedEmployee', 'name email'); // إدراج اسم وبيانات الموظف
    res.status(200).json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'Error fetching accounts', error: error.message });
  }
});

// الحصول على جميع الموظفين
app.get('/api/employees', authenticateToken, async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' });
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error); // Log the error
    res.status(500).json({ message: 'Error fetching employees', error });
  }
});

// إنشاء حساب جديد
app.post('/api/accounts', authenticateToken, async (req, res) => {
  const { email, password, code, status, assignedEmployee, quantity, searchCount } = req.body;

  try {
    const newAccount = new Account({ email, password, code, status, assignedEmployee, quantity, searchCount });
    await newAccount.save();
    res.status(201).json(newAccount);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ message: 'Error creating account', error });
  }
});

// تحديث حالة الحساب
app.put('/api/accounts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'completed', 'closed', 'in-progress'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const updatedAccount = await Account.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedAccount) return res.status(404).json({ message: 'Account not found' });

    res.status(200).json(updatedAccount);
  } catch (error) {
    console.error('Error updating account status:', error);
    res.status(500).json({ message: 'Error updating account status', error });
  }
});

// حذف حساب
app.delete('/api/accounts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedAccount = await Account.findByIdAndDelete(id);
    if (!deletedAccount) return res.status(404).json({ message: 'Account not found' });

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Error deleting account', error });
  }
});

// استيراد الحسابات من ملف
app.post('/api/accounts/import', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  try {
    // معالجة وتحليل الملف المرفوع هنا
    res.status(200).json({ message: 'Accounts imported successfully' });
  } catch (error) {
    console.error('Error importing accounts:', error);
    res.status(500).json({ message: 'Error importing accounts', error });
  }
});

// بدء تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
