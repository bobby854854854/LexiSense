import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export interface Contract {
  id: string;
  title: string;
  counterparty: string;
  status: "active" | "expiring" | "expired" | "draft";
  value: string;
  effectiveDate: string;
  expiryDate: string;
  type: string;
}

interface ContractTableProps {
  contracts: Contract[];
  selectedContracts?: string[];
  onSelectionChange?: (selected: string[]) => void;
  onRowClick?: (contract: Contract) => void;
}

const statusColors = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  expiring: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  expired: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  draft: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
};

export function ContractTable({ contracts, selectedContracts = [], onSelectionChange, onRowClick }: ContractTableProps) {
  const handleSelectContract = (contractId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      onSelectionChange([...selectedContracts, contractId]);
    } else {
      onSelectionChange(selectedContracts.filter(id => id !== contractId));
    }
  };
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectionChange && <TableHead className="w-12"></TableHead>}
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 -ml-3"
                data-testid="button-sort-title"
              >
                Contract Title
                <span className="ml-2">↕</span>
              </Button>
            </TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Effective Date</TableHead>
            <TableHead>Expiry Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow
              key={contract.id}
              className="cursor-pointer hover-elevate"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
                  return;
                }
                onRowClick?.(contract);
              }}
              data-testid={`row-contract-${contract.id}`}
            >
              {onSelectionChange && (
                <TableCell>
                  <Checkbox
                    checked={selectedContracts.includes(contract.id)}
                    onCheckedChange={(checked) => handleSelectContract(contract.id, checked as boolean)}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">{contract.title}</TableCell>
              <TableCell>{contract.counterparty}</TableCell>
              <TableCell className="text-muted-foreground">
                {contract.type}
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[contract.status] || "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"}`}>
                  {contract.status.charAt(0).toUpperCase() +
                    contract.status.slice(1)}
                </span>
              </TableCell>
              <TableCell>{contract.value}</TableCell>
              <TableCell className="text-muted-foreground">
                {contract.effectiveDate}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {contract.expiryDate}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
