import { ActivityFeed } from '../activity-feed'

const mockActivities = [
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
    description: 'Non-standard liability clause detected',
    timestamp: '1 hour ago',
  },
]

export default function ActivityFeedExample() {
  return (
    <div className="p-8 bg-background max-w-md">
      <ActivityFeed activities={mockActivities} testId="feed-activity" />
    </div>
  )
}
