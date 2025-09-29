const mongoose = require('mongoose');

const nomineeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    trim: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'both', 'none'],
    default: 'none'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  metadata: {
    originalFilename: String,
    fileSize: Number,
    mimeType: String,
    uploadedAt: Date
  },
  linked_media: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MediaUpload'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

nomineeSchema.index({ category: 1, isActive: 1, order: 1 });

nomineeSchema.virtual('votesCount', {
  ref: 'Vote',
  localField: '_id',
  foreignField: 'nominee',
  count: true
});

nomineeSchema.set('toJSON', { virtuals: true });
nomineeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Nominee', nomineeSchema);