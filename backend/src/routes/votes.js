const express = require('express');
const { body, validationResult } = require('express-validator');
const Vote = require('../models/Vote');
const Category = require('../models/Category');
const Nominee = require('../models/Nominee');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/', [
  auth,
  body('category')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('nominee')
    .isMongoId()
    .withMessage('Valid nominee ID is required')
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

    const { category, nominee } = req.body;

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (!categoryDoc.isActive || !categoryDoc.votingEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Voting is not enabled for this category'
      });
    }

    const nomineeDoc = await Nominee.findById(nominee);
    if (!nomineeDoc) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    if (!nomineeDoc.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This nominee is not active'
      });
    }

    if (nomineeDoc.category.toString() !== category) {
      return res.status(400).json({
        success: false,
        message: 'Nominee does not belong to the specified category'
      });
    }

    if (!categoryDoc.allowMultipleVotes) {
      const existingVote = await Vote.findOne({
        user: req.user._id,
        category: category
      });

      if (existingVote) {
        return res.status(400).json({
          success: false,
          message: 'You have already voted in this category'
        });
      }
    }

    const vote = new Vote({
      user: req.user._id,
      category,
      nominee,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    await vote.save();
    await vote.populate([
      { path: 'user', select: 'username email' },
      { path: 'category', select: 'name description' },
      { path: 'nominee', select: 'name description' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Vote cast successfully',
      data: vote
    });
  } catch (error) {
    console.error('Cast vote error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this category'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error casting vote'
    });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const votes = await Vote.find({ user: req.user._id })
      .populate('category', 'name description')
      .populate('nominee', 'name description')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: votes
    });
  } catch (error) {
    console.error('Get user votes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching votes'
    });
  }
});

router.get('/results', async (req, res) => {
  try {
    const { category } = req.query;

    const matchStage = {};
    if (category) {
      matchStage.category = require('mongoose').Types.ObjectId(category);
    }

    const results = await Vote.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            category: '$category',
            nominee: '$nominee'
          },
          voteCount: { $sum: 1 },
          voters: { $addToSet: '$user' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id.category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $lookup: {
          from: 'nominees',
          localField: '_id.nominee',
          foreignField: '_id',
          as: 'nomineeInfo'
        }
      },
      {
        $unwind: '$categoryInfo'
      },
      {
        $unwind: '$nomineeInfo'
      },
      {
        $group: {
          _id: '$_id.category',
          categoryName: { $first: '$categoryInfo.name' },
          categoryDescription: { $first: '$categoryInfo.description' },
          totalVotes: { $sum: '$voteCount' },
          nominees: {
            $push: {
              id: '$_id.nominee',
              name: '$nomineeInfo.name',
              description: '$nomineeInfo.description',
              voteCount: '$voteCount',
              voterCount: { $size: '$voters' }
            }
          }
        }
      },
      {
        $sort: { categoryName: 1 }
      }
    ]);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get voting results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching voting results'
    });
  }
});

router.delete('/my/:categoryId', auth, async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (!category.votingEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Voting is disabled for this category'
      });
    }

    const deletedVote = await Vote.findOneAndDelete({
      user: req.user._id,
      category: categoryId
    });

    if (!deletedVote) {
      return res.status(404).json({
        success: false,
        message: 'No vote found for this category'
      });
    }

    res.json({
      success: true,
      message: 'Vote removed successfully'
    });
  } catch (error) {
    console.error('Remove vote error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error removing vote'
    });
  }
});

module.exports = router;