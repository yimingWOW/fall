import { FC, useEffect, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { getPoolList } from '../../utils/getPoolList';
import { PoolInfo } from '../../utils/getPoolList';
import { BorrowerPoolItem } from './BorrowPoolItem';
import defaultTokenIcon from '../../assets/default-token.png';
import '../../style/Theme.css';
import '../../style/Typography.css';

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
      <div className="tap-page">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (selectedPool) {
    return (
      <div className="tap-page">
        <div className="back-button-container">
          <button 
            className="button btn-primary"
            onClick={() => setSelectedPool(null)}
          >
            Back
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
    <div className="tap-page">
      {pools.length === 0 ? (
        <div className="section">
          <span className="code-text">No pools available</span>
        </div>
      ) : (
        <div className="section">
          {pools.map((pool) => (
            <div key={pool.poolPk.toString()} className="step" onClick={() => setSelectedPool(pool)}>
              <div className="info-row">
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
                </div>
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