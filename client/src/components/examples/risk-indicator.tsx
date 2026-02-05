import { RiskIndicator } from '../risk-indicator'

export default function RiskIndicatorExample() {
  return (
    <div className="p-8 bg-background max-w-md space-y-4">
      <RiskIndicator
        level="high"
        title="High Risk Contracts"
        description="Contracts with non-standard clauses or compliance issues"
        count={12}
        testId="card-risk-high"
      />
      <RiskIndicator
        level="medium"
        title="Medium Risk Contracts"
        description="Requires review before expiration"
        count={34}
        testId="card-risk-medium"
      />
    </div>
  )
}
