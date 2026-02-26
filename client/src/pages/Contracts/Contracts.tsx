import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box, Typography, Button, Toolbar, Alert, Chip } from '@mui/material'
import {
  DataGridPro,
  GridColDef,
  GridRowSelectionModel,
  GridPaginationModel,
  GridSortModel,
  GridValueFormatterParams,
} from '@mui/x-data-grid-pro'
import {
  Upload as UploadIcon,
  FileDownload as ExportIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { API_BASE_URL } from '../../constants'

interface Contract {
  id: string
  title: string
  counterparty: string
  value: number
  createdAt: string
  expiryDate: string
  status: string
  risk: string
}

interface ContractsResponse {
  data?: Contract[]
  contracts?: Contract[]
  total?: number
  totalCount?: number
}

const Contracts: React.FC = () => {
  const { accessToken } = useAuth()
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(
    []
  )
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  })
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'createdAt', sort: 'desc' },
  ])

  const { data, isLoading, error } = useQuery<ContractsResponse>({
    queryKey: [
      'contracts',
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    queryFn: async (): Promise<ContractsResponse> => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const sortField = sortModel[0]?.field || 'createdAt'
      const sortOrder = sortModel[0]?.sort || 'desc'

      const url = new URL(`${API_BASE_URL}/v1/contracts`)
      url.searchParams.set('page', String(paginationModel.page + 1)) // API is 1-indexed
      url.searchParams.set('pageSize', String(paginationModel.pageSize))
      url.searchParams.set('sortBy', sortField)
      url.searchParams.set('sortOrder', sortOrder)

      const response = await fetch(url.toString(), { headers })

      if (!response.ok) {
        throw new Error('Failed to fetch contracts')
      }

      const result = await response.json()

      // Normalize response format - backend may return data or contracts array
      return {
        data: result.data || result.contracts || [],
        total: result.total || result.totalCount || 0,
      }
    },
    retry: 2,
  })

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
      valueFormatter: (params: GridValueFormatterParams) => {
        const value = params.value as number | null
        return value ? `$${value.toLocaleString()}` : 'N/A'
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      sortable: true,
      renderCell: (params) => {
        const status = String(params.value || 'draft')
        const statusLower = status.toLowerCase()
        const colors: Record<string, string> = {
          active: '#10b981',
          draft: '#6b7280',
          expired: '#ef4444',
          pending: '#f59e0b',
        }

        const icons: Record<string, React.ReactNode> = {
          active: <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />,
          draft: <WarningIcon sx={{ fontSize: 16, mr: 0.5 }} />,
          expired: <ErrorIcon sx={{ fontSize: 16, mr: 0.5 }} />,
          pending: <WarningIcon sx={{ fontSize: 16, mr: 0.5 }} />,
        }

        return (
          <Chip
            icon={icons[statusLower]}
            label={status}
            size="small"
            aria-label={`Status: ${status}`}
            sx={{
              bgcolor: `${colors[statusLower] || '#6b7280'}20`,
              color: colors[statusLower] || '#6b7280',
              fontWeight: 600,
              '& .MuiChip-icon': {
                color: 'inherit',
              },
            }}
          />
        )
      },
    },
    {
      field: 'risk',
      headerName: 'Risk',
      width: 140,
      sortable: true,
      renderCell: (params) => {
        const risk = String(params.value || 'low')
        const riskLower = risk.toLowerCase()
        const colors: Record<string, string> = {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#ef4444',
          critical: '#dc2626',
        }

        const icons: Record<string, React.ReactNode> = {
          low: <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />,
          medium: <WarningIcon sx={{ fontSize: 16, mr: 0.5 }} />,
          high: <ErrorIcon sx={{ fontSize: 16, mr: 0.5 }} />,
          critical: <ErrorIcon sx={{ fontSize: 16, mr: 0.5 }} />,
        }

        return (
          <Chip
            icon={icons[riskLower]}
            label={risk}
            size="small"
            aria-label={`Risk level: ${risk}`}
            sx={{
              bgcolor: `${colors[riskLower] || '#10b981'}20`,
              color: colors[riskLower] || '#10b981',
              fontWeight: 600,
              '& .MuiChip-icon': {
                color: 'inherit',
              },
            }}
          />
        )
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      sortable: true,
      valueFormatter: (params: GridValueFormatterParams) => {
        const date = params.value as string | null
        return date ? new Date(date).toLocaleDateString() : 'N/A'
      },
    },
    {
      field: 'expiryDate',
      headerName: 'Expiry Date',
      width: 150,
      sortable: true,
      valueFormatter: (params: GridValueFormatterParams) => {
        const date = params.value as string | null
        return date ? new Date(date).toLocaleDateString() : 'N/A'
      },
    },
  ]

  const selectedCount = Array.isArray(selectionModel)
    ? selectionModel.length
    : 0

  const handleBulkExport = () => {
    if (!data?.data || selectedCount === 0) return

    const selectionSet = new Set(
      (Array.isArray(selectionModel) ? selectionModel : []).map((id) =>
        String(id)
      )
    )

    const selectedContracts = data.data.filter((contract: Contract) =>
      selectionSet.has(String(contract.id))
    )

    if (selectedContracts.length === 0) return

    const headers = [
      'id',
      'title',
      'counterparty',
      'value',
      'createdAt',
      'expiryDate',
      'status',
      'risk',
    ]

    const escapeCsvValue = (value: unknown): string => {
      const str = value === null || value === undefined ? '' : String(value)
      const escaped = str.replace(/"/g, '""')
      return `"${escaped}"`
    }

    const rows = selectedContracts.map((contract) =>
      [
        contract.id,
        contract.title,
        contract.counterparty,
        contract.value,
        contract.createdAt,
        contract.expiryDate,
        contract.status,
        contract.risk,
      ]
        .map(escapeCsvValue)
        .join(',')
    )

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `contracts-export-${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
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
      <Box
        sx={{ height: 650, width: '100%', bgcolor: 'white', borderRadius: 3 }}
      >
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
  )
}

export default Contracts
