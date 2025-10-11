import type { Contract, AIInsight } from '@shared/schema'
import { handleAPIResponse, logError } from './errorHandler'

export async function getContracts(): Promise<Contract[]> {
  try {
    const response = await fetch('/api/contracts')
    return handleAPIResponse<Contract[]>(response)
  } catch (error) {
    logError(error as Error, 'getContracts')
    throw error
  }
}

export async function getContract(id: string): Promise<Contract> {
  try {
    const response = await fetch(`/api/contracts/${id}`)
    return handleAPIResponse<Contract>(response)
  } catch (error) {
    logError(error as Error, `getContract(${id})`)
    throw error
  }
}

export async function analyzeContract(data: {
  text: string
  title: string
  counterparty: string
  contractType: string
}): Promise<Contract> {
  try {
    // Validate input data
    if (
      !data.text?.trim() ||
      !data.title?.trim() ||
      !data.counterparty?.trim()
    ) {
      throw new Error(
        'Missing required fields: text, title, and counterparty are required'
      )
    }

    if (data.text.length > 50000) {
      throw new Error('Contract text is too long (max 50,000 characters)')
    }

    const response = await fetch('/api/contracts/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    return handleAPIResponse<Contract>(response)
  } catch (error) {
    logError(error as Error, 'analyzeContract')
    throw error
  }
}

export async function draftContract(data: {
  contractType: string
  party1: string
  party2: string
  value: string
  terms: string
}): Promise<{ contract: string }> {
  try {
    const response = await fetch('/api/contracts/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleAPIResponse<{ contract: string }>(response)
  } catch (error) {
    logError(error as Error, 'draftContract')
    throw error
  }
}

export async function deleteContract(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/contracts/${id}`, {
      method: 'DELETE',
    })
    await handleAPIResponse<{ success: boolean }>(response)
  } catch (error) {
    logError(error as Error, `deleteContract(${id})`)
    throw error
  }
}
