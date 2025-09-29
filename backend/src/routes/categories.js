const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Category = require('../models/Category');
const Nominee = require('../models/Nominee');
const Vote = require('../models/Vote');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', [
  query('active_only')
    .optional()
    .isBoolean()
    .withMessage('active_only must be a boolean')
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

    const { active_only } = req.query;
    const filter = {};
    
    if (active_only === 'true') {
      filter.isActive = true;
    }

    const categories = await Category.find(filter)
      .populate('createdBy', 'username email')
      .sort({ order: 1, createdAt: 1 });

    const categoriesWithNominees = await Promise.all(
      categories.map(async (category) => {
        const nominees = await Nominee.find({ 
          category: category._id, 
          isActive: true 
        })
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

        return {
          ...category.toObject(),
          nominees: nomineesWithVotes
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithNominees
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching categories'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'username email');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const nominees = await Nominee.find({ 
      category: category._id, 
      isActive: true 
    })
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
      data: {
        ...category.toObject(),
        nominees: nomineesWithVotes
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error fetching category'
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
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('maxNominees')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max nominees must be between 1 and 100'),
  body('allowMultipleVotes')
    .optional()
    .isBoolean()
    .withMessage('Allow multiple votes must be a boolean'),
  body('votingEnabled')
    .optional()
    .isBoolean()
    .withMessage('Voting enabled must be a boolean'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer')
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

    const category = new Category({
      ...req.body,
      createdBy: req.user._id
    });

    await category.save();
    await category.populate('createdBy', 'username email');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating category'
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
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('maxNominees')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max nominees must be between 1 and 100'),
  body('allowMultipleVotes')
    .optional()
    .isBoolean()
    .withMessage('Allow multiple votes must be a boolean'),
  body('votingEnabled')
    .optional()
    .isBoolean()
    .withMessage('Voting enabled must be a boolean'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer')
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

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error updating category'
    });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const nomineeCount = await Nominee.countDocuments({ category: req.params.id });
    if (nomineeCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing nominees. Remove nominees first.'
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error deleting category'
    });
  }
});

module.exports = router;