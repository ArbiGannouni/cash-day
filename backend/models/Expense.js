const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: { type: String, default: 'default_user', index: true }, // Placeholder for future auth
  amount: { type: Number, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
  description: { type: String },
  originalText: { type: String },
  aiConfidence: { type: Number },
  isManuallyEdited: { type: Boolean, default: false },
  tags: [{ type: String }],
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'Transfer', 'Other'], default: 'Cash' },
  date: { type: Date, default: Date.now, index: true },
  type: { type: String, default: 'expense' },
});

// Compound indexes for performance
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, categoryId: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
