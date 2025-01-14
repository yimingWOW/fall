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
        {
          pubkey: pool.pubkey.toString(),
          amm: pool.amm.toString(),
          mintA: pool.mintA.toString(),
          mintB: pool.mintB.toString(),
        }, 
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
    <div className="pool-item">
      <div className="form-container">
        <SwapForm 
          pool={pool}
          onSuccess={(signature) => {
            onTxSuccess(signature);
            fetchDetails();
          }}
        />
      </div>

      <div className="pool-price-info">
        {isLoadingDetails ? (
          <div className="loading-prices">Loading prices...</div>
        ) : details ? (
          <>
            <div className="pool-details">
              <span className="pool-label">Price (A → B):</span>
              <span className="pool-value">1 A = {details.pool.aToB.toFixed(6)} B</span>
            </div>
            <div className="pool-details">
              <span className="pool-label">Price (B → A):</span>
              <span className="pool-value">1 B = {details.pool.bToA.toFixed(6)} A</span>
            </div>
          </>
        ) : (
          <div className="error-message">Failed to load prices</div>
        )}
      </div>
    </div>
  );
};