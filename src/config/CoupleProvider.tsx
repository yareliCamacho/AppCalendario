import React, { createContext, useContext, useMemo } from 'react';
import { useCouple } from '../hooks/useCouple';

type CoupleContextValue = ReturnType<typeof useCouple>;

const CoupleContext = createContext<CoupleContextValue | null>(null);

export function CoupleProvider({ children }: { children: React.ReactNode }) {
  const value = useCouple();
  const memo = useMemo(() => value, [value.coupleId, value.userId, value.loading, value.hasCouple]);
  return <CoupleContext.Provider value={memo}>{children}</CoupleContext.Provider>;
}

export function useCoupleContext() {
  const ctx = useContext(CoupleContext);
  if (!ctx) throw new Error('useCoupleContext debe usarse dentro de CoupleProvider');
  return ctx;
}
