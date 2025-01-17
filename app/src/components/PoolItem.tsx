import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getPoolDetail, PoolDetailInfo } from '../utils/getPoolDetail';
import { SwapForm } from './SwapForm';
import { PoolInfo } from '../utils/getPoolList';
import { PublicKey } from '@solana/web3.js';
import '../style/PoolItem.css';

interface PoolItemProps {
  pool: PoolInfo;
  onTxSuccess: (signature: string) => void;
}

export const PoolItem: FC<PoolItemProps> = ({ pool, onTxSuccess }) => {
  const { connection } = useConnection();
  const { publicKey: walletPublicKey } = useWallet();
  const [details, setDetails] = useState<PoolDetailInfo | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchDetails = async () => {
    try {
      setIsLoadingDetails(true);
      const poolDetail = await getPoolDetail(
        connection, 
        pool,
        walletPublicKey || new PublicKey('')
      );
      setDetails(poolDetail);
    } catch (error) {
      console.error('Error fetching pool prices:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [pool, connection, walletPublicKey]);

  return (
    <div className="card gradient-border">
      <div className="pool-item-content">
        {isLoadingDetails ? (
          <div className="code-text">Loading prices...</div>
        ) : details ? (
          <>
            <div>
              <span className="body-text">Price (A → B)</span>
              <span className="code-text">1 A = {details.poolInfo.aToB.toFixed(6)} B</span>
            </div>
            <div>
              <span className="body-text">Price (B → A)</span>
              <span className="code-text">1 B = {details.poolInfo.bToA.toFixed(6)} A</span>
            </div>
          </>
        ) : (
          <div className="code-text" style={{ color: 'var(--error)' }}>
            Failed to load prices
          </div>
        )}
      </div>

      <div className="form-container">
        <SwapForm 
          pool={pool}
          onSuccess={(signature) => {
            onTxSuccess(signature);
            fetchDetails();
          }}
        />
      </div>
    </div>
  );
};