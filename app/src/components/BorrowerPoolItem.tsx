import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getPoolDetail, PoolDetailInfo } from '../utils/getPoolDetail';
import { SwapForm } from './SwapForm';
import { DepositLiquidityForm } from './DepositLiquidityForm';
import { LendForm } from './LendForm';
import { RedeemForm } from './RedeemForm';
import { BorrowForm } from './BorrowForm';
import { RepayForm } from './RepayForm';
import { DepositCollateralForm } from './DepositCollateral';
import { InitPoolForm } from './InitPoolForm';
import { PoolInfo } from '../utils/getPoolList';
interface PoolItemProps {
  pool: PoolInfo;
  onTxSuccess: (signature: string) => void;
}

export const BorrowerPoolItem: FC<PoolItemProps> = ({ pool, onTxSuccess }) => {
  const { connection } = useConnection();
  const { publicKey: walletPublicKey } = useWallet();
  const [activeForm, setActiveForm] = useState<'none' | 'initPool' | 'deposit' | 'swap' | 'lend' | 'redeem' | 'borrow' | 'repay' | 'depositCollateral'>('none');
  const [details, setDetails] = useState<PoolDetailInfo | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchDetails = async () => {
    try {
      setIsLoadingDetails(true);
      const poolDetail = await getPoolDetail(
        connection, 
        pool, 
        walletPublicKey || null
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

        <div className="pool-details">
          <span className="pool-label">Min Collateral Ratio:</span>
          <span className="pool-value" title={pool.minCollateralRatio.toString()}>
            {pool.minCollateralRatio}
          </span>
        </div>

      </div>


      <div className="pool-price-info">
        <h4>Prices</h4>
        {isLoadingDetails ? (
          <div className="loading-prices">Loading prices...</div>
        ) : details ? (
          <>
            <div className="pool-details">
              <span className="pool-label">TokenA Amount:</span>
              <span className="pool-value">{details.pool.tokenAAmount.toFixed(6)}</span>
            </div>
            <div className="pool-details">
              <span className="pool-label">TokenB Amount:</span>
              <span className="pool-value">{details.pool.tokenBAmount.toFixed(6)}</span>
            </div>
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
        <h4>Your borrowing details</h4>
        {isLoadingDetails ? (
          <div className="loading-lending-pool-details">Loading lending pool details...</div>
        ) : details ? (
          <>
            <div className="pool-details">
              <span className="pool-label">borrowed tokenB amount:</span>
              <span className="pool-value">{details.userAssets.borrowReceiptAmount}</span>
            </div>

            <div className="pool-details">
              <span className="pool-label">collateral TokenA amount:</span>
              <span className="pool-value">{details.userAssets.collateralReceiptAmount}</span>
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
            onClick={() => setActiveForm(activeForm === 'depositCollateral' ? 'none' : 'depositCollateral')}
          >
            {activeForm === 'depositCollateral' ? 'Hide DepositCollateral' : 'DepositCollateral'}
          </button>

          <button 
            className="lending-pool-action-button"
            onClick={() => setActiveForm(activeForm === 'borrow' ? 'none' : 'borrow')}
          >
            {activeForm === 'borrow' ? 'Hide Borrow' : 'Borrow'}
          </button>

          <button 
            className="lending-pool-action-button"
            onClick={() => setActiveForm(activeForm === 'repay' ? 'none' : 'repay')}
          >
            {activeForm === 'repay' ? 'Hide Repay' : 'Repay'}
          </button>

        </div>

        <button 
          className="lending-pool-refresh-button"
          onClick={fetchDetails}
          disabled={isLoadingDetails}
        >
          {isLoadingDetails ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {activeForm === 'borrow' && (
        <div className="form-container">
          <BorrowForm 
            pool={pool}
            onSuccess={(signature) => {
              onTxSuccess(signature);
              setActiveForm('none');
              fetchDetails();
            }}
          />
        </div>
      )}

      {activeForm === 'repay' && (
        <div className="form-container">
          <RepayForm 
            pool={pool}
            onSuccess={(signature) => {
              onTxSuccess(signature);
              setActiveForm('none');
              fetchDetails();
            }}
          />
        </div>
      )}

      {activeForm === 'depositCollateral' && (
        <div className="form-container">
          <DepositCollateralForm 
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