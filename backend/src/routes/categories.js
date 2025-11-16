const express = require('express');
const { body, validationResult, query, param } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const {
  fetchCategoriesWithNominees,
  getCategoryWithNominees,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  countNomineesInCategory
} = require('../services/categories');

const router = express.Router();

router.get('/', [
  query('active_only').optional().isBoolean().withMessage('active_only must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const activeOnly = req.query.active_only === 'true';
    console.log('[GET /categories] params:', req.query);
    const categories = await fetchCategoriesWithNominees({ activeOnly });
    console.log('[GET /categories] returned count:', categories.length);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching categories' });
  }
});

router.get('/:id', [param('id').isUUID().withMessage('Invalid category ID')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const category = await getCategoryWithNominees(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching category' });
  }
});

router.post('/', [
  adminAuth,
  body('name').isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('year').optional().isInt({ min: 1900, max: 9999 }).withMessage('Year must be a valid number'),
  body('maxNominees').optional().isInt({ min: 1, max: 100 }).withMessage('Max nominees must be between 1 and 100'),
  body('allowMultipleVotes').optional().isBoolean().withMessage('Allow multiple votes must be a boolean'),
  body('votingEnabled').optional().isBoolean().withMessage('Voting enabled must be a boolean'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const orderValue = typeof req.body.order !== 'undefined' ? req.body.order : req.body.display_order;
    console.log('[POST /categories] payload:', req.body);
    const category = await createCategory({
      ...req.body,
      order: orderValue,
      year: req.body.year,
      createdBy: req.user.id
    });
    console.log('[POST /categories] created:', category?.id);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Server error creating category' });
  }
});

router.put('/:id', [
  adminAuth,
  param('id').isUUID().withMessage('Invalid category ID'),
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be less than 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('year').optional().isInt({ min: 1900, max: 9999 }).withMessage('Year must be a valid number'),
  body('maxNominees').optional().isInt({ min: 1, max: 100 }).withMessage('Max nominees must be between 1 and 100'),
  body('allowMultipleVotes').optional().isBoolean().withMessage('Allow multiple votes must be a boolean'),
  body('votingEnabled').optional().isBoolean().withMessage('Voting enabled must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const orderValue = typeof req.body.order !== 'undefined' ? req.body.order : req.body.display_order;
    console.log('[PUT /categories/:id] payload:', req.params.id, req.body);
    const category = await updateCategory(req.params.id, {
      name: req.body.name,
      description: req.body.description,
      isActive: req.body.isActive,
      maxNominees: req.body.maxNominees,
      allowMultipleVotes: req.body.allowMultipleVotes,
      votingEnabled: req.body.votingEnabled,
      order: orderValue,
      year: req.body.year
    });
    console.log('[PUT /categories/:id] updated:', category?.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, message: 'Category updated successfully', data: category });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Server error updating category' });
  }
});

router.delete('/:id', [adminAuth, param('id').isUUID().withMessage('Invalid category ID')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const category = await getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const nomineeCount = await countNomineesInCategory(req.params.id);
    if (nomineeCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing nominees. Remove nominees first.'
      });
    }

    await deleteCategory(req.params.id);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting category' });
  }
});

module.exports = router;
