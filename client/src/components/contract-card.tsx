import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ContractCardProps {
  id: string
  title: string
  counterparty: string
  status: 'active' | 'expiring' | 'expired' | 'draft'
  value: string
  expiryDate: string
  riskLevel?: 'low' | 'medium' | 'high'
  onClick?: () => void
}

const getColorClasses = (color: string) =>
  `bg-${color}-500/10 text-${color}-700 dark:text-${color}-400 border-${color}-500/20`

const statusColors = {
  active: getColorClasses('green'),
  expiring: getColorClasses('yellow'),
  expired: getColorClasses('red'),
  draft: getColorClasses('blue'),
}

const riskColors = {
  low: getColorClasses('green'),
  medium: getColorClasses('yellow'),
  high: getColorClasses('red'),
}

export function ContractCard({
  id,
  title,
  counterparty,
  status,
  value,
  expiryDate,
  riskLevel,
  onClick,
}: ContractCardProps) {
  return (
    <Card
      className="hover-elevate cursor-pointer"
      onClick={onClick}
      data-testid={`card-contract-${id}`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{title}</CardTitle>
            <p className="text-sm text-muted-foreground truncate">
              {counterparty}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              data-testid={`button-contract-menu-${id}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem data-testid={`button-view-${id}`}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem data-testid={`button-edit-${id}`}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem data-testid={`button-download-${id}`}>
              Download
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            className={statusColors[status] || getColorClasses('gray')}
            data-testid={`badge-status-${id}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
          {riskLevel && (
            <Badge
              className={riskColors[riskLevel] || getColorClasses('gray')}
              data-testid={`badge-risk-${id}`}
            >
              {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Value</span>
            <p className="font-medium" data-testid={`text-value-${id}`}>
              {value}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Expires</span>
            <p className="font-medium" data-testid={`text-expiry-${id}`}>
              {expiryDate}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
