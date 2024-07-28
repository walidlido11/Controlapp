const Account = require('../models/accountModel'); // تأكد من صحة المسار لنموذج الحساب
const Employee = require('../models/employeeModel'); // تأكد من صحة المسار لنموذج الموظف

// الحصول على جميع الحسابات
exports.getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find().populate('assignedEmployee', 'name').exec();
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching accounts', error: error.message });
  }
};

// الحصول على حسابات موظف معين
exports.getAccountsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const accounts = await Account.find({ assignedEmployee: employeeId }).populate('assignedEmployee', 'name').exec();

    if (accounts.length === 0) {
      return res.status(404).json({ message: 'No accounts found for this employee' });
    }

    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching accounts by employee', error: error.message });
  }
};

// إنشاء حساب جديد
exports.createAccount = async (req, res) => {
  try {
    const { email, password, code, status, accountType, quantity = 0, searchCount = 0, assignedEmployee } = req.body;

    // التحقق من وجود جميع الحقول المطلوبة
    if (!email || !password || !code || !status || !accountType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // إنشاء حساب جديد
    const newAccount = new Account({
      email,
      password,
      code,
      status,
      accountType, // التأكد من إضافة accountType
      quantity,
      searchCount,
      assignedEmployee
    });

    await newAccount.save();
    res.status(201).json(newAccount);
  } catch (error) {
    res.status(500).json({ message: 'Error creating account', error: error.message });
  }
};

// تحديث حساب بناءً على ID
exports.updateAccount = async (req, res) => {
  try {
    const accountId = req.params.id;
    const updatedData = req.body;

    // التحقق من وجود الحقول المطلوبة
    if (!updatedData.email || !updatedData.password || !updatedData.code || !updatedData.status || !updatedData.accountType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const account = await Account.findById(accountId).populate('assignedEmployee', 'name').exec();
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // تحديث الحساب
    Object.assign(account, updatedData);
    await account.save();

    res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ message: 'Error updating account', error: error.message });
  }
};

// حذف حساب بناءً على ID
exports.deleteAccount = async (req, res) => {
  try {
    const accountId = req.params.id;
    const account = await Account.findByIdAndDelete(accountId).populate('assignedEmployee', 'name').exec();

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
};

// تحديث حالة حساب بناءً على ID
exports.updateAccountStatus = async (req, res) => {
  try {
    const accountId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status field is required' });
    }

    const account = await Account.findById(accountId).populate('assignedEmployee', 'name').exec();
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // تحديث حالة الحساب
    account.status = status;
    await account.save();

    res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ message: 'Error updating account status', error: error.message });
  }
};

// الحصول على الحسابات المكتملة
exports.getCompletedAccounts = async (req, res) => {
  try {
    const completedAccounts = await Account.find({ status: 'completed' }).populate('assignedEmployee', 'name').exec();
    res.status(200).json(completedAccounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching completed accounts', error: error.message });
  }
};
