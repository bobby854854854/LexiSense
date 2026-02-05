import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

interface Insight {
  type: 'key-term' | 'obligation' | 'risk' | 'opportunity'
  title: string
  content: string
  severity?: 'low' | 'medium' | 'high'
}

interface AIInsightPanelProps {
  insights: Insight[]
  testId?: string
}

const getTypeColor = (type: string) => {
  const colors = {
    'key-term': 'blue',
    obligation: 'purple',
    risk: 'red',
    opportunity: 'green',
  }
  const color = colors[type as keyof typeof colors] || 'gray'
  return `bg-${color}-500/10 text-${color}-700 dark:text-${color}-400 border-${color}-500/20`
}

export function AIInsightPanel({ insights, testId }: AIInsightPanelProps) {
  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI-Powered Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border bg-card space-y-2"
            data-testid={`insight-${index}`}
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm">{insight.title}</h4>
              <Badge className={getTypeColor(insight.type)}>
                {insight.type
                  .replace('-', ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{insight.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
