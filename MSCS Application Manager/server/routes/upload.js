const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept common document formats
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and RTF files are allowed.'), false);
    }
  }
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// Upload document file
router.post('/document', upload.single('file'), [
  body('name').trim().isLength({ min: 1, max: 200 }),
  body('type').isIn(['SOP', 'CV', 'RESUME', 'LOR', 'TRANSCRIPT', 'OTHER']),
  body('version').optional().trim().isLength({ min: 1, max: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please select a file to upload'
      });
    }

    const { name, type, version = '1' } = req.body;

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

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: `mscs-app-manager/${req.user.id}/documents`,
          public_id: `${type.toLowerCase()}_${name.replace(/\s+/g, '_')}_${finalVersion}_${Date.now()}`,
          tags: [req.user.id, type.toLowerCase(), 'document']
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    // Save document metadata to database
    const document = await prisma.document.create({
      data: {
        name,
        type,
        version: finalVersion,
        fileUrl: uploadResult.secure_url,
        userId: req.user.id
      }
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document,
      fileInfo: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        size: uploadResult.bytes,
        format: uploadResult.format
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: error.message
      });
    }

    if (error.message.includes('File too large')) {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
    }

    res.status(500).json({
      error: 'Upload failed',
      message: 'Failed to upload document'
    });
  }
});

// Update document file (replace existing)
router.put('/document/:id', upload.single('file'), [
  body('name').optional().trim().isLength({ min: 1, max: 200 }),
  body('type').optional().isIn(['SOP', 'CV', 'RESUME', 'LOR', 'TRANSCRIPT', 'OTHER']),
  body('version').optional().trim().isLength({ min: 1, max: 20 })
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

    const updateData = {};
    const { name, type, version } = req.body;

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (version !== undefined) updateData.version = version;

    // If new file is provided, upload it
    if (req.file) {
      // Delete old file from Cloudinary if it exists
      if (existingDocument.fileUrl) {
        try {
          const publicId = existingDocument.fileUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        } catch (deleteError) {
          console.warn('Failed to delete old file from Cloudinary:', deleteError);
        }
      }

      // Upload new file
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            folder: `mscs-app-manager/${req.user.id}/documents`,
            public_id: `${(type || existingDocument.type).toLowerCase()}_${(name || existingDocument.name).replace(/\s+/g, '_')}_${version || existingDocument.version}_${Date.now()}`,
            tags: [req.user.id, (type || existingDocument.type).toLowerCase(), 'document']
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      updateData.fileUrl = uploadResult.secure_url;
    }

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
      error: 'Update failed',
      message: 'Failed to update document'
    });
  }
});

// Delete document file
router.delete('/document/:id', async (req, res) => {
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

    // Delete file from Cloudinary if it exists
    if (existingDocument.fileUrl) {
      try {
        const publicId = existingDocument.fileUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      } catch (deleteError) {
        console.warn('Failed to delete file from Cloudinary:', deleteError);
      }
    }

    // Delete document from database
    await prisma.document.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      error: 'Delete failed',
      message: 'Failed to delete document'
    });
  }
});

// Get upload statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await prisma.document.groupBy({
      by: ['type'],
      where: {
        userId: req.user.id,
        fileUrl: { not: null }
      },
      _count: {
        id: true
      }
    });

    const totalUploads = await prisma.document.count({
      where: {
        userId: req.user.id,
        fileUrl: { not: null }
      }
    });

    const summary = stats.reduce((acc, stat) => {
      acc[stat.type.toLowerCase()] = stat._count.id;
      return acc;
    }, {});

    res.json({
      summary,
      totalUploads
    });
  } catch (error) {
    console.error('Get upload stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch upload statistics',
      message: 'Internal server error'
    });
  }
});

module.exports = router;