import type { Contract } from '@shared/types'

const API_BASE = '/api'

export async function getContracts(): Promise<Contract[]> {
  const response = await fetch(`${API_BASE}/contracts`)
  if (!response.ok) {
    throw new Error('Failed to fetch contracts')
  }
  return response.json()
}

export async function getContract(id: string): Promise<Contract> {
  const response = await fetch(`${API_BASE}/contracts/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch contract')
  }
  return response.json()
}

export async function uploadContract(file: File): Promise<Contract> {
  const formData = new FormData()
  formData.append('contractFile', file)

  const response = await fetch(`${API_BASE}/contracts/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) {
    throw new Error('Failed to upload contract')
  }
  return response.json()
}
