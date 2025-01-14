import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getPoolDetail, PoolDetailInfo } from '../utils/getPoolDetail';
import { LendForm } from './LendForm';
import { RedeemForm } from './RedeemForm';
import { PoolInfo } from '../utils/getPoolList';
import { PublicKey } from '@solana/web3.js';
import { CheckCreditPoolForm } from './CheckCreditPoolForm';
interface PoolItemProps {
  pool: PoolInfo;
  onTxSuccess: (signature: string) => void;
}

export const LenderPoolItem: FC<PoolItemProps> = ({ pool, onTxSuccess }) => {
  const { connection } = useConnection();
  const { publicKey: walletPublicKey } = useWallet();
  const [activeForm, setActiveForm] = useState<'none' | 'lend' | 'redeem' | 'borrow' | 'repay' | 'depositCollateral'>('none');
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
      <CheckCreditPoolForm 
        pool={pool}
      />
      <div className="pool-header">
        <h3>Pool Details</h3>
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
        <h4>Lending Pool</h4>
        {isLoadingDetails ? (
          <div className="loading-lending-pool-details">Loading lending pool details...</div>
        ) : details ? (
          <>
            <div className="pool-details">
              <span className="pool-label">Lending Pool tokenAAmount:</span>
              <span className="pool-value">{details.lendingPool.tokenAAmount.toFixed(6)}</span>
            </div>

            <div className="pool-details">
              <span className="pool-label">Lending Pool tokenBAmount:</span>
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
          <div className="loading-lending-pool-details">Loading lending pool details...</div>
        ) : details ? (
          <>
            <div className="pool-details">
              <span className="pool-label">tokenA Balance:</span>
              <span className="pool-value">{details.userAssets.tokenAAmount}</span>
            </div>

            <div className="pool-details">
              <span className="pool-label">tokenB Balance:</span>
              <span className="pool-value">{details.userAssets.tokenBAmount}</span>
            </div>
          </>
        ) : (
          <div className="error-message">Failed to load lending pool details</div>
        )}
      </div>

      <div className="user-lending-details">
        <h4>Your lending details</h4>
        {isLoadingDetails ? (
          <div className="loading-lending-pool-details">Loading lending pool details...</div>
        ) : details ? (
          <>
            <div className="pool-details">
              <span className="pool-label">lended tokenB amount:</span>
              <span className="pool-value">{details.userAssets.lendingReceiptAmount}</span>
            </div>
          </>
        ) : (
          <div className="error-message">Failed to load lending pool details</div>
        )}
      </div>

      <div className="lending-pool-actions">
        <div className="lending-pool-action-buttons">
          <button   
            className="lending-pool-action-button"
            onClick={() => setActiveForm(activeForm === 'lend' ? 'none' : 'lend')}
          >
            {activeForm === 'lend' ? 'Hide Lend' : 'Lend'}
          </button>

          <button 
            className="lending-pool-action-button"
            onClick={() => setActiveForm(activeForm === 'redeem' ? 'none' : 'redeem')}
          >
            {activeForm === 'redeem' ? 'Hide Redeem' : 'Redeem'}
          </button>
        </div>
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

      {activeForm === 'lend' && (
        <div className="form-container">
          <LendForm 
            pool={pool}
            onSuccess={(signature) => {
              onTxSuccess(signature);
              setActiveForm('none');
              fetchDetails();
            }}
          />
        </div>
      )}

      {activeForm === 'redeem' && (
        <div className="form-container">
          <RedeemForm 
            pool={pool}
            onSuccess={(signature) => {
              onTxSuccess(signature);
              setActiveForm('none');
              fetchDetails();
            }}
          />
        </div>
      )}

    </div>
  );
};