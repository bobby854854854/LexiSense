import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
export default function Analytics(): React.ReactElement {
  const timeRange = '12months'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contract Analytics</h1>
          <p className="text-muted-foreground">
            Insights and trends across your contract portfolio
          </p>
        </div>
        <Select value={timeRange} onValueChange={() => {}}>
          <SelectTrigger className="w-48" data-testid="select-timerange">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
            <SelectItem value="12months">Last 12 Months</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Contract Value
            </CardTitle>
            <span className="h-4 w-4 text-muted-foreground">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12.4M</div>
            <p className="text-xs text-green-600 dark:text-green-400">
              +18% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Contract Value
            </CardTitle>
            <span className="h-4 w-4 text-muted-foreground">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$189K</div>
            <p className="text-xs text-green-600 dark:text-green-400">
              +5% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Cycle Time
            </CardTitle>
            <span className="h-4 w-4 text-muted-foreground">⏰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 days</div>
            <p className="text-xs text-green-600 dark:text-green-400">
              -23% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Renewal Rate
            </CardTitle>
            <span className="h-4 w-4 text-muted-foreground">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-green-600 dark:text-green-400">
              +3% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contract Volume by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'Master Service Agreement', count: 342, percent: 35 },
                { type: 'Software License', count: 289, percent: 30 },
                { type: 'Consulting Agreement', count: 234, percent: 24 },
                { type: 'NDA', count: 106, percent: 11 },
              ].map((item) => (
                <div key={item.type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.type}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  level: 'Low Risk',
                  count: 1201,
                  percent: 85,
                  color: 'bg-green-500',
                },
                {
                  level: 'Medium Risk',
                  count: 34,
                  percent: 10,
                  color: 'bg-yellow-500',
                },
                {
                  level: 'High Risk',
                  count: 12,
                  percent: 5,
                  color: 'bg-red-500',
                },
              ].map((item) => (
                <div key={item.level} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.level}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Counterparties by Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Acme Corporation', value: '$2.4M', contracts: 45 },
              { name: 'TechCo Industries', value: '$1.8M', contracts: 32 },
              { name: 'Global Consulting LLC', value: '$1.5M', contracts: 28 },
              {
                name: 'Enterprise Solutions Inc',
                value: '$1.2M',
                contracts: 24,
              },
              { name: 'Digital Services Co', value: '$980K', contracts: 19 },
            ].map((counterparty) => (
              <div
                key={counterparty.name}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate"
              >
                <div>
                  <p className="font-medium">{counterparty.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {counterparty.contracts} contracts
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{counterparty.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
