const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  description: { type: String, default: 'Income' },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Income', incomeSchema);
