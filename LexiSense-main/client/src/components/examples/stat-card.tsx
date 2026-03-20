import { StatCard } from '../stat-card'
import { FileText } from 'lucide-react'

export default function StatCardExample() {
  return (
    <div className="p-8 bg-background">
      <StatCard
        title="Active Contracts"
        value="1,247"
        icon={FileText}
        trend="+12% from last month"
        trendDirection="up"
        testId="card-stat-active"
      />
    </div>
  )
}
