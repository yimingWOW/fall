import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { getPoolDetail, PoolDetailInfo } from '../utils/getPoolDetail';
import { checkCreditPool } from '../utils/checkCreditPool';
import { LendForm } from './LendForm';
import { RedeemForm } from './RedeemForm';
import { PoolInfo } from '../utils/getPoolList';
import { PublicKey } from '@solana/web3.js';
import { InitPoolForm } from './InitPoolForm';
import '../style/LenderPoolItem.css';

interface PoolItemProps {
  pool: PoolInfo;
  onTxSuccess: (signature: string) => void;
}

export const LenderPoolItem: FC<PoolItemProps> = ({ pool, onTxSuccess }) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { publicKey: walletPublicKey } = useWallet();
  const [details, setDetails] = useState<PoolDetailInfo | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isCreditPool, setIsCreditPool] = useState(false);

  const checkPool = async () => {
    try {
      if (!wallet) return;
      
      const isCredit = await checkCreditPool(
        wallet,
        connection,
        pool.pubkey,
        pool.mintA
      );
      
      setIsCreditPool(isCredit.isCreditPoolInitialized);
    } catch (error) {
      console.error('Error checking credit pool:', error);
    }
  };

  useEffect(() => {
    checkPool();
  }, [connection, pool, wallet]);

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
    if (isCreditPool) {
      fetchDetails();
    }
  }, [pool, connection, walletPublicKey, isCreditPool]);

  console.log("isCreditPool", isCreditPool);

  if (!isCreditPool) {
    return (
      <div className="pool-item">
        <div className="init-pool-section">
          <div className="init-pool-description">
            <p>This liquidity pool has not created a lending pool yet.</p>
            <p>Click the button below to create one.</p>
          </div>
          <InitPoolForm 
            pool={pool}
            onSuccess={() => {
              setIsCreditPool(true);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pool-item">
      <div className="pool-header">
        <h3>Credit Pool Details</h3>
      </div>
      
      <div className="pool-info">
        <div className="pool-details">
          <span className="pool-label">Pool Pubkey:</span>
          <span className="pool-value" title={pool.pubkey.toString()}>
            {pool.pubkey.toString()}
          </span>
        </div>

        <div className="pool-details">
          <span className="pool-label">Token A mint addr:</span>
          <span className="pool-value" title={pool.mintA.toString()}>
            {pool.mintA.toString()}
          </span>
        </div>

        <div className="pool-details">
          <span className="pool-label">Token B mint addr:</span>
          <span className="pool-value" title={pool.mintB.toString()}>
            {pool.mintB.toString()}
          </span>
        </div>

      </div>

      <div className="lending-pool-info">
        {isLoadingDetails ? (
          <div className="loading-lending-pool-details">Loading lending pool details...</div>
        ) : details ? (
          <>
            <div className="pool-details">
              <span className="pool-label">Credit Pool tokenA Amount:</span>
              <span className="pool-value">{details.lendingPool.tokenAAmount.toFixed(6)}</span>
            </div>

            <div className="pool-details">
              <span className="pool-label">Credit Pool tokenB Amount:</span>
              <span className="pool-value">{details.lendingPool.tokenBAmount.toFixed(6)}</span>
            </div>

          </>
        ) : (
          <div className="error-message">Failed to load lending pool details</div>
        )}
      </div>

      <div className="user-assets-details">
        <h4>Your Assets</h4>
        {isLoadingDetails ? (
          <div className="loading-lending-pool-details">Loading credit pool details...</div>
        ) : details ? (
          <>
            <div className="pool-details">
              <span className="pool-label">tokenA Balance:</span>
              <span className="pool-value">{details.userAssets.tokenAAmount}</span>
            </div>
            <div className="pool-details">
              <span className="pool-label">You have lent tokenA amount:</span>
              <span className="pool-value">{details.userAssets.lendingReceiptAmount}</span>
            </div>
          </>
        ) : (
          <div className="error-message">Failed to load lending pool details</div>
        )}
      </div>

      <div className="user-lending-details">
        {isLoadingDetails ? (
          <div className="loading-lending-pool-details">Credit lending pool details...</div>
        ) : details ? (
          <>
            {Number(details.userAssets.lendingReceiptAmount) === 0 ? (
              <LendForm 
                pool={pool}
                onSuccess={(signature) => {
                  onTxSuccess(signature);
                  fetchDetails();
                }}
              />
            ) : (
              <RedeemForm 
                pool={pool}
                onSuccess={(signature) => {
                  onTxSuccess(signature);
                  fetchDetails();
                }}
              />
            )}
          </>
        ) : (
          <div className="error-message">Failed to load credit pool details</div>
        )}
      </div>

      <div className="lending-pool-actions">
        <button 
          className="lending-pool-refresh-button"
          onClick={fetchDetails}
          disabled={isLoadingDetails}
        >
          {isLoadingDetails ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>
    </div>
  );
};