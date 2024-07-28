const express = require('express');
const router = express.Router();
const Account = require('./models/Account'); // تعديل المسار حسب موقع ملف النموذج (model)

// نقطة النهاية للحصول على الحسابات المكتملة لليوم المحدد
router.get('/completed/daily', async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date query parameter is required' });
  }

  try {
    // افترض أن لديك طريقة للبحث عن الحسابات المكتملة بتاريخ معين
    const completedAccounts = await Account.find({ 
      completedDate: { $gte: new Date(date).setHours(0, 0, 0, 0), $lt: new Date(date).setHours(23, 59, 59, 999) } 
    }).populate('assignedEmployee');

    res.status(200).json(completedAccounts);
  } catch (error) {
    console.error('Error fetching completed accounts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
