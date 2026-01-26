import OpenAI from 'openai'
import { db } from './db'
import { contracts } from './db/schema'
import { eq } from 'drizzle-orm'
import type { AnalysisResults } from '@shared/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const ANALYSIS_PROMPT = `
  Analyze the following contract text and provide a structured JSON output.
  The JSON object should conform to the following structure:
  {
    "summary": "A concise, one-paragraph summary of the contract's purpose and scope.",
    "parties": [
      { "name": "Full legal name of a party", "role": "Their role, e.g., 'Landlord', 'Service Provider'" }
    ],
    "keyDates": {
      "effectiveDate": "YYYY-MM-DD or empty string",
      "terminationDate": "YYYY-MM-DD or empty string",
      "renewalTerms": "Description of renewal terms or empty string"
    },
    "highLevelRisks": [
      "A specific potential risk identified in the contract."
    ]
  }
  Ensure all dates are in YYYY-MM-DD format. If a date is not present, use empty string.
  If no specific risks are identified, provide an empty array.
  Do not include any text or formatting outside of the JSON object itself.
`

/**
 * Analyzes contract text using the OpenAI API and updates the database record.
 * @param contractId The UUID of the contract to analyze.
 * @param textContent The raw text content of the contract.
 */
export async function analyzeContract(
  contractId: string,
  textContent: string,
): Promise<void> {
  console.log(`[AI] Starting analysis for contract ID: ${contractId}`)
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: ANALYSIS_PROMPT },
        { role: 'user', content: textContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const resultJson = response.choices[0].message?.content
    if (!resultJson) {
      throw new Error('OpenAI returned an empty response.')
    }

    const analysisResults: AnalysisResults = JSON.parse(resultJson)

    // Update the contract in the database with the results
    await db
      .update(contracts)
      .set({
        aiInsights: analysisResults,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, contractId))

    console.log(`[AI] Successfully analyzed and updated contract ID: ${contractId}`)
  } catch (error) {
    console.error(`[AI] Analysis failed for contract ID: ${contractId}`, error)
    // Update the contract to reflect the failed status
    await db
      .update(contracts)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, contractId))
  }
}