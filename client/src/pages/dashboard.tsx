import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StatCard } from '@/components/stat-card'
import { ContractCard } from '@/components/contract-card'
import { ActivityFeed } from '@/components/activity-feed'
import { RiskIndicator } from '@/components/risk-indicator'
import { FileText, Clock, Sparkles, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getContracts } from '@/lib/api'
import { useLocation } from 'wouter'

export default function Dashboard() {
  const [, setLocation] = useLocation()
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['/api/contracts'],
    queryFn: getContracts,
  })

  const activeContracts = contracts.filter((c) => c.status === 'active')
  const expiringContracts = contracts.filter((c) => c.status === 'expiring')
  const highRiskContracts = contracts.filter((c) => c.riskLevel === 'high')
  const mediumRiskContracts = contracts.filter((c) => c.riskLevel === 'medium')
  const lowRiskContracts = contracts.filter((c) => c.riskLevel === 'low')

  const recentContracts = contracts.slice(0, 3)

  const stats = [
    {
      title: 'Active Contracts',
      value: activeContracts.length.toString(),
      icon: FileText,
      trend: `${contracts.length} total contracts`,
      trendDirection: 'up' as const,
      testId: 'card-stat-active',
    },
    {
      title: 'Expiring Soon',
      value: expiringContracts.length.toString(),
      icon: Clock,
      trend: 'Next 30 days',
      trendDirection: 'down' as const,
      testId: 'card-stat-expiring',
    },
    {
      title: 'AI Analyzed',
      value: contracts.filter((c) => c.aiInsights).length.toString(),
      icon: Sparkles,
      trend: 'Contracts with AI insights',
      trendDirection: 'up' as const,
      testId: 'card-stat-ai',
    },
    {
      title: 'High Risk',
      value: highRiskContracts.length.toString(),
      icon: TrendingUp,
      trend: 'Requires attention',
      trendDirection: 'down' as const,
      testId: 'card-stat-savings',
    },
  ]

  const activities = [
    {
      id: '1',
      type: 'contract_uploaded' as const,
      title: 'New Contract Uploaded',
      description: 'Master Service Agreement with Acme Corp',
      timestamp: '2 minutes ago',
    },
    {
      id: '2',
      type: 'analysis_complete' as const,
      title: 'AI Analysis Complete',
      description: 'Contract analyzed - 3 key terms extracted',
      timestamp: '15 minutes ago',
    },
    {
      id: '3',
      type: 'risk_detected' as const,
      title: 'Risk Alert',
      description: 'Non-standard liability clause detected in TechCo contract',
      timestamp: '1 hour ago',
    },
    {
      id: '4',
      type: 'expiring_soon' as const,
      title: 'Contract Expiring',
      description: 'Software License Agreement expires in 45 days',
      timestamp: '3 hours ago',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your contract portfolio overview.
          </p>
        </div>
        <Button
          onClick={() => setLocation('/contracts')}
          data-testid="button-new-contract"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Contract
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.testId} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Contracts</h2>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading contracts...
              </div>
            ) : recentContracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  No contracts yet. Upload your first contract to get started!
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {recentContracts.map((contract) => (
                  <ContractCard
                    key={contract.id}
                    id={contract.id}
                    title={contract.title}
                    counterparty={contract.counterparty}
                    status={contract.status as any}
                    value={contract.value || '$0'}
                    expiryDate={contract.expiryDate || 'N/A'}
                    riskLevel={contract.riskLevel as any}
                    onClick={() => setLocation(`/contracts/${contract.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Risk Overview</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <RiskIndicator
                level="high"
                title="High Risk"
                description="Require immediate attention"
                count={highRiskContracts.length}
                testId="card-risk-high"
              />
              <RiskIndicator
                level="medium"
                title="Medium Risk"
                description="Review recommended"
                count={mediumRiskContracts.length}
                testId="card-risk-medium"
              />
              <RiskIndicator
                level="low"
                title="Low Risk"
                description="Standard compliance"
                count={lowRiskContracts.length}
                testId="card-risk-low"
              />
            </div>
          </div>
        </div>

        <div>
          <ActivityFeed activities={activities} testId="feed-activity" />
        </div>
      </div>
    </div>
  )
}
