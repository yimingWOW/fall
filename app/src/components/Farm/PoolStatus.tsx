import { FC, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PoolInfo } from '../../utils/getPoolList';
import '../../style/Theme.css';
import '../../style/segment.css';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { createPool } from '../../utils/createPool';
import { PoolStatusInfo } from '../../utils/getPoolDetail';

interface PoolStatusProps {
  pool: PoolInfo | null;
  poolStatus: PoolStatusInfo | null;
  onTxSuccess: (signature: string) => void;
}

export const PoolStatus: FC<PoolStatusProps> = ({ pool, onTxSuccess, poolStatus }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);

  if (poolStatus === null) {
    return (
      <div className="wrapper">
        <div className="card-container">
          <div className="wrapper-box">
            <div className="align-center">
              Loading pool status...
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPoolSetupComplete = poolStatus && 
  poolStatus.createPool1 && 
  poolStatus.createPool2 && 
  poolStatus.initLendingPool1 && 
  poolStatus.initLendingPool2 && 
  poolStatus.initLendingPool3;

  const handleCreatePool = async () => {
    try {
      if (!wallet) {
        console.error('Wallet not connected');
        return;
      }
      if (!pool) {
        console.error('Pool not found');
        return;
      }
      setIsLoading(true);
      const signature = await createPool(
        wallet,
        connection,
        pool?.amm,
        pool?.mintA,
        pool?.mintB
      );
      onTxSuccess(signature.toString());
    } catch (error) {
      console.error('Error creating pool:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <div className="card-container">
      {!isPoolSetupComplete && (
        <div className="wrapper-box">
          <div className="align-center">
            <div className="segmented-progress-bar">
              <div className={`segment ${poolStatus?.createPool1 ? 'completed' : 'pending'}`} 
                  title="Create Pool 1" />
              <div className={`segment ${poolStatus?.createPool2 ? 'completed' : 'pending'}`}
                  title="Create Pool 2" />
              <div className={`segment ${poolStatus?.initLendingPool1 ? 'completed' : 'pending'}`}
                  title="Init Lending Pool 1" />
              <div className={`segment ${poolStatus?.initLendingPool2 ? 'completed' : 'pending'}`}
                  title="Init Lending Pool 2" />
              <div className={`segment ${poolStatus?.initLendingPool3 ? 'completed' : 'pending'}`}
                  title="Init Lending Pool 3" />
            </div>
          </div>
          <div className="step">
            <p>This pool has not initialized completely yet. Click the button below to initialize it.</p>
          </div>
          <div className="align-center">
          <button
            className="button btn-primary" 
            onClick={handleCreatePool}
            disabled={isLoading}
          >
            {isLoading ? 'Initializing Pool...' : 'Initialize Pool'}
          </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
