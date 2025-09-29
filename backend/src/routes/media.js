const express = require('express');
const path = require('path');
const fs = require('fs');
const { body, validationResult, query } = require('express-validator');
const Nominee = require('../models/Nominee');
const MediaUpload = require('../models/MediaUpload');
const { auth, adminAuth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

router.post('/upload', auth, upload.single('file'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const mediaType = req.file.mimetype.startsWith('image/') ? 'photo' : 'video';
    const { description } = req.body;

    const mediaUpload = new MediaUpload({
      user_id: req.user.id,
      filename: req.file.filename,
      original_filename: req.file.originalname,
      file_path: `/uploads/${req.file.filename}`,
      media_type: mediaType,
      file_size: req.file.size,
      description: description || '',
      status: 'pending'
    });

    await mediaUpload.save();

    await mediaUpload.populate('user_id', 'username email');

    res.json({
      success: true,
      message: 'File uploaded successfully and awaiting review',
      data: mediaUpload
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading file'
    });
  }
});

router.post('/review', [
  adminAuth,
  body('mediaId')
    .isMongoId()
    .withMessage('Valid media ID is required'),
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be approved or rejected'),
  body('adminNotes')
    .optional()
    .isString()
    .withMessage('Admin notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { mediaId, status, adminNotes } = req.body;

    const mediaUpload = await MediaUpload.findById(mediaId);
    if (!mediaUpload) {
      return res.status(404).json({
        success: false,
        message: 'Media upload not found'
      });
    }

    mediaUpload.status = status;
    mediaUpload.admin_notes = adminNotes || '';
    mediaUpload.reviewed_by = req.user.id;
    mediaUpload.reviewed_at = new Date();

    await mediaUpload.save();

    if (status === 'rejected') {
      const filePath = path.join(__dirname, '../../uploads', mediaUpload.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error('Error deleting rejected file:', error);
        }
      }
    }

    await mediaUpload.populate([
      { path: 'user_id', select: 'username email' },
      { path: 'reviewed_by', select: 'username email' }
    ]);

    res.json({
      success: true,
      message: `Media ${status} successfully`,
      data: mediaUpload
    });
  } catch (error) {
    console.error('Review media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error reviewing media'
    });
  }
});

router.get('/pending', adminAuth, async (req, res) => {
  try {
    const pendingUploads = await MediaUpload.find({ status: 'pending' })
      .populate('user_id', 'username email fullName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pendingUploads
    });
  } catch (error) {
    console.error('Get pending media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting pending media uploads'
    });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const mediaUploads = await MediaUpload.find({ user_id: req.user.id })
      .populate('reviewed_by', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: mediaUploads
    });
  } catch (error) {
    console.error('Get my media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting media uploads'
    });
  }
});

router.get('/', auth, [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be pending, approved, or rejected')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status } = req.query;
    
    let query = {};
    
    if (req.user.role !== 'admin') {
      query.user_id = req.user.id;
    }
    
    if (status) {
      query.status = status;
    }

    const mediaUploads = await MediaUpload.find(query)
      .populate('user_id', 'username email')
      .populate('reviewed_by', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: mediaUploads
    });
  } catch (error) {
    console.error('List media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error listing media uploads'
    });
  }
});

router.get('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';

    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.mp4':
        contentType = 'video/mp4';
        break;
      case '.mov':
        contentType = 'video/quicktime';
        break;
      case '.avi':
        contentType = 'video/x-msvideo';
        break;
      case '.wmv':
        contentType = 'video/x-ms-wmv';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error serving file'
    });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const mediaId = req.params.id;

    const mediaUpload = await MediaUpload.findById(mediaId);
    if (!mediaUpload) {
      return res.status(404).json({
        success: false,
        message: 'Media upload not found'
      });
    }

    if (req.user.role !== 'admin' && mediaUpload.user_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this media'
      });
    }

    const filePath = path.join(__dirname, '../../uploads', mediaUpload.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    await MediaUpload.findByIdAndDelete(mediaId);

    res.json({
      success: true,
      message: 'Media upload deleted successfully'
    });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting media'
    });
  }
});

module.exports = router;