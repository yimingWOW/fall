import { FC, useEffect, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { getPoolList } from '../utils/getPoolList';
import { PoolInfo } from '../utils/getPoolList';
import { BorrowerPoolItem } from './BorrowerPoolItem';
import '../style/BorrowerPoolList.css';

export const BorrowerPoolList: FC = () => {
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
        <div className="back-button-container">
          <button 
            className="back-button"
            onClick={() => setSelectedPool(null)}
          >
            ← Back to Pool List
          </button>
        </div>
        <BorrowerPoolItem 
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
      <div className="pool-list-header">
        <h2 className="pool-list-title">Available Credit Pools</h2>
        <div className="pool-list-columns">
          <span>Trading Pair</span>
          <span>Pool Address</span>
          <span>Action</span>
        </div>
      </div>
      
      {pools.length === 0 ? (
        <div className="no-pools-message">
          No pools available
        </div>
      ) : (
        <div className="pool-list">
          {pools.map((pool) => (
            <div 
              key={pool.poolPk.toString()} 
              className="pool-list-item"
              onClick={() => setSelectedPool(pool)}
            >
              <div className="pool-item-content">
                <div className="pool-pair">
                  <span>{pool.mintA.toString().slice(0, 4)}...{pool.mintA.toString().slice(-4)}</span>
                  <span className="separator">/</span>
                  <span>{pool.mintB.toString().slice(0, 4)}...{pool.mintB.toString().slice(-4)}</span>
                </div>
                <div className="pool-address">
                  {pool.poolPk.toString().slice(0, 4)}...{pool.poolPk.toString().slice(-4)}
                </div>
                <button className="view-details-btn">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 