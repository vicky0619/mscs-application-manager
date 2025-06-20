const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all tasks for user
router.get('/', async (req, res) => {
  try {
    const { status, priority, universityId } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(universityId && { universityId })
    };

    const tasks = await prisma.task.findMany({
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
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Group tasks by status for Kanban board
    const kanbanTasks = tasks.reduce((acc, task) => {
      const statusKey = task.status.toLowerCase();
      if (!acc[statusKey]) {
        acc[statusKey] = [];
      }
      acc[statusKey].push(task);
      return acc;
    }, {});

    res.json({ 
      tasks,
      kanbanTasks 
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      error: 'Failed to fetch tasks',
      message: 'Internal server error'
    });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await prisma.task.findFirst({
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

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task not found or access denied'
      });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      error: 'Failed to fetch task',
      message: 'Internal server error'
    });
  }
});

// Create task
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('dueDate').optional().isISO8601(),
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
      description,
      status = 'PENDING',
      priority = 'MEDIUM',
      dueDate,
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

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
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
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      error: 'Failed to create task',
      message: 'Internal server error'
    });
  }
});

// Update task
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('dueDate').optional().isISO8601(),
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

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingTask) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task not found or access denied'
      });
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate,
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
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      updateData.status = status;
      // Set completion date when status changes to COMPLETED
      if (status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
        updateData.completedAt = new Date();
      } else if (status !== 'COMPLETED') {
        updateData.completedAt = null;
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (universityId !== undefined) updateData.universityId = universityId;

    const task = await prisma.task.update({
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
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      error: 'Failed to update task',
      message: 'Internal server error'
    });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingTask) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task not found or access denied'
      });
    }

    await prisma.task.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      error: 'Failed to delete task',
      message: 'Internal server error'
    });
  }
});

// Get task statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const statusStats = await prisma.task.groupBy({
      by: ['status'],
      where: {
        userId: req.user.id
      },
      _count: {
        id: true
      }
    });

    const priorityStats = await prisma.task.groupBy({
      by: ['priority'],
      where: {
        userId: req.user.id
      },
      _count: {
        id: true
      }
    });

    // Get overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        userId: req.user.id,
        status: { not: 'COMPLETED' },
        dueDate: {
          lt: new Date()
        }
      }
    });

    // Get upcoming tasks (next 7 days)
    const upcomingTasks = await prisma.task.count({
      where: {
        userId: req.user.id,
        status: { not: 'COMPLETED' },
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const statusSummary = statusStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.id;
      return acc;
    }, {});

    const prioritySummary = priorityStats.reduce((acc, stat) => {
      acc[stat.priority.toLowerCase()] = stat._count.id;
      return acc;
    }, {});

    res.json({
      statusSummary,
      prioritySummary,
      overdueTasks,
      upcomingTasks
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch task statistics',
      message: 'Internal server error'
    });
  }
});

module.exports = router;