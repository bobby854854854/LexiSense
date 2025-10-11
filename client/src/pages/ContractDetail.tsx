import { useParams } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, DollarSign, AlertTriangle } from 'lucide-react'
import { Link } from 'wouter'

async function fetchContract(id: string) {
  const response = await fetch(`/api/contracts/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch contract')
  }
  return response.json()
}

export default function ContractDetail() {
  const { id } = useParams()
  
  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => fetchContract(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return <div>Loading contract...</div>
  }

  if (error || !contract) {
    return <div>Contract not found</div>
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contracts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contracts
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{contract.title}</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Counterparty: {contract.counterparty}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                  {contract.status}
                </Badge>
                <Badge variant={getRiskColor(contract.riskLevel)}>
                  {contract.riskLevel} risk
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Value:</span>
                <span className="font-medium">{contract.value}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Effective:</span>
                <span className="font-medium">{contract.effectiveDate}</span>
              </div>
              {contract.expiryDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Expires:</span>
                  <span className="font-medium">{contract.expiryDate}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {contract.aiInsights && contract.aiInsights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contract.aiInsights.map((insight: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {insight.type === 'risk' && (
                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.content}
                        </p>
                        {insight.severity && (
                          <Badge 
                            variant={getRiskColor(insight.severity)} 
                            className="mt-2"
                          >
                            {insight.severity}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {contract.originalText && (
          <Card>
            <CardHeader>
              <CardTitle>Original Contract Text</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm">
                  {contract.originalText}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}