const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all deadlines for user
router.get('/', async (req, res) => {
  try {
    const { type, completed, universityId, upcoming } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(type && { type }),
      ...(completed !== undefined && { completed: completed === 'true' }),
      ...(universityId && { universityId })
    };

    // Filter for upcoming deadlines (next 30 days)
    if (upcoming === 'true') {
      where.date = {
        gte: new Date(),
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
      where.completed = false;
    }

    const deadlines = await prisma.deadline.findMany({
      where,
      include: {
        university: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Categorize deadlines by urgency
    const now = new Date();
    const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const categorizedDeadlines = {
      overdue: deadlines.filter(d => !d.completed && d.date < now),
      thisWeek: deadlines.filter(d => !d.completed && d.date >= now && d.date <= oneWeek),
      thisMonth: deadlines.filter(d => !d.completed && d.date > oneWeek && d.date <= oneMonth),
      upcoming: deadlines.filter(d => !d.completed && d.date > oneMonth),
      completed: deadlines.filter(d => d.completed)
    };

    res.json({ 
      deadlines,
      categorizedDeadlines 
    });
  } catch (error) {
    console.error('Get deadlines error:', error);
    res.status(500).json({
      error: 'Failed to fetch deadlines',
      message: 'Internal server error'
    });
  }
});

// Get single deadline
router.get('/:id', async (req, res) => {
  try {
    const deadline = await prisma.deadline.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        university: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    if (!deadline) {
      return res.status(404).json({
        error: 'Deadline not found',
        message: 'Deadline not found or access denied'
      });
    }

    res.json({ deadline });
  } catch (error) {
    console.error('Get deadline error:', error);
    res.status(500).json({
      error: 'Failed to fetch deadline',
      message: 'Internal server error'
    });
  }
});

// Create deadline
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('type').isIn(['APPLICATION', 'LOR', 'TRANSCRIPT', 'INTERVIEW', 'DECISION', 'OTHER']),
  body('date').isISO8601(),
  body('universityId').optional().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      title,
      type,
      date,
      universityId
    } = req.body;

    // Verify university exists and belongs to user if provided
    if (universityId) {
      const university = await prisma.university.findFirst({
        where: {
          id: universityId,
          userId: req.user.id
        }
      });

      if (!university) {
        return res.status(400).json({
          error: 'Invalid university',
          message: 'University not found or access denied'
        });
      }
    }

    const deadline = await prisma.deadline.create({
      data: {
        title,
        type,
        date: new Date(date),
        userId: req.user.id,
        universityId
      },
      include: {
        university: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Deadline created successfully',
      deadline
    });
  } catch (error) {
    console.error('Create deadline error:', error);
    res.status(500).json({
      error: 'Failed to create deadline',
      message: 'Internal server error'
    });
  }
});

// Update deadline
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('type').optional().isIn(['APPLICATION', 'LOR', 'TRANSCRIPT', 'INTERVIEW', 'DECISION', 'OTHER']),
  body('date').optional().isISO8601(),
  body('completed').optional().isBoolean(),
  body('universityId').optional().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if deadline exists and belongs to user
    const existingDeadline = await prisma.deadline.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingDeadline) {
      return res.status(404).json({
        error: 'Deadline not found',
        message: 'Deadline not found or access denied'
      });
    }

    const {
      title,
      type,
      date,
      completed,
      universityId
    } = req.body;

    // Verify university exists and belongs to user if provided
    if (universityId) {
      const university = await prisma.university.findFirst({
        where: {
          id: universityId,
          userId: req.user.id
        }
      });

      if (!university) {
        return res.status(400).json({
          error: 'Invalid university',
          message: 'University not found or access denied'
        });
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = new Date(date);
    if (completed !== undefined) updateData.completed = completed;
    if (universityId !== undefined) updateData.universityId = universityId;

    const deadline = await prisma.deadline.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        university: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    res.json({
      message: 'Deadline updated successfully',
      deadline
    });
  } catch (error) {
    console.error('Update deadline error:', error);
    res.status(500).json({
      error: 'Failed to update deadline',
      message: 'Internal server error'
    });
  }
});

// Delete deadline
router.delete('/:id', async (req, res) => {
  try {
    // Check if deadline exists and belongs to user
    const existingDeadline = await prisma.deadline.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingDeadline) {
      return res.status(404).json({
        error: 'Deadline not found',
        message: 'Deadline not found or access denied'
      });
    }

    await prisma.deadline.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Deadline deleted successfully'
    });
  } catch (error) {
    console.error('Delete deadline error:', error);
    res.status(500).json({
      error: 'Failed to delete deadline',
      message: 'Internal server error'
    });
  }
});

// Get deadline statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const now = new Date();
    const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get overdue deadlines
    const overdueCount = await prisma.deadline.count({
      where: {
        userId: req.user.id,
        completed: false,
        date: { lt: now }
      }
    });

    // Get deadlines this week
    const thisWeekCount = await prisma.deadline.count({
      where: {
        userId: req.user.id,
        completed: false,
        date: {
          gte: now,
          lte: oneWeek
        }
      }
    });

    // Get deadlines this month
    const thisMonthCount = await prisma.deadline.count({
      where: {
        userId: req.user.id,
        completed: false,
        date: {
          gte: now,
          lte: oneMonth
        }
      }
    });

    // Get completed deadlines
    const completedCount = await prisma.deadline.count({
      where: {
        userId: req.user.id,
        completed: true
      }
    });

    // Get deadlines by type
    const typeStats = await prisma.deadline.groupBy({
      by: ['type'],
      where: {
        userId: req.user.id
      },
      _count: {
        id: true
      }
    });

    const typeSummary = typeStats.reduce((acc, stat) => {
      acc[stat.type.toLowerCase()] = stat._count.id;
      return acc;
    }, {});

    res.json({
      overdueCount,
      thisWeekCount,
      thisMonthCount,
      completedCount,
      typeSummary
    });
  } catch (error) {
    console.error('Get deadline stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch deadline statistics',
      message: 'Internal server error'
    });
  }
});

module.exports = router;