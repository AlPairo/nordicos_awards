const express = require('express');
const path = require('path');
const fs = require('fs');
const { body, validationResult, query, param } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');
const {
  createMediaUpload,
  updateMediaStatus,
  listPendingMedia,
  listMediaForUser,
  listMedia,
  findMediaById,
  deleteMedia,
  deleteMediaAsAdmin
} = require('../services/media');

const router = express.Router();

router.post('/upload', auth, upload.single('file'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const mediaType = req.file.mimetype.startsWith('image/') ? 'photo' : 'video';
    const mediaUpload = await createMediaUpload({
      userId: req.user.id,
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      mediaType,
      fileSize: req.file.size,
      description: req.body.description || ''
    });

    const hydrated = await findMediaById(mediaUpload.id);

    res.json({
      success: true,
      message: 'File uploaded successfully and awaiting review',
      data: hydrated || mediaUpload
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Server error uploading file' });
  }
});

router.post('/review', [
  adminAuth,
  body('mediaId').isUUID().withMessage('Valid media ID is required'),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('adminNotes').optional().isString().withMessage('Admin notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const mediaUpload = await findMediaById(req.body.mediaId);
    if (!mediaUpload) {
      return res.status(404).json({ success: false, message: 'Media upload not found' });
    }

    const updated = await updateMediaStatus({
      mediaId: req.body.mediaId,
      status: req.body.status,
      adminNotes: req.body.adminNotes,
      reviewerId: req.user.id
    });

    if (req.body.status === 'rejected') {
      const filePath = path.join(__dirname, '../../uploads', mediaUpload.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error('Error deleting rejected file:', error);
        }
      }
    }

    const hydrated = await findMediaById(req.body.mediaId);

    res.json({
      success: true,
      message: `Media ${req.body.status} successfully`,
      data: hydrated || updated
    });
  } catch (error) {
    console.error('Review media error:', error);
    res.status(500).json({ success: false, message: 'Server error reviewing media' });
  }
});

router.get('/pending', adminAuth, async (req, res) => {
  try {
    const pendingUploads = await listPendingMedia();
    res.json({ success: true, data: pendingUploads });
  } catch (error) {
    console.error('Get pending media error:', error);
    res.status(500).json({ success: false, message: 'Server error getting pending media uploads' });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const mediaUploads = await listMediaForUser(req.user.id);
    res.json({ success: true, data: mediaUploads });
  } catch (error) {
    console.error('Get my media error:', error);
    res.status(500).json({ success: false, message: 'Server error getting media uploads' });
  }
});

router.get('/', auth, [
  query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Status must be pending, approved, or rejected')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const mediaUploads = await listMedia({
      status: req.query.status,
      isAdmin: req.user.role === 'admin',
      userId: req.user.id
    });

    res.json({ success: true, data: mediaUploads });
  } catch (error) {
    console.error('List media error:', error);
    res.status(500).json({ success: false, message: 'Server error listing media uploads' });
  }
});

router.get('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
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
    res.status(500).json({ success: false, message: 'Server error serving file' });
  }
});

router.delete('/:id', [auth, param('id').isUUID().withMessage('Invalid media ID')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const mediaUpload = await findMediaById(req.params.id);
    if (!mediaUpload) {
      return res.status(404).json({ success: false, message: 'Media upload not found' });
    }

    if (req.user.role !== 'admin' && mediaUpload.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this media' });
    }

    const filePath = path.join(__dirname, '../../uploads', mediaUpload.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    await deleteMedia(req.params.id);

    res.json({ success: true, message: 'Media upload deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting media' });
  }
});

router.delete('/admin/:id', [adminAuth, param('id').isUUID().withMessage('Invalid media ID')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const mediaUpload = await findMediaById(req.params.id);
    if (!mediaUpload) {
      return res.status(404).json({ success: false, message: 'Media upload not found' });
    }

    const filePath = path.join(__dirname, '../../uploads', mediaUpload.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    await deleteMediaAsAdmin({ mediaId: req.params.id, deletedBy: req.user.id });

    res.json({ success: true, message: 'Media upload deleted by admin successfully' });
  } catch (error) {
    console.error('Admin delete media error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting media' });
  }
});

module.exports = router;
