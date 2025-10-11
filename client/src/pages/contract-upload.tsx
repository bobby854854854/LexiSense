import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Upload as UploadIcon, Loader2 } from 'lucide-react'
import { analyzeContract } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useLocation } from 'wouter'

export default function ContractUpload() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [counterparty, setCounterparty] = useState('')
  const [contractType, setContractType] = useState('')
  const [contractText, setContractText] = useState('')

  const analyzeMutation = useMutation({
    mutationFn: analyzeContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] })
      toast({
        title: 'Contract Uploaded Successfully',
        description: 'AI analysis complete. Contract added to your repository.',
      })
      setLocation('/contracts')
    },
    onError: () => {
      toast({
        title: 'Upload Failed',
        description: 'Failed to analyze contract. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !counterparty || !contractText) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    analyzeMutation.mutate({
      text: contractText,
      title,
      counterparty,
      contractType: contractType || 'Other',
    })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Upload Contract</h1>
        <p className="text-muted-foreground">
          Upload and analyze a contract with AI-powered intelligence
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadIcon className="h-5 w-5" />
            Contract Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Contract Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Master Service Agreement"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="counterparty">Counterparty *</Label>
                <Input
                  id="counterparty"
                  placeholder="e.g., Acme Corporation"
                  value={counterparty}
                  onChange={(e) => setCounterparty(e.target.value)}
                  required
                  data-testid="input-counterparty"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-type">Contract Type</Label>
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger id="contract-type" data-testid="select-type">
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MSA">Master Service Agreement</SelectItem>
                  <SelectItem value="NDA">Non-Disclosure Agreement</SelectItem>
                  <SelectItem value="SLA">
                    Software License Agreement
                  </SelectItem>
                  <SelectItem value="CSA">Consulting Agreement</SelectItem>
                  <SelectItem value="PA">Purchase Agreement</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-text">Contract Text *</Label>
              <Textarea
                id="contract-text"
                placeholder="Paste the full contract text here..."
                rows={12}
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                required
                data-testid="input-text"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Paste the contract text or upload a file (PDF support coming
                soon)
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={analyzeMutation.isPending}
                data-testid="button-analyze"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze with AI
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/contracts')}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
