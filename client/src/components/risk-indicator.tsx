import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RiskIndicatorProps {
  level: 'low' | 'medium' | 'high'
  title: string
  description: string
  count?: number
  testId?: string
}

const riskConfig = {
  low: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  medium: {
    icon: AlertCircle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
}

export function RiskIndicator({
  level,
  title,
  description,
  count,
  testId,
}: RiskIndicatorProps) {
  const config = riskConfig[level]
  const Icon = config.icon

  return (
    <Card className={`border ${config.border}`} data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div
          className={`h-8 w-8 rounded-md ${config.bg} flex items-center justify-center`}
        >
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
      </CardHeader>
      <CardContent>
        {count !== undefined && (
          <div className={`text-2xl font-bold ${config.color} mb-1`}>
            {count}
          </div>
        )}
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
