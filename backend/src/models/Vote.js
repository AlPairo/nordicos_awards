const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  nominee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nominee',
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

voteSchema.index({ user: 1, category: 1 }, { unique: true });

voteSchema.index({ category: 1, nominee: 1 });
voteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Vote', voteSchema);