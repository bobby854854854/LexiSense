import { AIInsightPanel } from '../ai-insight-panel'

const mockInsights = [
  {
    type: 'key-term' as const,
    title: 'Payment Terms',
    content: 'Net 30 payment terms identified. Standard for B2B contracts.',
  },
  {
    type: 'risk' as const,
    title: 'Non-Standard Liability Clause',
    content:
      'Liability cap of $1M is below industry standard for contracts of this value.',
  },
  {
    type: 'obligation' as const,
    title: 'Quarterly Reporting Required',
    content: 'Vendor must submit performance reports every 90 days.',
  },
]

export default function AIInsightPanelExample() {
  return (
    <div className="p-8 bg-background max-w-2xl">
      <AIInsightPanel insights={mockInsights} testId="panel-ai-insights" />
    </div>
  )
}
