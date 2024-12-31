import { FC, useEffect, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { getLendingPoolAccounts } from '../utils/getLendingPoolList';
import { LendingPoolItem, LendingPoolInfo } from './LendingPoolItem';


export const LendingPoolList: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [lendingPools, setLendingPools] = useState<LendingPoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [lastTxSignature, setLastTxSignature] = useState<string>("");

  const fetchLendingPools = async () => {
    if (!wallet) return;
    
    setIsLoading(true);
    try {
      const poolAccounts = await getLendingPoolAccounts(wallet, connection);
      setLendingPools(poolAccounts);
    } catch (err) {
      console.error("Error fetching lending pools:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch lending pools");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLendingPools();
  }, [wallet, connection]);

  const handleTxSuccess = (signature: string) => {
    setLastTxSignature(signature);
    fetchLendingPools();
  };

  return (
    <div className="lending-lendingPool-list-container">
      <h2>Lending Pools</h2>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      {lastTxSignature && (
        <div className="success-message">
          Transaction successful! 
          <a 
            href={`https://explorer.solana.com/tx/${lastTxSignature}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
      )}
      {isLoading ? (
        <div className="loading">Loading lending pools...</div>
      ) : lendingPools.length === 0 ? (
        <div className="empty-state">
          <p>No lending pools found</p>
        </div>
      ) : (
        <div className="lending-lendingPool-list">
          {lendingPools.map((lendingPool) => (
            <LendingPoolItem 
              key={lendingPool.pubkey} 
              lendingPool={lendingPool} 
              onTxSuccess={handleTxSuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
};