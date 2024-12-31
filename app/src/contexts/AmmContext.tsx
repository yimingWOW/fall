import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AmmContextType {
  amm: any;
  setAmm: (amm: any) => void;
}

const AmmContext = createContext<AmmContextType | undefined>(undefined);

export const AmmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [amm, setAmm] = useState<any>(null);

  return (
    <AmmContext.Provider value={{ amm, setAmm }}>
      {children}
    </AmmContext.Provider>
  );
};

export const useAmm = (): AmmContextType => {
  const context = useContext(AmmContext);
  if (!context) {
    throw new Error('useAmm must be used within an AmmProvider');
  }
  return context;
};