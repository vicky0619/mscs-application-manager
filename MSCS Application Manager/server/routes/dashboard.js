const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get university statistics
    const totalUniversities = await prisma.university.count({
      where: { userId }
    });

    const universityStatusStats = await prisma.university.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true }
    });

    const universityCategoryStats = await prisma.university.groupBy({
      by: ['category'],
      where: { userId },
      _count: { id: true }
    });

    // Get deadline statistics
    const upcomingDeadlines = await prisma.deadline.count({
      where: {
        userId,
        completed: false,
        date: {
          gte: now,
          lte: oneMonth
        }
      }
    });

    const deadlinesThisWeek = await prisma.deadline.count({
      where: {
        userId,
        completed: false,
        date: {
          gte: now,
          lte: oneWeek
        }
      }
    });

    const deadlinesThisMonth = await prisma.deadline.count({
      where: {
        userId,
        completed: false,
        date: {
          gte: now,
          lte: oneMonth
        }
      }
    });

    // Get task statistics
    const totalTasks = await prisma.task.count({
      where: { userId }
    });

    const pendingTasks = await prisma.task.count({
      where: {
        userId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    const overdueTasks = await prisma.task.count({
      where: {
        userId,
        status: { not: 'COMPLETED' },
        dueDate: { lt: now }
      }
    });

    const highPriorityTasks = await prisma.task.count({
      where: {
        userId,
        status: { not: 'COMPLETED' },
        priority: { in: ['HIGH', 'URGENT'] }
      }
    });

    // Get document statistics
    const totalDocuments = await prisma.document.count({
      where: { userId }
    });

    const documentTypeStats = await prisma.document.groupBy({
      by: ['type'],
      where: { userId },
      _count: { id: true }
    });

    // Format statistics
    const universityStatusSummary = universityStatusStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.id;
      return acc;
    }, {});

    const universityCategorySummary = universityCategoryStats.reduce((acc, stat) => {
      acc[stat.category.toLowerCase()] = stat._count.id;
      return acc;
    }, {});

    const documentTypeSummary = documentTypeStats.reduce((acc, stat) => {
      acc[stat.type.toLowerCase()] = stat._count.id;
      return acc;
    }, {});

    res.json({
      universities: {
        total: totalUniversities,
        byStatus: universityStatusSummary,
        byCategory: universityCategorySummary
      },
      deadlines: {
        upcoming: upcomingDeadlines,
        thisWeek: deadlinesThisWeek,
        thisMonth: deadlinesThisMonth
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
        highPriority: highPriorityTasks
      },
      documents: {
        total: totalDocuments,
        byType: documentTypeSummary
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      message: 'Internal server error'
    });
  }
});

// Get recent activity
router.get('/activity', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    // Get recent universities
    const recentUniversities = await prisma.university.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        status: true,
        category: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    // Get recent documents
    const recentDocuments = await prisma.document.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        version: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    // Get recent tasks
    const recentTasks = await prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        university: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    // Get recent deadlines
    const recentDeadlines = await prisma.deadline.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        type: true,
        date: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
        university: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    // Combine and sort all activities
    const activities = [];

    recentUniversities.forEach(uni => {
      activities.push({
        id: `uni-${uni.id}`,
        type: 'university',
        action: uni.createdAt.getTime() === uni.updatedAt.getTime() ? 'created' : 'updated',
        title: `${uni.createdAt.getTime() === uni.updatedAt.getTime() ? 'Added' : 'Updated'} ${uni.name}`,
        description: `${uni.category} school`,
        timestamp: uni.updatedAt,
        data: uni
      });
    });

    recentDocuments.forEach(doc => {
      activities.push({
        id: `doc-${doc.id}`,
        type: 'document',
        action: doc.createdAt.getTime() === doc.updatedAt.getTime() ? 'created' : 'updated',
        title: `${doc.createdAt.getTime() === doc.updatedAt.getTime() ? 'Uploaded' : 'Updated'} ${doc.name}`,
        description: `${doc.type} ${doc.version}`,
        timestamp: doc.updatedAt,
        data: doc
      });
    });

    recentTasks.forEach(task => {
      let action = 'updated';
      let title = `Updated ${task.title}`;
      
      if (task.completedAt && task.status === 'COMPLETED') {
        action = 'completed';
        title = `Completed ${task.title}`;
      } else if (task.createdAt.getTime() === task.updatedAt.getTime()) {
        action = 'created';
        title = `Added ${task.title}`;
      }

      activities.push({
        id: `task-${task.id}`,
        type: 'task',
        action,
        title,
        description: task.university ? `Related to ${task.university.name}` : 'General task',
        timestamp: task.updatedAt,
        data: task
      });
    });

    recentDeadlines.forEach(deadline => {
      activities.push({
        id: `deadline-${deadline.id}`,
        type: 'deadline',
        action: deadline.completed ? 'completed' : (deadline.createdAt.getTime() === deadline.updatedAt.getTime() ? 'created' : 'updated'),
        title: `${deadline.completed ? 'Completed' : (deadline.createdAt.getTime() === deadline.updatedAt.getTime() ? 'Added' : 'Updated')} ${deadline.title}`,
        description: deadline.university ? `${deadline.university.name} - ${deadline.type}` : deadline.type,
        timestamp: deadline.updatedAt,
        data: deadline
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => b.timestamp - a.timestamp);
    const limitedActivities = activities.slice(0, limit);

    res.json({
      activities: limitedActivities,
      totalCount: activities.length
    });
  } catch (error) {
    console.error('Get dashboard activity error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard activity',
      message: 'Internal server error'
    });
  }
});

// Get upcoming deadlines for dashboard
router.get('/upcoming-deadlines', async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcomingDeadlines = await prisma.deadline.findMany({
      where: {
        userId,
        completed: false,
        date: {
          gte: now,
          lte: thirtyDaysFromNow
        }
      },
      include: {
        university: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      },
      orderBy: { date: 'asc' },
      take: 5
    });

    // Add days until deadline
    const deadlinesWithDays = upcomingDeadlines.map(deadline => {
      const daysUntil = Math.ceil((deadline.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...deadline,
        daysUntil
      };
    });

    res.json({
      upcomingDeadlines: deadlinesWithDays
    });
  } catch (error) {
    console.error('Get upcoming deadlines error:', error);
    res.status(500).json({
      error: 'Failed to fetch upcoming deadlines',
      message: 'Internal server error'
    });
  }
});

module.exports = router;