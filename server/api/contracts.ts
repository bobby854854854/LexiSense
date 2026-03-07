import { Router } from 'express'
import multer from 'multer'
import { body, param, validationResult } from 'express-validator'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db'
import { contracts } from '../db/schema'
import { uploadFileToStorage } from '../services/storage'
import { analyzeContract, getChatResponse } from '../services/ai'
import type { Contract } from '@shared/types'

const router = Router()

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['application/pdf', 'text/plain']
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only PDF and TXT files are allowed.'))
    }
  },
})

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next()
  }
  res.status(401).json({ message: 'Unauthorized' })
}

// GET /api/contracts - List all contracts for user's organization
router.get('/', isAuthenticated, async (req, res, next) => {
  try {
    const user = req.user as any

    const userContracts = await db.query.contracts.findMany({
      where: eq(contracts.organizationId, user.organizationId),
      orderBy: [desc(contracts.createdAt)],
      with: {
        uploader: {
          columns: {
            id: true,
            email: true,
          },
        },
      },
    })

    res.json(userContracts)
  } catch (error) {
    console.error('Error fetching contracts:', error)
    next(error)
  }
})

// GET /api/contracts/:id - Get single contract by ID
router.get(
  '/:id',
  isAuthenticated,
  param('id').isUUID(),
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const user = req.user as any
      const { id } = req.params

      const contract = await db.query.contracts.findFirst({
        where: and(
          eq(contracts.id, id),
          eq(contracts.organizationId, user.organizationId)
        ),
        with: {
          uploader: {
            columns: {
              id: true,
              email: true,
            },
          },
        },
      })

      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' })
      }

      res.json(contract)
    } catch (error) {
      console.error('Error fetching contract:', error)
      next(error)
    }
  }
)

// POST /api/contracts - Upload and analyze a new contract
router.post(
  '/',
  isAuthenticated,
  upload.single('file'),
  async (req, res, next) => {
    try {
      const user = req.user as any
      const file = req.file

      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' })
      }

      // Extract text from file
      const extractedText = await extractTextFromFile(
        file.buffer,
        file.mimetype
      )

      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({
          message:
            'Could not extract text from file. The file may be empty or corrupted.',
        })
      }

      // Upload to storage
      const storageKey = await uploadFileToStorage(
        file.buffer,
        file.originalname,
        user.organizationId
      )

      // Analyze with AI (run in background, don't block response)
      let aiAnalysis = null
      try {
        aiAnalysis = await analyzeContract(extractedText)
      } catch (aiError) {
        console.error('AI analysis failed:', aiError)
        // Continue without AI analysis
      }

      // Save to database
      const [newContract] = await db
        .insert(contracts)
        .values({
          organizationId: user.organizationId,
          uploadedBy: user.id,
          originalName: file.originalname,
          storageKey,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          extractedText,
          aiAnalysis,
        })
        .returning()

      res.status(201).json(newContract)
    } catch (error) {
      console.error('Error uploading contract:', error)
      next(error)
    }
  }
)

// POST /api/contracts/:id/chat - Ask questions about a contract
router.post(
  '/:id/chat',
  isAuthenticated,
  param('id').isUUID(),
  body('question').isString().isLength({ min: 1, max: 1000 }),
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const user = req.user as any
      const { id } = req.params
      const { question } = req.body

      // Fetch contract
      const contract = await db.query.contracts.findFirst({
        where: and(
          eq(contracts.id, id),
          eq(contracts.organizationId, user.organizationId)
        ),
      })

      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' })
      }

      if (!contract.extractedText) {
        return res.status(400).json({
          message: 'Contract text not available for analysis',
        })
      }

      // Get AI response
      const answer = await getChatResponse(contract.extractedText, question)

      res.json({ answer })
    } catch (error) {
      console.error('Error during chat:', error)
      next(error)
    }
  }
)

// DELETE /api/contracts/:id - Delete a contract
router.delete(
  '/:id',
  isAuthenticated,
  param('id').isUUID(),
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const user = req.user as any
      const { id } = req.params

      // Check if user is admin or the uploader
      const contract = await db.query.contracts.findFirst({
        where: and(
          eq(contracts.id, id),
          eq(contracts.organizationId, user.organizationId)
        ),
      })

      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' })
      }

      if (user.role !== 'admin' && contract.uploadedBy !== user.id) {
        return res.status(403).json({
          message: 'Only admins or the uploader can delete this contract',
        })
      }

      // Delete from database
      await db.delete(contracts).where(eq(contracts.id, id))

      // TODO: Delete from S3 storage when implemented
      // await deleteFileFromStorage(contract.storageKey)

      res.json({ message: 'Contract deleted successfully' })
    } catch (error) {
      console.error('Error deleting contract:', error)
      next(error)
    }
  }
)

export { router as contractsRouter }
