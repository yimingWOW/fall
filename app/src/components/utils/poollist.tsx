import { FC, useEffect, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPoolList, PoolInfo } from '../../utils/getPoolList';
import defaultTokenIcon from '../../assets/default-token.png';
import '../../style/Theme.css';
import '../../style/Typography.css';

interface PoolListProps {
  showCreatePool?: boolean;
  onCreatePool?: () => void;
}

export const PoolList: FC<PoolListProps> = ({ 
  showCreatePool = false,
  onCreatePool
}) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const navigate = useNavigate();
  const location = useLocation();
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, [connection, wallet]);

  const handleDetailsClick = (pool: PoolInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    const basePath = location.pathname.split('/')[1];
    navigate(`/${basePath}/${pool.poolPk.toString()}`);
  };

  return (
    <div className="tap-page">
      {isLoading ? (
        <div className="loading-spinner"></div>
      ) : (
        <div className="section">
          {showCreatePool && (
            <>
              <div className="right-location-button">
                <button className="button btn-primary" onClick={onCreatePool}>
                  Create Pool
                </button>
              </div>
              <div className="section"></div>
            </>
          )}
          {pools.length === 0 ? (
            <span className="code-text">No pools available</span>
          ) : (
            pools.map((pool) => (
              <div
                key={pool.poolPk.toString()}
                className="step"
              >
                <div className="row-align-center">
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
                  <span className="code-text">
                    {pool.poolPk.toString().slice(0, 4)}...{pool.poolPk.toString().slice(-4)}
                  </span>
                  <button 
                    className="button btn-primary"
                    onClick={(e) => handleDetailsClick(pool, e)}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};