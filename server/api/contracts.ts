import { Router } from 'express'
import multer from 'multer'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { contracts } from '../db/schema'
import { isAuthenticated } from '../auth'
import { analyzeContract } from '../ai'
import type { Contract } from '@shared/types'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
})

// GET /api/contracts
router.get('/', isAuthenticated, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' })
  }
  try {
    const userContracts = await db.query.contracts.findMany({
      where: eq(contracts.userId, req.user.id),
      orderBy: (contracts, { desc }) => [desc(contracts.createdAt)],
    })
    res.json(userContracts)
  } catch (error) {
    console.error('Failed to fetch contracts:', error)
    res.status(500).json({ message: 'Failed to retrieve contracts.' })
  }
})

// GET /api/contracts/:id
router.get('/:id', isAuthenticated, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' })
  }
  const { id } = req.params
  try {
    const contract = await db.query.contracts.findFirst({
      where: eq(contracts.id, id),
    })

    if (!contract || contract.userId !== req.user.id) {
      return res.status(404).json({ message: 'Contract not found.' })
    }

    res.json(contract)
  } catch (error) {
    console.error(`Failed to fetch contract ${id}:`, error)
    res.status(500).json({ message: 'Failed to retrieve contract details.' })
  }
})

// POST /api/contracts/upload
router.post(
  '/upload',
  isAuthenticated,
  upload.single('contractFile'),
  async (req, res) => {
    if (!req.file || !req.user) {
      return res.status(400).json({ message: 'Invalid request.' })
    }

    let insertedContract: Contract | undefined

    try {
      const textContent = req.file.buffer.toString('utf-8')

      const [newContract] = await db
        .insert(contracts)
        .values({
          title: req.file.originalname,
          counterparty: 'To be determined',
          contractType: 'General',
          status: 'processing',
          originalText: textContent,
          userId: req.user.id,
        })
        .returning()
      insertedContract = newContract

      res.status(201).json(insertedContract)

      // Trigger AI analysis in the background
      if (newContract.id) {
        analyzeContract(newContract.id, textContent).catch(err =>
          console.error('Background analysis failed:', err)
        )
      }
    } catch (error) {
      console.error('File upload processing failed:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.'

      res.status(500).json({ message: `Upload failed: ${errorMessage}` })
    }
  }
)

export default router