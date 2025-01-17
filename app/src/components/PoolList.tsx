import { FC, useState, useEffect } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { PoolInfo, getPoolList } from '../utils/getPoolList';
import { PoolItem } from './PoolItem';
import { CreatePoolForm } from './CreatePoolForm';
import '../style/Theme.css';
import '../style/Typography.css';

export const PoolList: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<PoolInfo | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [lastTxSignature, setLastTxSignature] = useState<string>('');

  const fetchPools = async () => {
    try {
      setIsLoading(true);
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
      <div className="tap-page">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <CreatePoolForm 
        onShowForm={setShowCreateForm}
        onSuccess={(signature) => {
          setLastTxSignature(signature);
          setShowCreateForm(false);
        }}
      />
    );
  }

  if (selectedPool) {
    return (
      <div className="tap-page">
        <div className="back-button-container">
          <button 
            className="btn btn-primary"
            onClick={() => setSelectedPool(null)}
          >
            Back
          </button>
        </div>
        <PoolItem 
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
    <div className="tap-page">
      <div className="card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--spacing-md)'
        }}>
          <h2 className="section-title">Available Pools</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create Pool
          </button>
        </div>
        
        <div className="pool-list-columns">
          <span className="secondary-text">Trading Pair</span>
          <span className="secondary-text">Pool Address</span>
          <span className="secondary-text">Action</span>
        </div>
      </div>
      
      {pools.length === 0 ? (
        <div className="card">
          <span className="code-text">No pools available</span>
        </div>
      ) : (
        <div className="pool-list">
          {pools.map((pool) => (
            <div 
              key={pool.poolPk.toString()} 
              className="card gradient-border"
              onClick={() => setSelectedPool(pool)}
            >
              <div className="pool-item-content">
              <div>
                  <span className="code-text address-pair">
                    <span>{pool.mintA.toString().slice(0, 4)}...{pool.mintA.toString().slice(-4)}</span>
                    <span className="secondary-text">/</span>
                    <span>{pool.mintB.toString().slice(0, 4)}...{pool.mintB.toString().slice(-4)}</span>
                  </span>
                </div>
                <div>
                  <span className="code-text">
                    {pool.poolPk.toString().slice(0, 4)}...{pool.poolPk.toString().slice(-4)}
                  </span>
                </div>
                <button className="btn btn-primary">
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};