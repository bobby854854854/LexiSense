import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Common validation schemas
export const contractAnalysisSchema = z.object({
  text: z
    .string()
    .min(1, 'Contract text is required')
    .max(50000, 'Contract text too long'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  counterparty: z
    .string()
    .min(1, 'Counterparty is required')
    .max(200, 'Counterparty name too long'),
  contractType: z.string().optional(),
})

export const contractDraftSchema = z.object({
  contractType: z.string().min(1, 'Contract type is required'),
  party1: z.string().min(1, 'Party 1 is required'),
  party2: z.string().min(1, 'Party 2 is required'),
  value: z.string().optional(),
  terms: z.string().optional(),
})

// Sanitization utilities
export function sanitizeString(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeString(value) as T[keyof T]
    } else {
      sanitized[key as keyof T] = value
    }
  }
  return sanitized
}

// Validation middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      const validation = schema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        })
      }
      req.validatedBody = validation.data
      next()
    } catch (error) {
      res.status(500).json({ error: 'Validation error' })
    }
  }
}
