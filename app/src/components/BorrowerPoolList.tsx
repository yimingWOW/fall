import { FC, useEffect, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { getPoolList } from '../utils/getPoolList';
import { PoolInfo } from '../utils/getPoolList';
import { BorrowerPoolItem } from './BorrowerPoolItem';

export const BorrowerPoolList: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [lastTxSignature, setLastTxSignature] = useState<string>("");

  const fetchPools = async () => {
    if (!wallet) return;
    
    setIsLoading(true);
    try {
      const pools = await getPoolList(wallet, connection);
      setPools(pools);
    } catch (err) {
      console.error("Error fetching pools:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch pools");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, [wallet, connection]);

  const handleTxSuccess = (signature: string) => {
    setLastTxSignature(signature);
    fetchPools();
  };

  return (
    <div className="pool-list-container">
      <h2>Liquidity Pools</h2>
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
        <div className="loading">Loading pools...</div>
      ) : pools.length === 0 ? (
        <div className="empty-state">
          <p>No pools found</p>
        </div>
      ) : (
        <div className="pool-list">
          {pools.map((pool) => (
            <BorrowerPoolItem 
              // key={pool.pubkey} 
              pool={pool} 
              onTxSuccess={handleTxSuccess}
            />
          ))}
        </div>
      )}

    </div>
  );
}; 