import type { AIInsight } from '@shared/schema'

export function validateAIResponse(data: any): {
  insights: AIInsight[]
  value?: string
  effectiveDate?: string
  expiryDate?: string
  riskLevel: 'low' | 'medium' | 'high'
} {
  const insights: AIInsight[] = Array.isArray(data.insights)
    ? data.insights.filter(
        (insight: any) =>
          insight &&
          typeof insight === 'object' &&
          typeof insight.type === 'string' &&
          typeof insight.title === 'string' &&
          typeof insight.content === 'string'
      )
    : []

  return {
    insights,
    value: typeof data.value === 'string' ? data.value : undefined,
    effectiveDate:
      typeof data.effectiveDate === 'string' ? data.effectiveDate : undefined,
    expiryDate:
      typeof data.expiryDate === 'string' ? data.expiryDate : undefined,
    riskLevel: ['low', 'medium', 'high'].includes(data.riskLevel)
      ? data.riskLevel
      : 'low',
  }
}
