import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: string
  trendDirection?: 'up' | 'down'
  testId?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection,
  testId,
}: StatCardProps) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div
          className="text-2xl font-bold"
          data-testid={testId ? `${testId}-value` : undefined}
        >
          {value}
        </div>
        {trend && (
          <p
            className={`text-xs ${
              trendDirection === 'up'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
            data-testid={testId ? `${testId}-trend` : undefined}
          >
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
