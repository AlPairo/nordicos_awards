const express = require('express');
const { body, validationResult, query, param } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const { listNominees, getNomineeById, createNominee, updateNominee, deleteNominee, countNominees } = require('../services/nominees');
const { getCategoryById } = require('../services/categories');
const { findMediaById } = require('../services/media');

const router = express.Router();

router.get('/', [
  query('category').optional().isUUID().withMessage('Category must be a valid UUID'),
  query('category_id').optional().isUUID().withMessage('Category must be a valid UUID'),
  query('active_only').optional().isBoolean().withMessage('active_only must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const filterCategory = req.query.category || req.query.category_id;
    const activeOnly = req.query.active_only !== 'false';
    const nominees = await listNominees({
      categoryId: filterCategory,
      onlyActive: activeOnly
    });

    res.json({ success: true, data: nominees });
  } catch (error) {
    console.error('Get nominees error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching nominees' });
  }
});

router.get('/:id', [param('id').isUUID().withMessage('Invalid nominee ID')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const nominee = await getNomineeById(req.params.id);
    if (!nominee) {
      return res.status(404).json({ success: false, message: 'Nominee not found' });
    }

    res.json({ success: true, data: nominee });
  } catch (error) {
    console.error('Get nominee error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching nominee' });
  }
});

router.post('/', [
  adminAuth,
  body('name').isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('category').optional().isUUID().withMessage('Valid category ID is required'),
  body('category_id').optional().isUUID().withMessage('Valid category ID is required'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer'),
  body('approved_media_id').optional().isUUID().withMessage('Valid media ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const categoryId = req.body.category || req.body.category_id;
    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const category = await getCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const nomineesCount = await countNominees(categoryId);
    if (nomineesCount >= category.maxNominees) {
      return res.status(400).json({
        success: false,
        message: `Maximum number of nominees (${category.maxNominees}) reached for this category`
      });
    }

    let approvedMedia = null;
    if (req.body.approved_media_id) {
      approvedMedia = await findMediaById(req.body.approved_media_id);
      if (!approvedMedia) {
        return res.status(404).json({ success: false, message: 'Approved media not found' });
      }
      if (approvedMedia.status !== 'approved') {
        return res.status(400).json({ success: false, message: 'Media is not approved' });
      }
    }

    const nomineeId = await createNominee({
      name: req.body.name,
      description: req.body.description,
      category: categoryId,
      order: req.body.order || 0,
      createdBy: req.user.id,
      linkedMedia: req.body.approved_media_id || null,
      mediaType: approvedMedia ? (approvedMedia.media_type === 'photo' ? 'image' : 'video') : (req.body.image_url ? 'image' : 'none'),
      imageUrl: approvedMedia && approvedMedia.media_type === 'photo' ? approvedMedia.file_path : req.body.image_url || null,
      videoUrl: approvedMedia && approvedMedia.media_type === 'video' ? approvedMedia.file_path : req.body.video_url || null
    });

    const nominee = await getNomineeById(nomineeId);

    res.status(201).json({
      success: true,
      message: 'Nominee created successfully',
      data: nominee
    });
  } catch (error) {
    console.error('Create nominee error:', error);
    res.status(500).json({ success: false, message: 'Server error creating nominee' });
  }
});

router.put('/:id', [
  adminAuth,
  param('id').isUUID().withMessage('Invalid nominee ID'),
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be less than 100 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('category').optional().isUUID().withMessage('Valid category ID is required'),
  body('category_id').optional().isUUID().withMessage('Valid category ID is required'),
  body('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer'),
  body('approved_media_id').optional().isUUID().withMessage('Valid media ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const updatedCategoryId = req.body.category || req.body.category_id;
    if (updatedCategoryId) {
      const category = await getCategoryById(updatedCategoryId);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
    }

    let approvedMedia = null;
    if (req.body.approved_media_id) {
      approvedMedia = await findMediaById(req.body.approved_media_id);
      if (!approvedMedia) {
        return res.status(404).json({ success: false, message: 'Approved media not found' });
      }
      if (approvedMedia.status !== 'approved') {
        return res.status(400).json({ success: false, message: 'Media is not approved' });
      }
    }

    const updateData = {
      name: req.body.name,
      description: req.body.description,
      category: updatedCategoryId,
      isActive: req.body.isActive,
      order: req.body.order
    };

    if (approvedMedia) {
      updateData.linked_media = req.body.approved_media_id;
      if (approvedMedia.media_type === 'photo') {
        updateData.imageUrl = approvedMedia.file_path;
        updateData.mediaType = 'image';
        updateData.videoUrl = null;
      } else {
        updateData.videoUrl = approvedMedia.file_path;
        updateData.mediaType = 'video';
        updateData.imageUrl = null;
      }
    } else if (typeof req.body.approved_media_id !== 'undefined' && !req.body.approved_media_id) {
      updateData.linked_media = null;
      updateData.imageUrl = req.body.image_url || null;
      updateData.videoUrl = req.body.video_url || null;
      updateData.mediaType = req.body.image_url ? 'image' : (req.body.video_url ? 'video' : 'none');
    }

    await updateNominee(req.params.id, updateData);
    const nominee = await getNomineeById(req.params.id);
    if (!nominee) {
      return res.status(404).json({ success: false, message: 'Nominee not found' });
    }

    res.json({ success: true, message: 'Nominee updated successfully', data: nominee });
  } catch (error) {
    console.error('Update nominee error:', error);
    res.status(500).json({ success: false, message: 'Server error updating nominee' });
  }
});

router.delete('/:id', [adminAuth, param('id').isUUID().withMessage('Invalid nominee ID')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const nominee = await getNomineeById(req.params.id);
    if (!nominee) {
      return res.status(404).json({ success: false, message: 'Nominee not found' });
    }

    await deleteNominee(req.params.id);

    res.json({ success: true, message: 'Nominee deleted successfully' });
  } catch (error) {
    console.error('Delete nominee error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting nominee' });
  }
});

module.exports = router;
