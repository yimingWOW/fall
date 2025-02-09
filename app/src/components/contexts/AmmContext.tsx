import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { getAmmAccounts, AmmInfo } from '../../utils/getAmmList';

interface AmmContextType {
  amm: AmmInfo | null;
  amms: AmmInfo[];
  setAmm: (amm: AmmInfo | null) => void;
  selectAmm: (amm: AmmInfo) => void;
  isLoading: boolean;
  error: string | null;
  refreshAmms: () => Promise<void>;
}

const AmmContext = createContext<AmmContextType | undefined>(undefined);

export const AmmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [amm, setAmm] = useState<AmmInfo | null>(null);
  const [amms, setAmms] = useState<AmmInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectAmm = (selectedAmm: AmmInfo) => {
    console.log('Selected AMM:', selectedAmm.pubkey);
    setAmm(selectedAmm);
  };

  const refreshAmms = async () => {
    if (!wallet) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const ammAccounts = await getAmmAccounts(wallet, connection);
      setAmms(ammAccounts);
      if (ammAccounts.length > 0 && !amm) {
        selectAmm(ammAccounts[0]);
      }
    } catch (err) {
      console.error("Error fetching AMMs:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch AMMs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAmms();
  }, [wallet, connection]);

  return (
    <AmmContext.Provider value={{ 
      amm, 
      amms,
      setAmm, 
      selectAmm, 
      isLoading,
      error,
      refreshAmms
    }}>
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