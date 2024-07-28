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
app.use(cors()); // إعداد CORS للسماح بالطلبات من جميع المصادر
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

const getCompletedAccounts = async (date) => {
  try {
    if (!date) {
      throw new Error('Date parameter is required');
    }
    
    const accounts = await Account.find({
      status: 'completed',
      completedDate: date
    }).populate('assignedEmployee');

    return accounts;
  } catch (error) {
    console.error('Error fetching completed accounts:', error);
    throw error; // إعادة الخطأ للتعامل معه في مكان آخر
  }
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

// الحصول على جميع الحسابات
// استدعاء المسار المناسب
app.get('/api/accounts', authenticateToken, async (req, res) => {
  try {
    const accounts = await Account.find().populate('assignedEmployee', 'name email');
    res.status(200).json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'Error fetching accounts', error });
  }
});

// إنشاء حساب جديد
app.post('/api/accounts', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const { email, password, code, status, assignedEmployee, quantity, searchCount, accountType } = req.body;

  try {
    const account = new Account({
      email,
      password,
      code,
      status,
      assignedEmployee,
      quantity,
      searchCount,
      accountType // تضمين الحقل الجديد
    });

    const createdAccount = await account.save();
    res.status(201).json(createdAccount);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ message: 'Error creating account', error });
  }
});

// تحديث حساب
app.put('/api/accounts/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const { id } = req.params;
  const { email, password, code, status, assignedEmployee, quantity, searchCount, accountType } = req.body;

  try {
    const updateData = { email, code, status, assignedEmployee, quantity, searchCount, accountType };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedAccount = await Account.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedAccount) return res.status(404).json({ message: 'Account not found' });

    res.status(200).json(updatedAccount);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ message: 'Error updating account', error });
  }
});

// تحديث حالة الحساب
app.put('/api/accounts/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'completed', 'closed', 'in progress'];

  // التحقق من صحة حالة الحساب
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    // العثور على الحساب بناءً على الـ ID
    const account = await Account.findById(id);
    if (!account) {
      console.error(`Account with id ${id} not found`); // تسجيل الخطأ
      return res.status(404).json({ message: 'Account not found' });
    }

    // التحقق من صلاحيات المستخدم
    if (req.user.role !== 'admin' && account.assignedEmployee.toString() !== req.user.id.toString()) {
      console.error(`Unauthorized attempt to update account ${id} by user ${req.user.id}`); // تسجيل الخطأ
      return res.status(403).json({ message: 'Forbidden: Not authorized to update this account' });
    }

    // تحديث حالة الحساب وحفظ التغييرات
    account.status = status;
    const updatedAccount = await account.save();
    res.status(200).json(updatedAccount);
  } catch (error) {
    console.error('Error updating account status:', error); // تسجيل الخطأ
    res.status(500).json({ message: 'Error updating account status', error: error.message });
  }
});

const updateAccounts = async () => {
  try {
    const accountsWithoutType = await Account.find({ accountType: { $exists: false } });
    console.log('المستندات التي لا تحتوي على الحقل accountType:', accountsWithoutType);

    if (accountsWithoutType.length === 0) {
      console.log('لا توجد مستندات تحتاج إلى تحديث.');
      return;
    }

    const result = await Account.updateMany(
      { accountType: { $exists: false } },
      { $set: { accountType: 'ps' } }
    );

    console.log(`تم تحديث ${result.modifiedCount} مستندات.`);
  } catch (error) {
    console.error('خطأ في تحديث الحسابات:', error);
  }
};



// الحصول على الحسابات الخاصة بموظف معين
app.get('/api/accounts/employee/:employeeId', authenticateToken, async (req, res) => {
  const { employeeId } = req.params;

  try {
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const accounts = await Account.find({ assignedEmployee: employeeId });
    res.status(200).json(accounts);
  } catch (error) {
    console.error('Error fetching accounts for employee:', error); // Log the error
    res.status(500).json({ message: 'Error fetching accounts for employee', error });
  }
});

// الحصول على بيانات المستخدم
// مثال على تعريف المسار في الخادم
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
});

// Assuming you're using Express and Mongoose

app.get('/api/accounts', async (req, res) => {
  try {
    const { assignedEmployee } = req.query;
    if (!assignedEmployee) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    const accounts = await Account.find({ assignedEmployee }).exec();
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Route to get employee by ID
app.get('/api/employees/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).exec();
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// تحديث مسار الحصول على الحسابات المكتملة لتضمين اسم الموظف
app.get('/api/accounts/completed', authenticateToken, async (req, res) => {
  try {
    const accounts = await Account.find({ status: 'completed' })
      .populate('assignedEmployee', 'name') // الحصول على اسم الموظف
      .exec();
    res.status(200).json(accounts);
  } catch (error) {
    console.error('Error fetching completed accounts:', error);
    res.status(500).json({ message: 'Error fetching completed accounts', error: error.message });
  }
});
app.get('/api/accounts/completed/daily', async (req, res) => {
  const { date } = req.query;
  try {
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const accounts = await getCompletedAccounts(date);
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching completed accounts:', error); // Detailed logging
    res.status(500).json({ message: 'Error fetching completed accounts', error: error.message });
  }
});

app.get('/api/accounts/completed/daily/stats', async (req, res) => {
  try {
    const stats = await getAllDailyStats(); // Adjust based on your implementation
    res.json(stats);
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ message: 'Error fetching daily stats', error });
  }
});
// حذف حساب
app.delete('/api/accounts/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const { id } = req.params;

  try {
    const account = await Account.findById(id);
    if (!account) {
      return res.status(404).json({ message: `Account with id ${id} not found` });
    }

    await Account.findByIdAndDelete(id);
    res.status(200).json({ message: `Account with id ${id} deleted successfully!` });
  } catch (error) {
    console.error(`Error deleting account with id ${id}:`, error); // Log the error with the account ID
    res.status(500).json({ message: `Error deleting account with id ${id}`, error });
  }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
