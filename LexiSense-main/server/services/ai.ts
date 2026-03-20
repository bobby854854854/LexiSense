import OpenAI from 'openai'
import { logger } from '../utils/logger.js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function analyzeContract(text: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a legal contract analyzer. Analyze the contract and return a JSON object with summary, risks, parties, and dates.',
        },
        {
          role: 'user',
          content: `Analyze this contract: ${text.substring(0, 4000)}`,
        },
      ],
      max_tokens: 1000,
    })

    const analysis = response.choices[0]?.message?.content
    return analysis ? JSON.parse(analysis) : null
  } catch (error) {
    logger.error('AI analysis failed:', error)
    return null
  }
}

export async function getChatResponse(contractText: string, question: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a legal assistant. Answer questions about the provided contract.',
        },
        {
          role: 'user',
          content: `Contract: ${contractText.substring(0, 3000)}\n\nQuestion: ${question}`,
        },
      ],
      max_tokens: 500,
    })

    return (
      response.choices[0]?.message?.content || 'Unable to generate response'
    )
  } catch (error) {
    logger.error('Chat response failed:', error)
    throw new Error('Unable to process question')
  }
}
