import { ContractTable } from '../contract-table'

const mockContracts = [
  {
    id: '1',
    title: 'Master Service Agreement',
    counterparty: 'Acme Corporation',
    type: 'MSA',
    status: 'active' as const,
    value: '$250,000',
    effectiveDate: 'Jan 1, 2024',
    expiryDate: 'Dec 31, 2025',
  },
  {
    id: '2',
    title: 'Software License Agreement',
    counterparty: 'TechCo Inc',
    type: 'SLA',
    status: 'expiring' as const,
    value: '$150,000',
    effectiveDate: 'Mar 15, 2023',
    expiryDate: 'Mar 15, 2025',
  },
]

export default function ContractTableExample() {
  return (
    <div className="p-8 bg-background">
      <ContractTable
        contracts={mockContracts}
        onRowClick={(contract) => console.log('Contract clicked:', contract)}
      />
    </div>
  )
}
