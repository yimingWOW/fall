import { FC, useEffect, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { getPoolList } from '../utils/getPoolList';
import { PoolInfo } from '../utils/getPoolList';
import { LenderPoolItem } from './LenderPoolItem';
import '../style/PoolList.css';

export const LenderPoolList: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<PoolInfo | null>(null);
  const [lastTxSignature, setLastTxSignature] = useState<string>('');

  const fetchPools = async () => {
    try {
      setIsLoading(true);
      if (!wallet) return;
      const poolList = await getPoolList(wallet, connection);
      setPools(poolList);
    } catch (error) {
      console.error('Error fetching pools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, [connection, wallet, lastTxSignature]);

  if (isLoading) {
    return (
      <div className="pool-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading pools...</p>
      </div>
    );
  }

  if (selectedPool) {
    return (
      <div className="pool-detail-view">
        <button 
          className="back-button"
          onClick={() => setSelectedPool(null)}
        >
          ← Back to Pool List
        </button>
        <LenderPoolItem 
          pool={selectedPool} 
          onTxSuccess={(signature) => {
            setLastTxSignature(signature);
            fetchPools();
          }}
        />
      </div>
    );
  }

  return (
    <div className="pool-list-container">
      <h2 className="pool-list-title">Available Lending Pools</h2>
      {pools.length === 0 ? (
        <div className="no-pools-message">
          No pools available
        </div>
      ) : (
        <div className="pool-list">
          {pools.map((pool) => (
            <div 
              key={pool.pubkey.toString()} 
              className="pool-list-item"
              onClick={() => setSelectedPool(pool)}
            >
              <div className="pool-tokens">
                <div className="token-info">
                  <span className="token-label">Token A:</span>
                  <span className="token-address" title={pool.mintA.toString()}>
                    {pool.mintA.toString().slice(0, 4)}...{pool.mintA.toString().slice(-4)}
                  </span>
                </div>
                <div className="token-separator">⟷</div>
                <div className="token-info">
                  <span className="token-label">Token B:</span>
                  <span className="token-address" title={pool.mintB.toString()}>
                    {pool.mintB.toString().slice(0, 4)}...{pool.mintB.toString().slice(-4)}
                  </span>
                </div>
              </div>
              <div className="pool-view-details">
                View Details →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};