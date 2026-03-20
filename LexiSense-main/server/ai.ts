import OpenAI from 'openai'
import { z } from 'zod' // Add if not imported (from your deps)
import type { AIAnalysisResult } from '@shared/types' // From shared/types

const { OPENAI_API_KEY } = process.env

if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. AI features disabled.')
}

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null

// Zod schema for validation (ensures structure, catches hallucinations)
const AnalysisSchema = z.object({
  summary: z.string(),
  parties: z.array(z.object({ name: z.string(), role: z.string() })),
  dates: z.array(
    z.object({
      name: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
  ),
  risks: z.array(
    z.object({
      level: z.enum(['high', 'medium', 'low']),
      description: z.string(),
    })
  ),
})

const ANALYSIS_SYSTEM_PROMPT = `You are an expert legal AI assistant. Analyze the contract text and return structured JSON.

Format:
{
  "summary": "Concise one-paragraph summary.",
  "parties": [{ "name": "Party Name", "role": "e.g., Provider" }],
  "dates": [{ "name": "Effective Date", "date": "YYYY-MM-DD" }],
  "risks": [{ "level": "high|medium|low", "description": "Specific risk." }]
}

Empty if not found. Valid JSON only.

Few-shot examples:
Input: "This Agreement between Acme Corp (Provider) and Client LLC, effective 2025-01-01..."
Output: {"summary": "Service agreement...", "parties": [{"name": "Acme Corp", "role": "Provider"}, {"name": "Client LLC", "role": "Client"}], "dates": [{"name": "Effective Date", "date": "2025-01-01"}], "risks": [{"level": "medium", "description": "Unlimited liability clause."}]}` // Added few-shot for accuracy.

export async function analyzeContract(
  contractText: string
): Promise<AIAnalysisResult> {
  if (!openai) throw new Error('AI not configured (missing OPENAI_API_KEY).')

  // FIX: Chunk long text (e.g., >32k tokens ~100k chars) to avoid limits.
  const chunks = contractText.match(/.{1,80000}/g) || [contractText] // Split ~80k chars/chunk.
  const analyses: AIAnalysisResult[] = []

  for (const chunk of chunks) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // Or 'gpt-4o-2026' if newer by Jan 2026.
        messages: [
          { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
          { role: 'user', content: chunk },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Lowered for determinism.
      })

      const resultText = completion.choices[0]?.message?.content
      if (!resultText) throw new Error('Empty AI response.')

      // FIX: Parse + validate with Zod.
      const parsed = JSON.parse(resultText)
      const validated = AnalysisSchema.safeParse(parsed)
      if (!validated.success)
        throw new Error(`Invalid AI JSON: ${validated.error.message}`)
      analyses.push(validated.data)
    } catch (error) {
      console.error('AI analysis error:', error)
      if (error instanceof OpenAI.APIError)
        throw new Error(`OpenAI Error: ${error.status} ${error.message}`)
      throw new Error(`Analysis failed: ${(error as Error).message}`)
    }
  }

  // Merge chunks (simple union; refine with Amii ML for overlaps).
  return analyses.reduce(
    (acc, curr) => ({
      summary: acc.summary || curr.summary, // Take first non-empty.
      parties: [...new Set([...acc.parties, ...curr.parties])], // Dedupe.
      dates: [...new Set([...acc.dates, ...curr.dates])],
      risks: [...new Set([...acc.risks, ...curr.risks])],
    }),
    { summary: '', parties: [], dates: [], risks: [] } as AIAnalysisResult
  )
}

const CHAT_SYSTEM_PROMPT = `Expert legal AI. Answer based ONLY on contract text. If not in text, say "Not found in contract." Concise.` // Unchanged, but good.

export async function getChatResponse(
  contractText: string,
  question: string
): Promise<string> {
  if (!openai) throw new Error('AI not configured.')

  // FIX: Similar chunking if needed, but for chat, summarize context if long.
  if (contractText.length > 100000) {
    contractText = contractText.slice(0, 100000) + '... [truncated]' // Or use AI to summarize.
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Contract: ---${contractText}---\nQuestion: ${question}`,
        },
      ],
      temperature: 0.2, // Lowered slightly.
    })
    return completion.choices[0]?.message?.content || 'No response.'
  } catch (error) {
    console.error('AI chat error:', error)
    throw new Error(`Chat failed: ${(error as Error).message}`)
  }
}
