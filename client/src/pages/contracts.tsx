import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ContractTable } from "@/components/contract-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Upload, Filter, X } from "lucide-react";
import { getContracts } from "@/lib/api";
import type { Contract as UIContract } from "@/components/contract-table";
import { useLocation } from "wouter";

export default function Contracts() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"title" | "date" | "value">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: ["/api/contracts"],
    queryFn: getContracts,
    retry: 1,
  });

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load contracts</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  // Ensure status values conform to the UI Contract['status'] union
  function normalizeStatus(s: unknown): UIContract["status"] {
    if (s === "active" || s === "expiring" || s === "expired" || s === "draft") {
      return s as UIContract["status"];
    }
    return "draft";
  }

  const contractTypes = useMemo(() => {
    const types = new Set(contracts.map(c => c.contractType).filter(Boolean));
    return Array.from(types);
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    let filtered = contracts.filter((contract) => {
      const matchesSearch = searchQuery === "" || 
        (contract.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (contract.counterparty?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (contract.contractType?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
      const matchesType = typeFilter === "all" || contract.contractType === typeFilter;
      const matchesRisk = riskFilter === "all" || contract.riskLevel === riskFilter;
      
      return matchesSearch && matchesStatus && matchesType && matchesRisk;
    });

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "title":
          aVal = a.title?.toLowerCase() || "";
          bVal = b.title?.toLowerCase() || "";
          break;
        case "value":
          aVal = parseFloat(a.value?.replace(/[^\d.-]/g, "") || "0");
          bVal = parseFloat(b.value?.replace(/[^\d.-]/g, "") || "0");
          break;
        case "date":
        default:
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered.map((contract) => ({
      ...contract,
      type: contract.contractType || "N/A",
      status: normalizeStatus((contract as any).status),
    })) as UIContract[];
  }, [contracts, searchQuery, statusFilter, typeFilter, riskFilter, sortBy, sortOrder]);

  const handleBulkDelete = async () => {
    if (selectedContracts.length === 0) return;
    console.log("Bulk delete:", selectedContracts);
    setSelectedContracts([]);
  };

  const handleSelectAll = () => {
    if (selectedContracts.length === filteredContracts.length) {
      setSelectedContracts([]);
    } else {
      setSelectedContracts(filteredContracts.map(c => c.id));
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setRiskFilter("all");
  };

  const activeFiltersCount = [statusFilter, typeFilter, riskFilter].filter(f => f !== "all").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contract Repository</h1>
          <p className="text-muted-foreground">
            Centralized storage and management of all contracts
          </p>
        </div>
        <Button onClick={() => setLocation("/upload")} data-testid="button-upload-contract">
          <Upload className="h-4 w-4 mr-2" />
          Upload Contract
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, counterparty, or type..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring">Expiring</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {contractTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field as typeof sortBy);
              setSortOrder(order as typeof sortOrder);
            }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest</SelectItem>
                <SelectItem value="date-asc">Oldest</SelectItem>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
                <SelectItem value="title-desc">Title Z-A</SelectItem>
                <SelectItem value="value-desc">Value High</SelectItem>
                <SelectItem value="value-asc">Value Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(activeFiltersCount > 0 || searchQuery) && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchQuery}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Status: {statusFilter}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
              </Badge>
            )}
            {typeFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Type: {typeFilter}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setTypeFilter("all")} />
              </Badge>
            )}
            {riskFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Risk: {riskFilter}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setRiskFilter("all")} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}

        {selectedContracts.length > 0 && (
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedContracts.length} contract(s) selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                Delete Selected
              </Button>
              <Button size="sm" variant="outline">
                Export Selected
              </Button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading contracts...</div>
      ) : filteredContracts.length === 0 && contracts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No contracts yet. Upload your first contract to get started!</p>
          <Button onClick={() => setLocation("/upload")} data-testid="button-upload-first">
            <Upload className="h-4 w-4 mr-2" />
            Upload First Contract
          </Button>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No contracts match your search criteria.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Checkbox
              checked={selectedContracts.length === filteredContracts.length && filteredContracts.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              Select all ({filteredContracts.length})
            </span>
          </div>
          
          <ContractTable
            contracts={filteredContracts}
            selectedContracts={selectedContracts}
            onSelectionChange={setSelectedContracts}
            onRowClick={(contract) => console.log("Navigate to contract:", contract.id)}
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing {filteredContracts.length} of {contracts.length} contracts
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled data-testid="button-prev">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled data-testid="button-next">
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
