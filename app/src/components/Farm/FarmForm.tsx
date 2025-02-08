import { FC, useState, useEffect } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { PoolInfo, getPoolList } from '../../utils/getPoolList';
import { PoolItem } from './PoolItem';
import { CreatePoolForm } from './CreatePoolForm';
import '../../style/Theme.css';
import '../../style/button.css';
import '../../style/Typography.css';
import defaultTokenIcon from '../../assets/default-token.png';

export const FarmForm: FC = () => {
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

  return (
    <div className="tap-page">
      {selectedPool ? (
        <div className="section">
          <div className="back-button-container">
            <button className="button btn-primary" onClick={() => setSelectedPool(null)}>Back</button>
          </div>
          <PoolItem 
            pool={selectedPool} 
            onTxSuccess={(signature) => {
              setLastTxSignature(signature);
              fetchPools();
            }}
          />
        </div>
      ) : (
        <div className="section">
          <div className="right-location-button">
            <button  className="button btn-primary" onClick={() => setShowCreateForm(true)} > Create Pool </button>
          </div>
          <div className="section"></div>
          {pools.map((pool) => (
            <div className="step" onClick={() => setSelectedPool(pool)} >
              <div className="token-pair-container">
                <img 
                  src={pool.tokenAIcon || defaultTokenIcon} 
                  alt={pool.tokenASymbol || 'Token A'} 
                  className="token-icon"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultTokenIcon;
                  }}
                />
              <div className="swap-direction-toggle" />
              <img 
                src={pool.tokenBIcon || defaultTokenIcon} 
                alt={pool.tokenBSymbol || 'Token B'} 
                className="token-icon"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultTokenIcon;
                }}
              />
              <span className="body-text">Trading Pair: </span>
              <span className="code-text address-pair">
                <span>{pool.mintA.toString().slice(0, 4)}...{pool.mintA.toString().slice(-4)}</span>
                <span className="secondary-text">/</span>
                <span>{pool.mintB.toString().slice(0, 4)}...{pool.mintB.toString().slice(-4)}</span>
              </span>
              <span className="body-text">Pool Address: </span>
              <span className="code-text">{pool.poolPk.toString().slice(0, 4)}...{pool.poolPk.toString().slice(-4)}</span>
              <button className="button btn-primary">Details</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 