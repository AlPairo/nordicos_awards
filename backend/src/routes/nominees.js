const express = require('express');
const { body, validationResult } = require('express-validator');
const Nominee = require('../models/Nominee');
const Category = require('../models/Category');
const Vote = require('../models/Vote');
const { auth, adminAuth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    
    if (category) {
      filter.category = category;
    }

    const nominees = await Nominee.find(filter)
      .populate('category', 'name description')
      .populate('createdBy', 'username email')
      .populate('linked_media')
      .sort({ order: 1, createdAt: 1 });

    const nomineesWithVotes = await Promise.all(
      nominees.map(async (nominee) => {
        const voteCount = await Vote.countDocuments({ nominee: nominee._id });
        return {
          ...nominee.toObject(),
          vote_count: voteCount
        };
      })
    );

    res.json({
      success: true,
      data: nomineesWithVotes
    });
  } catch (error) {
    console.error('Get nominees error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching nominees'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const nominee = await Nominee.findById(req.params.id)
      .populate('category', 'name description')
      .populate('createdBy', 'username email')
      .populate('linked_media');

    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    const voteCount = await Vote.countDocuments({ nominee: nominee._id });

    res.json({
      success: true,
      data: {
        ...nominee.toObject(),
        vote_count: voteCount
      }
    });
  } catch (error) {
    console.error('Get nominee error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid nominee ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error fetching nominee'
    });
  }
});

router.post('/', [
  adminAuth,
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('category')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer'),
  body('approved_media_id')
    .optional()
    .isMongoId()
    .withMessage('Valid media ID is required')
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

    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    let approvedMedia = null;
    if (req.body.approved_media_id) {
      const MediaUpload = require('../models/MediaUpload');
      approvedMedia = await MediaUpload.findById(req.body.approved_media_id);
      if (!approvedMedia) {
        return res.status(404).json({
          success: false,
          message: 'Approved media not found'
        });
      }
      if (approvedMedia.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Media is not approved'
        });
      }
    }

    const nomineesCount = await Nominee.countDocuments({ 
      category: req.body.category, 
      isActive: true 
    });

    if (nomineesCount >= category.maxNominees) {
      return res.status(400).json({
        success: false,
        message: `Maximum number of nominees (${category.maxNominees}) reached for this category`
      });
    }

    const nomineeData = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      order: req.body.order,
      createdBy: req.user._id
    };

    if (approvedMedia) {
      if (approvedMedia.media_type === 'photo') {
        nomineeData.imageUrl = approvedMedia.file_url || approvedMedia.file_path;
        nomineeData.mediaType = 'image';
      } else if (approvedMedia.media_type === 'video') {
        nomineeData.videoUrl = approvedMedia.file_url || approvedMedia.file_path;
        nomineeData.mediaType = 'video';
      }
      nomineeData.linked_media = req.body.approved_media_id;
    } else if (req.body.image_url) {
      nomineeData.imageUrl = req.body.image_url;
      nomineeData.mediaType = 'image';
    }

    const nominee = new Nominee(nomineeData);

    await nominee.save();
    await nominee.populate([
      { path: 'category', select: 'name description' },
      { path: 'createdBy', select: 'username email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Nominee created successfully',
      data: nominee
    });
  } catch (error) {
    console.error('Create nominee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating nominee'
    });
  }
});

router.put('/:id', [
  adminAuth,
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be less than 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer'),
  body('approved_media_id')
    .optional()
    .isMongoId()
    .withMessage('Valid media ID is required')
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

    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    let approvedMedia = null;
    if (req.body.approved_media_id) {
      const MediaUpload = require('../models/MediaUpload');
      approvedMedia = await MediaUpload.findById(req.body.approved_media_id);
      if (!approvedMedia) {
        return res.status(404).json({
          success: false,
          message: 'Approved media not found'
        });
      }
      if (approvedMedia.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Media is not approved'
        });
      }
    }

    const updateData = { ...req.body };
    
    if (approvedMedia) {
      if (approvedMedia.media_type === 'photo') {
        updateData.imageUrl = approvedMedia.file_url || approvedMedia.file_path;
        updateData.mediaType = 'image';
      } else if (approvedMedia.media_type === 'video') {
        updateData.videoUrl = approvedMedia.file_url || approvedMedia.file_path;
        updateData.mediaType = 'video';
      }
      updateData.linked_media = req.body.approved_media_id;
    } else if (req.body.approved_media_id === null || req.body.approved_media_id === '') {
      updateData.linked_media = null;
      updateData.imageUrl = req.body.image_url || null;
      updateData.videoUrl = null;
      updateData.mediaType = req.body.image_url ? 'image' : 'none';
    }

    const nominee = await Nominee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'category', select: 'name description' },
      { path: 'createdBy', select: 'username email' },
      { path: 'linked_media' }
    ]);

    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    res.json({
      success: true,
      message: 'Nominee updated successfully',
      data: nominee
    });
  } catch (error) {
    console.error('Update nominee error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid nominee ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error updating nominee'
    });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const nominee = await Nominee.findById(req.params.id);

    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    await Vote.deleteMany({ nominee: req.params.id });

    await Nominee.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Nominee deleted successfully'
    });
  } catch (error) {
    console.error('Delete nominee error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid nominee ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error deleting nominee'
    });
  }
});

module.exports = router;