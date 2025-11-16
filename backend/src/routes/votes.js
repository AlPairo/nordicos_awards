const express = require('express');
const { body, validationResult, query, param } = require('express-validator');
const { auth } = require('../middleware/auth');
const { getCategoryById } = require('../services/categories');
const { getNomineeById } = require('../services/nominees');
const {
  createVote,
  getVotesByUser,
  getResults,
  deleteVoteForUserAndCategory,
  getVoteForUserAndCategory,
  deleteVoteById
} = require('../services/votes');

const router = express.Router();

router.post('/', [
  auth,
  body('category').isUUID().withMessage('Valid category ID is required'),
  body('nominee').isUUID().withMessage('Valid nominee ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { category, nominee } = req.body;

    const categoryDoc = await getCategoryById(category);
    if (!categoryDoc) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (!categoryDoc.isActive || !categoryDoc.votingEnabled) {
      return res.status(400).json({ success: false, message: 'Voting is not enabled for this category' });
    }

    const nomineeDoc = await getNomineeById(nominee);
    if (!nomineeDoc) {
      return res.status(404).json({ success: false, message: 'Nominee not found' });
    }

    if (!nomineeDoc.isActive) {
      return res.status(400).json({ success: false, message: 'This nominee is not active' });
    }

    if (nomineeDoc.category !== category) {
      return res.status(400).json({ success: false, message: 'Nominee does not belong to the specified category' });
    }

    if (!categoryDoc.allowMultipleVotes) {
      const existingVote = await getVoteForUserAndCategory({ userId: req.user.id, categoryId: category });
      if (existingVote) {
        return res.status(400).json({ success: false, message: 'You have already voted in this category' });
      }
    }

    let voteRecord;
    try {
      voteRecord = await createVote({
        userId: req.user.id,
        categoryId: category,
        nomineeId: nominee,
        ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(400).json({ success: false, message: 'You have already voted in this category' });
      }
      throw error;
    }

    const responseVote = {
      ...voteRecord,
      user_id: voteRecord.user_id,
      category_id: voteRecord.category_id,
      nominee_id: voteRecord.nominee_id,
      ip_address: voteRecord.ip_address,
      user_agent: voteRecord.user_agent,
      created_at: voteRecord.created_at,
      createdAt: voteRecord.created_at
    };

    res.status(201).json({
      success: true,
      message: 'Vote cast successfully',
      data: responseVote
    });
  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({ success: false, message: 'Server error casting vote' });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const votes = await getVotesByUser(req.user.id);
    res.json({ success: true, data: votes });
  } catch (error) {
    console.error('Get user votes error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching votes' });
  }
});

router.get('/results', [query('category').optional().isUUID().withMessage('Category must be a valid UUID')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const results = await getResults({ categoryId: req.query.category });
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Get voting results error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching voting results' });
  }
});

router.delete('/my/:categoryId', [auth, param('categoryId').isUUID().withMessage('Invalid category ID')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const category = await getCategoryById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (!category.votingEnabled) {
      return res.status(400).json({ success: false, message: 'Voting is disabled for this category' });
    }

    const deleted = await deleteVoteForUserAndCategory({ userId: req.user.id, categoryId: req.params.categoryId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'No vote found for this category' });
    }

    res.json({ success: true, message: 'Vote removed successfully' });
  } catch (error) {
    console.error('Remove vote error:', error);
    res.status(500).json({ success: false, message: 'Server error removing vote' });
  }
});

router.delete('/:voteId', [auth, param('voteId').isUUID().withMessage('Invalid vote ID')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const deleted = await deleteVoteById({ userId: req.user.id, voteId: req.params.voteId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Vote not found' });
    }

    res.json({ success: true, message: 'Vote removed successfully' });
  } catch (error) {
    console.error('Delete vote error:', error);
    res.status(500).json({ success: false, message: 'Server error removing vote' });
  }
});

module.exports = router;
