const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all documents for user
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(type && { type })
    };

    const documents = await prisma.document.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Group documents by type for easier frontend handling
    const groupedDocuments = documents.reduce((acc, doc) => {
      if (!acc[doc.type]) {
        acc[doc.type] = [];
      }
      acc[doc.type].push(doc);
      return acc;
    }, {});

    res.json({ 
      documents,
      groupedDocuments 
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      error: 'Failed to fetch documents',
      message: 'Internal server error'
    });
  }
});

// Get single document
router.get('/:id', async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!document) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'Document not found or access denied'
      });
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      error: 'Failed to fetch document',
      message: 'Internal server error'
    });
  }
});

// Create document
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 200 }),
  body('type').isIn(['SOP', 'CV', 'RESUME', 'LOR', 'TRANSCRIPT', 'OTHER']),
  body('version').optional().trim().isLength({ min: 1, max: 20 }),
  body('fileUrl').optional().isURL(),
  body('content').optional().isLength({ max: 50000 })
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
      type,
      version = '1',
      fileUrl,
      content
    } = req.body;

    // Check if this is a new version of an existing document
    let finalVersion = version;
    if (version === 'auto') {
      const existingDocs = await prisma.document.findMany({
        where: {
          userId: req.user.id,
          type,
          name
        },
        orderBy: { createdAt: 'desc' }
      });

      if (existingDocs.length > 0) {
        const latestVersion = existingDocs[0].version;
        const versionNumber = parseInt(latestVersion.replace(/\D/g, '')) || 1;
        finalVersion = `v${versionNumber + 1}`;
      }
    }

    const document = await prisma.document.create({
      data: {
        name,
        type,
        version: finalVersion,
        fileUrl,
        content,
        userId: req.user.id
      }
    });

    res.status(201).json({
      message: 'Document created successfully',
      document
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({
      error: 'Failed to create document',
      message: 'Internal server error'
    });
  }
});

// Update document
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 200 }),
  body('type').optional().isIn(['SOP', 'CV', 'RESUME', 'LOR', 'TRANSCRIPT', 'OTHER']),
  body('version').optional().trim().isLength({ min: 1, max: 20 }),
  body('fileUrl').optional().isURL(),
  body('content').optional().isLength({ max: 50000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if document exists and belongs to user
    const existingDocument = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingDocument) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'Document not found or access denied'
      });
    }

    const {
      name,
      type,
      version,
      fileUrl,
      content
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (version !== undefined) updateData.version = version;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (content !== undefined) updateData.content = content;

    const document = await prisma.document.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({
      message: 'Document updated successfully',
      document
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      error: 'Failed to update document',
      message: 'Internal server error'
    });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    // Check if document exists and belongs to user
    const existingDocument = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingDocument) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'Document not found or access denied'
      });
    }

    await prisma.document.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      message: 'Internal server error'
    });
  }
});

// Get document statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await prisma.document.groupBy({
      by: ['type'],
      where: {
        userId: req.user.id
      },
      _count: {
        id: true
      }
    });

    const summary = stats.reduce((acc, stat) => {
      acc[stat.type] = stat._count.id;
      return acc;
    }, {});

    // Get total count
    const totalCount = await prisma.document.count({
      where: { userId: req.user.id }
    });

    res.json({
      summary,
      totalCount
    });
  } catch (error) {
    console.error('Get document stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch document statistics',
      message: 'Internal server error'
    });
  }
});

module.exports = router;