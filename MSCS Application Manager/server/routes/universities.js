const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all universities for user
router.get('/', async (req, res) => {
  try {
    const { status, category } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(status && { status }),
      ...(category && { category })
    };

    const universities = await prisma.university.findMany({
      where,
      include: {
        requirements: true,
        tasks: {
          where: { status: { not: 'COMPLETED' } }
        },
        deadlines: {
          where: { completed: false }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ universities });
  } catch (error) {
    console.error('Get universities error:', error);
    res.status(500).json({
      error: 'Failed to fetch universities',
      message: 'Internal server error'
    });
  }
});

// Get single university
router.get('/:id', async (req, res) => {
  try {
    const university = await prisma.university.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        requirements: true,
        tasks: true,
        deadlines: true
      }
    });

    if (!university) {
      return res.status(404).json({
        error: 'University not found',
        message: 'University not found or access denied'
      });
    }

    res.json({ university });
  } catch (error) {
    console.error('Get university error:', error);
    res.status(500).json({
      error: 'Failed to fetch university',
      message: 'Internal server error'
    });
  }
});

// Create university
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 200 }),
  body('url').optional().isURL(),
  body('status').optional().isIn(['RESEARCHING', 'PLANNING_TO_APPLY', 'APPLIED', 'ADMITTED', 'REJECTED', 'WAITLISTED']),
  body('category').isIn(['REACH', 'TARGET', 'SAFETY']),
  body('deadline').optional().isISO8601(),
  body('lorDeadline').optional().isISO8601(),
  body('notes').optional().isLength({ max: 1000 })
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
      name,
      url,
      status = 'RESEARCHING',
      category,
      deadline,
      lorDeadline,
      notes,
      requirements
    } = req.body;

    const university = await prisma.university.create({
      data: {
        name,
        url,
        status,
        category,
        deadline: deadline ? new Date(deadline) : null,
        lorDeadline: lorDeadline ? new Date(lorDeadline) : null,
        notes,
        userId: req.user.id,
        ...(requirements && {
          requirements: {
            create: requirements
          }
        })
      },
      include: {
        requirements: true
      }
    });

    res.status(201).json({
      message: 'University created successfully',
      university
    });
  } catch (error) {
    console.error('Create university error:', error);
    res.status(500).json({
      error: 'Failed to create university',
      message: 'Internal server error'
    });
  }
});

// Update university
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 200 }),
  body('url').optional().isURL(),
  body('status').optional().isIn(['RESEARCHING', 'PLANNING_TO_APPLY', 'APPLIED', 'ADMITTED', 'REJECTED', 'WAITLISTED']),
  body('category').optional().isIn(['REACH', 'TARGET', 'SAFETY']),
  body('deadline').optional().isISO8601(),
  body('lorDeadline').optional().isISO8601(),
  body('notes').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if university exists and belongs to user
    const existingUniversity = await prisma.university.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingUniversity) {
      return res.status(404).json({
        error: 'University not found',
        message: 'University not found or access denied'
      });
    }

    const {
      name,
      url,
      status,
      category,
      deadline,
      lorDeadline,
      notes,
      requirements
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (lorDeadline !== undefined) updateData.lorDeadline = lorDeadline ? new Date(lorDeadline) : null;
    if (notes !== undefined) updateData.notes = notes;

    // Handle requirements update
    if (requirements) {
      updateData.requirements = {
        upsert: {
          create: requirements,
          update: requirements
        }
      };
    }

    const university = await prisma.university.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        requirements: true
      }
    });

    res.json({
      message: 'University updated successfully',
      university
    });
  } catch (error) {
    console.error('Update university error:', error);
    res.status(500).json({
      error: 'Failed to update university',
      message: 'Internal server error'
    });
  }
});

// Delete university
router.delete('/:id', async (req, res) => {
  try {
    // Check if university exists and belongs to user
    const existingUniversity = await prisma.university.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingUniversity) {
      return res.status(404).json({
        error: 'University not found',
        message: 'University not found or access denied'
      });
    }

    await prisma.university.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'University deleted successfully'
    });
  } catch (error) {
    console.error('Delete university error:', error);
    res.status(500).json({
      error: 'Failed to delete university',
      message: 'Internal server error'
    });
  }
});

module.exports = router;