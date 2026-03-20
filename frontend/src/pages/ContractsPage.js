import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { contractsAPI } from '../api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Loader2,
  Plus,
  Trash2,
  Eye,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const RiskBadge = ({ level }) => {
  const colors = {
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    low: 'bg-green-500/10 text-green-500 border-green-500/20',
  };
  return (
    <Badge variant="outline" className={colors[level] || 'bg-gray-500/10 text-gray-500'}>
      {level || 'N/A'}
    </Badge>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    active: 'bg-green-500/10 text-green-500',
    draft: 'bg-blue-500/10 text-blue-500',
    expired: 'bg-gray-500/10 text-gray-500',
    pending: 'bg-yellow-500/10 text-yellow-500',
  };
  return (
    <Badge variant="secondary" className={colors[status] || colors.draft}>
      {status || 'draft'}
    </Badge>
  );
};

const CONTRACT_TYPES = [
  'General',
  'NDA',
  'Employment',
  'Service Agreement',
  'Lease',
  'Partnership',
  'Licensing',
  'Purchase Agreement',
  'Other',
];

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    counterparty: '',
    contractType: 'General',
    file: null,
  });

  const fetchContracts = useCallback(async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status_filter = statusFilter;
      if (typeFilter) params.contract_type = typeFilter;
      
      const response = await contractsAPI.list(params);
      setContracts(response.data);
    } catch (error) {
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadData.file);
    formData.append('title', uploadData.title);
    formData.append('counterparty', uploadData.counterparty);
    formData.append('contractType', uploadData.contractType);

    try {
      await contractsAPI.upload(formData);
      toast.success('Contract uploaded and analyzed successfully!');
      setUploadOpen(false);
      setUploadData({ title: '', counterparty: '', contractType: 'General', file: null });
      fetchContracts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    
    try {
      await contractsAPI.delete(id);
      toast.success('Contract deleted');
      fetchContracts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Delete failed');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="contracts-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Contracts</h1>
            <p className="text-muted-foreground mt-1">Manage and analyze your contracts</p>
          </div>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button data-testid="upload-contract-btn">
                <Plus className="mr-2 h-4 w-4" />
                Upload Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Contract</DialogTitle>
                <DialogDescription>
                  Upload a PDF or text file to analyze with AI
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Contract Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Service Agreement - Acme Corp"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    required
                    data-testid="upload-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="counterparty">Counterparty</Label>
                  <Input
                    id="counterparty"
                    placeholder="e.g., Acme Corporation"
                    value={uploadData.counterparty}
                    onChange={(e) => setUploadData({ ...uploadData, counterparty: e.target.value })}
                    data-testid="upload-counterparty"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractType">Contract Type</Label>
                  <Select
                    value={uploadData.contractType}
                    onValueChange={(value) => setUploadData({ ...uploadData, contractType: value })}
                  >
                    <SelectTrigger data-testid="upload-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">File (PDF or TXT) *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    {uploadData.file ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{uploadData.file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setUploadData({ ...uploadData, file: null })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, TXT (max 10MB)</p>
                        <input
                          type="file"
                          accept=".pdf,.txt,application/pdf,text/plain"
                          className="hidden"
                          onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                          data-testid="upload-file"
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setUploadOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={uploading} data-testid="upload-submit">
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Upload & Analyze'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contracts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="type-filter">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {CONTRACT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No contracts found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery || statusFilter || typeFilter
                    ? 'Try adjusting your filters'
                    : 'Upload your first contract to get started'}
                </p>
                {!searchQuery && !statusFilter && !typeFilter && (
                  <Button className="mt-4" onClick={() => setUploadOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Contract
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <Link
                          to={`/contracts/${contract.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {contract.title}
                        </Link>
                        {contract.fileName && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {contract.fileName} ({formatFileSize(contract.fileSize)})
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{contract.counterparty || '-'}</TableCell>
                      <TableCell>{contract.contractType}</TableCell>
                      <TableCell>
                        <StatusBadge status={contract.status} />
                      </TableCell>
                      <TableCell>
                        <RiskBadge level={contract.riskLevel} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(contract.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/contracts/${contract.id}`} data-testid={`view-${contract.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(contract.id, contract.title)}
                            data-testid={`delete-${contract.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
