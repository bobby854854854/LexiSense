import type { Express } from 'express'
import { createServer, type Server } from 'http'
import { storage } from './storage.ts'
import { insertContractSchema, type AIInsight } from '@shared/schema'
import OpenAI from 'openai'
import {
  contractAnalysisSchema,
  contractDraftSchema,
  validateRequest,
  sanitizeObject,
} from './validation.ts'
import { validateAIResponse } from './aiResponseValidator.ts'
import { getContractAnalytics } from './analytics.ts'

// Provide a safe dev fallback when OPENAI_API_KEY isn't provided so the
// dev server can start and AI endpoints return a harmless default.
let openai: any
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
} else {
  // Minimal mock matching the portion of the OpenAI client used here.
  openai = {
    chat: {
      completions: {
        create: async (_opts: any) => {
          return { choices: [{ message: { content: JSON.stringify({}) } }] }
        },
      },
    },
  }
}

async function analyzeContractWithAI(
  contractText: string,
  title: string,
  counterparty: string
): Promise<{
  insights: AIInsight[]
  extractedData: {
    value?: string
    effectiveDate?: string
    expiryDate?: string
    riskLevel: 'low' | 'medium' | 'high'
  }
}> {
  try {
    const prompt = `You are an AI contract analyst. Analyze the following contract and extract key information.

Contract Title: ${title}
Counterparty: ${counterparty}

Contract Text:
${contractText.substring(0, 8000)}

Please provide:
1. Key terms and clauses
2. Obligations for both parties
3. Potential risks or non-standard clauses
4. Opportunities for negotiation
5. Estimated contract value (if mentioned)
6. Effective date (if mentioned)
7. Expiry/termination date (if mentioned)
8. Overall risk assessment (low/medium/high)

Format your response as JSON with this structure:
{
  "insights": [
    {"type": "key-term", "title": "...", "content": "..."},
    {"type": "obligation", "title": "...", "content": "..."},
    {"type": "risk", "title": "...", "content": "...", "severity": "low|medium|high"},
    {"type": "opportunity", "title": "...", "content": "..."}
  ],
  "value": "estimated contract value or null",
  "effectiveDate": "date or null",
  "expiryDate": "date or null",
  "riskLevel": "low|medium|high"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert contract analyst. Respond only with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = completion.choices[0].message.content
    let parsedContent = {
      insights: [],
      value: null,
      effectiveDate: null,
      expiryDate: null,
      riskLevel: 'low',
    }

    if (content && typeof content === 'string' && content.trim().length > 0) {
      try {
        const trimmedContent = content.trim()
        if (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) {
          const parsed = JSON.parse(trimmedContent)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            parsedContent = parsed
          }
        }
      } catch (error) {
        console.error('JSON parsing error: - routes.ts:102', error)
      }
    }

    const validatedResult = validateAIResponse(parsedContent)

    return {
      insights: validatedResult.insights,
      extractedData: {
        value: validatedResult.value || undefined,
        effectiveDate: validatedResult.effectiveDate || undefined,
        expiryDate: validatedResult.expiryDate || undefined,
        riskLevel: validatedResult.riskLevel,
      },
    }
  } catch (error) {
    console.error('AI analysis error: - routes.ts:118', error)
    return {
      insights: [
        {
          type: 'risk',
          title: 'AI Analysis Unavailable',
          content: 'Unable to perform AI analysis at this time.',
          severity: 'low',
        },
      ],
      extractedData: {
        riskLevel: 'low',
      },
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get('/api/contracts', async (req, res) => {
    try {
      const contracts = await storage.getAllContracts()
      res.json(contracts)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch contracts' })
    }
  })

  app.get('/api/contracts/:id', async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id)
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' })
      }
      res.json(contract)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch contract' })
    }
  })

  app.post('/api/contracts', async (req, res) => {
    try {
      const data = insertContractSchema.parse(req.body)
      const contract = await storage.createContract(data)
      res.json(contract)
    } catch (error) {
      res.status(400).json({ error: 'Invalid contract data' })
    }
  })

  app.post(
    '/api/contracts/analyze',
    validateRequest(contractAnalysisSchema),
    async (req: any, res) => {
      try {
        const sanitizedData = sanitizeObject(req.validatedBody)
        const { text, title, counterparty, contractType } = sanitizedData

        const analysis = await analyzeContractWithAI(text, title, counterparty)

        const contract = await storage.createContract({
          title,
          counterparty,
          contractType: contractType || 'Other',
          status: 'active',
          value: analysis.extractedData.value || '$0',
          effectiveDate:
            analysis.extractedData.effectiveDate ||
            new Date().toISOString().split('T')[0],
          expiryDate: analysis.extractedData.expiryDate || undefined,
          riskLevel: analysis.extractedData.riskLevel,
          originalText: text,
          aiInsights: analysis.insights as any,
        })

        res.json(contract)
      } catch (error) {
        console.error('Contract analysis error: - routes.ts:189', error)
        res.status(500).json({ error: 'Failed to analyze contract' })
      }
    }
  )

  app.patch('/api/contracts/:id', async (req, res) => {
    try {
      const contract = await storage.updateContract(req.params.id, req.body)
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' })
      }
      res.json(contract)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update contract' })
    }
  })

  app.delete('/api/contracts/:id', async (req, res) => {
    try {
      const success = await storage.deleteContract(req.params.id)
      if (!success) {
        return res.status(404).json({ error: 'Contract not found' })
      }
      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete contract' })
    }
  })

  app.get('/api/analytics', async (req, res) => {
    try {
      const analytics = await getContractAnalytics()
      res.json(analytics)
    } catch (error) {
      console.error('Analytics error: - routes.ts:223', error)
      res.status(500).json({ error: 'Failed to fetch analytics' })
    }
  })

  app.post(
    '/api/contracts/draft',
    validateRequest(contractDraftSchema),
    async (req: any, res) => {
      try {
        const sanitizedData = sanitizeObject(req.validatedBody)
        const { contractType, party1, party2, value, terms } = sanitizedData

        const prompt = `Generate a professional ${contractType} contract between ${party1} and ${party2}.

Key Requirements:
- Contract value: ${value || 'To be determined'}
- Terms: ${terms || 'Standard terms'}

Create a complete, legally-sound contract with appropriate sections including:
- Parties
- Services/Scope
- Compensation
- Term and Termination
- Confidentiality
- Governing Law

Make it professional and ready for review.`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert contract lawyer. Generate professional, legally-sound contracts.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 2000,
        })

        const generatedContract = completion.choices[0].message.content
        res.json({ contract: generatedContract })
      } catch (error) {
        console.error('Contract drafting error: - routes.ts:265', error)
        res.status(500).json({ error: 'Failed to generate contract' })
      }
    }
  )

  const httpServer = createServer(app)

  return httpServer
}
