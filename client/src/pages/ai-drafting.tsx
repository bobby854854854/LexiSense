import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
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
import { Sparkles, Download, Send, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { draftContract } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export default function AIDrafting() {
  const { toast } = useToast()
  const [contractType, setContractType] = useState('')
  const [party1, setParty1] = useState('')
  const [party2, setParty2] = useState('')
  const [value, setValue] = useState('')
  const [terms, setTerms] = useState('')
  const [generatedText, setGeneratedText] = useState('')

  const draftMutation = useMutation({
    mutationFn: draftContract,
    onSuccess: (data) => {
      setGeneratedText(data.contract)
    },
    onError: () => {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate contract. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const handleGenerate = () => {
    if (!contractType || !party1 || !party2) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in contract type and both parties.',
        variant: 'destructive',
      })
      return
    }

    draftMutation.mutate({
      contractType,
      party1,
      party2,
      value,
      terms,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">AI Contract Drafting</h1>
          <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">
            Pro Feature
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Generate professional contracts in seconds using AI
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contract Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contract-type">Contract Type</Label>
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger
                  id="contract-type"
                  data-testid="select-contract-type"
                >
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="msa">Master Service Agreement</SelectItem>
                  <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
                  <SelectItem value="sla">
                    Software License Agreement
                  </SelectItem>
                  <SelectItem value="consulting">
                    Consulting Agreement
                  </SelectItem>
                  <SelectItem value="employment">
                    Employment Contract
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="party1">Party 1 (Your Organization)</Label>
              <Input
                id="party1"
                placeholder="Enter organization name"
                value={party1}
                onChange={(e) => setParty1(e.target.value)}
                data-testid="input-party1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="party2">Party 2 (Counterparty)</Label>
              <Input
                id="party2"
                placeholder="Enter counterparty name"
                value={party2}
                onChange={(e) => setParty2(e.target.value)}
                data-testid="input-party2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Contract Value</Label>
              <Input
                id="value"
                placeholder="$0.00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                data-testid="input-value"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms">Key Terms & Requirements</Label>
              <Textarea
                id="terms"
                placeholder="Describe the key terms, deliverables, and requirements..."
                rows={6}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                data-testid="input-terms"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={draftMutation.isPending}
              data-testid="button-generate"
            >
              {draftMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Contract
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Contract</CardTitle>
          </CardHeader>
          <CardContent>
            {generatedText ? (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
                  <pre className="font-mono text-sm whitespace-pre-wrap">
                    {generatedText}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" data-testid="button-download">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    data-testid="button-send"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send for Review
                  </Button>
                </div>
              </div>
            ) : (
              <div className="min-h-[400px] flex items-center justify-center text-center">
                <div className="space-y-3">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Ready to Generate</p>
                    <p className="text-sm text-muted-foreground">
                      Fill in the contract parameters and click Generate
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
