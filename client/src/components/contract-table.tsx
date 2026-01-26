import type { Contract as SchemaContract } from '@shared/schema';

export type Contract = SchemaContract & {
  type: string;
  status: 'active' | 'expiring' | 'expired' | 'draft' | string;
};

export const ContractTable = ({ contracts, selectedContracts, onSelectionChange, onRowClick }: { contracts: Contract[], selectedContracts: string[], onSelectionChange: (ids: string[]) => void, onRowClick: (contract: Contract) => void }) => {
  return <div>Contract Table</div>;
};