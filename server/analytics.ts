import { storage } from './storage'

export async function getContractAnalytics() {
  try {
    const contracts = await storage.getAllContracts()

    const totalContracts = contracts.length
    const riskDistribution = contracts.reduce(
      (acc, contract) => {
        const riskLevel = contract.riskLevel || 'low'
        acc[riskLevel] = (acc[riskLevel] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const statusDistribution = contracts.reduce(
      (acc, contract) => {
        acc[contract.status] = (acc[contract.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      totalContracts,
      riskDistribution,
      statusDistribution,
    }
  } catch (error) {
    console.error('Analytics calculation error:', error)
    return {
      totalContracts: 0,
      riskDistribution: {},
      statusDistribution: {},
    }
  }
}
