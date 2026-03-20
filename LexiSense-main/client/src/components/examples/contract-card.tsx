import { ContractCard } from '../contract-card'

export default function ContractCardExample() {
  return (
    <div className="p-8 bg-background max-w-md">
      <ContractCard
        id="1"
        title="Master Service Agreement"
        counterparty="Acme Corporation"
        status="active"
        value="$250,000"
        expiryDate="Dec 31, 2025"
        riskLevel="low"
        onClick={() => console.log('Contract clicked')}
      />
    </div>
  )
}
