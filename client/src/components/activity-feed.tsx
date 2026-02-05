import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react'

interface Activity {
  id: string
  type:
    | 'contract_uploaded'
    | 'analysis_complete'
    | 'expiring_soon'
    | 'risk_detected'
    | 'ai_suggestion'
  title: string
  description: string
  timestamp: string
}

interface ActivityFeedProps {
  activities: Activity[]
  testId?: string
}

const activityConfig = {
  contract_uploaded: {
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  analysis_complete: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
  },
  expiring_soon: {
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  risk_detected: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
  },
  ai_suggestion: {
    icon: Sparkles,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
  },
}

export function ActivityFeed({ activities, testId }: ActivityFeedProps) {
  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => {
          const config = activityConfig[activity.type] || {
            icon: FileText,
            color: 'text-gray-600 dark:text-gray-400',
            bg: 'bg-gray-500/10',
          }
          const Icon = config.icon

          return (
            <div
              key={activity.id}
              className="flex gap-3"
              data-testid={`activity-${activity.id}`}
            >
              <div
                className={`h-10 w-10 rounded-md ${config.bg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium text-sm">{activity.title}</p>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
