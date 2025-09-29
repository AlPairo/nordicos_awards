const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  maxNominees: {
    type: Number,
    default: 10
  },
  allowMultipleVotes: {
    type: Boolean,
    default: false
  },
  votingEnabled: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

categorySchema.index({ isActive: 1, order: 1 });

categorySchema.virtual('nomineesCount', {
  ref: 'Nominee',
  localField: '_id',
  foreignField: 'category',
  count: true
});

categorySchema.virtual('votesCount', {
  ref: 'Vote',
  localField: '_id',
  foreignField: 'category',
  count: true
});

categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Category', categorySchema);