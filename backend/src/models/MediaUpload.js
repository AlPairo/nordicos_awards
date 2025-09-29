const mongoose = require('mongoose');

const mediaUploadSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  original_filename: {
    type: String,
    required: true
  },
  file_path: {
    type: String,
    required: true
  },
  media_type: {
    type: String,
    enum: ['photo', 'video'],
    required: true
  },
  file_size: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  description: {
    type: String,
    trim: true
  },
  admin_notes: {
    type: String,
    trim: true
  },
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewed_at: {
    type: Date
  }
}, {
  timestamps: true
});

mediaUploadSchema.index({ user_id: 1, status: 1 });
mediaUploadSchema.index({ status: 1, createdAt: -1 });

mediaUploadSchema.virtual('file_url').get(function() {
  return `/uploads/${this.filename}`;
});

mediaUploadSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('MediaUpload', mediaUploadSchema);