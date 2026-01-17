import { useState } from 'react';
import { api } from '@/lib/api';
import type { Contract } from '@shared/types';

export const useContracts = (orgId: string) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/contracts');  // Filtered by org via auth
      setContracts(res.data);
    } finally {
      setLoading(false);
    }
  };

  const uploadContract = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    try {
      const res = await api.post('/api/contracts/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setContracts(prev => [...prev, res.data]);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  return { contracts, loading, fetchContracts, uploadContract };
};