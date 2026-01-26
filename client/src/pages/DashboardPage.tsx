import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FilePlus2, Loader2, FileText } from 'lucide-react'
import { UploadContractModal } from '@/components/UploadContractModal'
import { useToast } from '@/components/ui/use-toast'
import type { Contract } from '@shared/types'
import { Link } from 'wouter'
import { cn } from '@/utils'

export function DashboardPage() {
  const { toast } = useToast()
  const [isUploadModalOpen, setUploadModalOpen] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchContracts = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/contracts')
        if (!response.ok) {
          throw new Error('Failed to fetch contracts.')
        }
        const data = await response.json()
        setContracts(data)
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load your contracts.',
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchContracts()
  }, [toast])

  const handleUploadSuccess = (newContract: Contract) => {
    setContracts((prevContracts) => [newContract, ...prevContracts])
    setUploadModalOpen(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusVariant = (status: Contract['status']) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'processing':
        return 'secondary'
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (contracts.length === 0) {
      return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-12">
          <div className="flex flex-col items-center gap-1 text-center">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-2xl font-bold tracking-tight">
              No contracts yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Get started by uploading your first contract.
            </p>
            <Button className="mt-4" onClick={() => setUploadModalOpen(true)}>
              <FilePlus2 className="mr-2 h-4 w-4" />
              Upload Contract
            </Button>
          </div>
        </div>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Contracts</CardTitle>
          <CardDescription>
            A list of all contracts in your organization's repository.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.name}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(contract.status)}>
                      {contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(contract.createdAt.toString())}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/contracts/${contract.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
        <div
          className={cn(
            'flex items-center gap-2',
            contracts.length === 0 && 'invisible',
          )}
        >
          <Button onClick={() => setUploadModalOpen(true)}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            Upload New Contract
          </Button>
        </div>
      </div>

      {renderContent()}

      <UploadContractModal
        isOpen={isUploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  )
}
