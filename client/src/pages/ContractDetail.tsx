import { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { useToast } from '@/components/ui/use-toast'
import type { Contract, AnalysisResults } from '@shared/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, Users, Calendar, AlertTriangle, FileWarning, ServerCrash } from 'lucide-react'
import { analysisResultsSchema } from '@shared/types'

interface ContractDetailPageProps {
  id: string
}

export function ContractDetailPage({ id }: ContractDetailPageProps) {
  const { toast } = useToast()
  const [contract, setContract] = useState<Contract | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContractDetails = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/contracts/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Contract not found.')
          }
          throw new Error('Failed to fetch contract details.')
        }
        const data: Contract = await response.json()
        setContract(data)

        if (data.status === 'active' && data.analysisResults) {
          const validation = analysisResultsSchema.safeParse(data.analysisResults)
          if (validation.success) {
            setAnalysis(validation.data)
          } else {
            console.error('AI analysis data is malformed:', validation.error)
            throw new Error('The AI analysis for this contract is in an invalid format.')
          }
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
        setError(errorMessage)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchContractDetails()
  }, [id, toast])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
          <Card className="w-full max-w-md text-center">
              <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                      <ServerCrash className="h-8 w-8 text-destructive" />
                      Loading Error
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button asChild>
                    <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Dashboard</Link>
                  </Button>
              </CardContent>
          </Card>
      </div>
    );
  }

  if (!contract) {
    return <div>Contract not found.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{contract.name}</h1>
          <p className="text-sm text-muted-foreground">
            Uploaded on {new Date(contract.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      {contract.status === 'processing' && (
         <Alert variant="default" className="bg-blue-50 border-blue-200">
           <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <AlertTitle className="text-blue-800">Analysis In Progress</AlertTitle>
            <AlertDescription className="text-blue-700">
              LexiSense is currently analyzing this contract. The results will appear here once the process is complete. This may take a few moments.
            </AlertDescription>
        </Alert>
      )}

      {contract.status === 'failed' && (
         <Alert variant="destructive">
           <FileWarning className="h-5 w-5" />
            <AlertTitle>Analysis Failed</AlertTitle>
            <AlertDescription>
              We were unable to analyze this contract. This can happen with unsupported file formats, corrupted files, or very complex layouts. Please try uploading the document again.
            </AlertDescription>
        </Alert>
      )}

      {analysis && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>AI-Generated Summary</CardTitle>
              <CardDescription>A concise overview of the contract's purpose and scope.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/>Parties Involved</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.parties.map((party, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{party.name}</span>
                  <Badge variant="secondary">{party.role}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary"/>Key Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><strong>Effective Date:</strong><span>{analysis.keyDates.effectiveDate}</span></div>
                <div className="flex justify-between"><strong>Termination Date:</strong><span>{analysis.keyDates.terminationDate}</span></div>
                <div>
                  <strong>Renewal Terms:</strong>
                  <p className="text-muted-foreground mt-1">{analysis.keyDates.renewalTerms}</p>
                </div>
            </CardContent>
          </Card>

           <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700"><AlertTriangle className="h-5 w-5"/>Potential Risks</CardTitle>
              <CardDescription>High-level risks identified by LexiSense for your review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
               {analysis.highLevelRisks.map((risk, index) => (
                  <Alert key={index} variant="default" className="border-amber-300 bg-amber-50">
                     <AlertTriangle className="h-4 w-4 text-amber-600" />
                     <AlertDescription className="text-amber-800">{risk}</AlertDescription>
                  </Alert>
               ))}
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  )
}