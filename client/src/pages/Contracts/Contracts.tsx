import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Toolbar,
  Alert,
} from '@mui/material';
import {
  DataGridPro,
  GridColDef,
  GridRowSelectionModel,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid-pro';
import {
  Upload as UploadIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://lexisense-api.onrender.com';

interface Contract {
  id: string;
  title: string;
  counterparty: string;
  value: number;
  createdAt: string;
  expiryDate: string;
  status: string;
  risk: string;
}

const Contracts: React.FC = () => {
  const { accessToken } = useAuth();
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'createdAt', sort: 'desc' },
  ]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['contracts', paginationModel.page, paginationModel.pageSize, sortModel],
    queryFn: async () => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const sortField = sortModel[0]?.field || 'createdAt';
      const sortOrder = sortModel[0]?.sort || 'desc';

      const url = new URL(`${API_BASE_URL}/api/v1/contracts`);
      url.searchParams.set('page', String(paginationModel.page + 1)); // API is 1-indexed
      url.searchParams.set('pageSize', String(paginationModel.pageSize));
      url.searchParams.set('sortBy', sortField);
      url.searchParams.set('sortOrder', sortOrder);

      const response = await fetch(url.toString(), { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }
      
      const result = await response.json();
      
      // Handle different response formats
      return {
        data: result.data || result.contracts || [],
        total: result.total || result.totalCount || 0,
      };
    },
    retry: 2,
  });

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Contract Title',
      width: 250,
      sortable: true,
    },
    {
      field: 'counterparty',
      headerName: 'Counterparty',
      width: 200,
      sortable: true,
    },
    {
      field: 'value',
      headerName: 'Value',
      width: 150,
      sortable: true,
      valueFormatter: (params) => {
        const value = params as number;
        return value ? `$${value.toLocaleString()}` : 'N/A';
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      sortable: true,
      renderCell: (params) => {
        const status = String(params.value || 'draft');
        const colors: Record<string, string> = {
          active: '#10b981',
          draft: '#6b7280',
          expired: '#ef4444',
          pending: '#f59e0b',
        };
        return (
          <Box
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: 1,
              bgcolor: `${colors[status.toLowerCase()] || '#6b7280'}20`,
              color: colors[status.toLowerCase()] || '#6b7280',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {status}
          </Box>
        );
      },
    },
    {
      field: 'risk',
      headerName: 'Risk',
      width: 120,
      sortable: true,
      renderCell: (params) => {
        const risk = String(params.value || 'low');
        const colors: Record<string, string> = {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#ef4444',
          critical: '#dc2626',
        };
        return (
          <Box
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: 1,
              bgcolor: `${colors[risk.toLowerCase()] || '#10b981'}20`,
              color: colors[risk.toLowerCase()] || '#10b981',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {risk}
          </Box>
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      sortable: true,
      valueFormatter: (params) => {
        const date = params as string;
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      },
    },
    {
      field: 'expiryDate',
      headerName: 'Expiry Date',
      width: 150,
      sortable: true,
      valueFormatter: (params) => {
        const date = params as string;
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      },
    },
  ];

  const selectedCount = Array.isArray(selectionModel) ? selectionModel.length : 0;

  const handleBulkExport = () => {
    console.log('Exporting contracts:', selectionModel);
    // Placeholder for future bulk export functionality
    alert(`Export functionality coming soon! ${selectedCount} contracts selected.`);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Contracts
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Manage and analyze your contract portfolio
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<UploadIcon />}>
            Upload Contract
          </Button>
        </Box>
      </Box>

      {/* Bulk Action Toolbar */}
      {selectedCount > 0 && (
        <Toolbar
          sx={{
            mb: 2,
            bgcolor: 'primary.lighter',
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {selectedCount} contract{selectedCount > 1 ? 's' : ''} selected
          </Typography>
          <Button
            variant="contained"
            startIcon={<ExportIcon />}
            onClick={handleBulkExport}
            size="small"
          >
            Bulk Export
          </Button>
        </Toolbar>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load contracts. Please try again later.
        </Alert>
      )}

      {/* DataGrid */}
      <Box sx={{ height: 650, width: '100%', bgcolor: 'white', borderRadius: 3 }}>
        <DataGridPro
          rows={data?.data || []}
          columns={columns}
          rowCount={data?.total || 0}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50, 100]}
          paginationModel={paginationModel}
          paginationMode="server"
          onPaginationModelChange={setPaginationModel}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={selectionModel}
          onRowSelectionModelChange={setSelectionModel}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f9fafb',
              borderBottom: '2px solid #e5e7eb',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default Contracts;
