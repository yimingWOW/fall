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

export const PoolItem: FC<PoolItemProps> = ({ pool, onTxSuccess }) => {
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
      
      <div className="pool-details">
        <span className="pool-label">AMM Pubkey:</span>
        <span className="pool-value" title={pool.amm.toString()}>
          {pool.amm.toString()}
        </span>
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
          <span className="pool-label">Fee:</span>
          <span className="pool-value" title={pool.fee.toString()}>
            {pool.fee}
          </span>
        </div>

        <div className="pool-details">
          <span className="pool-label">Min Collateral Ratio:</span>
          <span className="pool-value" title={pool.minCollateralRatio.toString()}>
            {pool.minCollateralRatio}
          </span>
        </div>

      </div>

      <div className="pool-actions">
        <button
          className="action-button"
          onClick={() => setActiveForm(activeForm === 'initPool' ? 'none' : 'initPool')}
        >
          {activeForm === 'initPool' ? 'Hide Init Pool' : 'Init Pool'}
        </button>
      </div>

      {activeForm === 'initPool' && (
        <div className="form-container">
          <InitPoolForm 
            pool={pool}
            onSuccess={(signature) => {
              onTxSuccess(signature);
              setActiveForm('none');
              fetchDetails();
            }}
          />
        </div>
      )}

      <div className="pool-price-info">
        <h4>Pool Liquidity & Prices</h4>
        {isLoadingDetails ? (
          <div className="loading-prices">Loading prices...</div>
        ) : details ? (
          <>
            <div className="pool-details">
              <span className="pool-label">Token A Reserve:</span>
              <span className="pool-value">{details.pool.tokenAAmount.toFixed(6)}</span>
            </div>
            <div className="pool-details">
              <span className="pool-label">Token B Reserve:</span>
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

      <div className="pool-actions">
        <button
          className="action-button"
          onClick={() => setActiveForm(activeForm === 'deposit' ? 'none' : 'deposit')}
        >
          {activeForm === 'deposit' ? 'Hide Deposit' : 'Deposit'}
        </button>
        <button 
          className="action-button"
          onClick={() => setActiveForm(activeForm === 'swap' ? 'none' : 'swap')}
        >
          {activeForm === 'swap' ? 'Hide Swap' : 'Swap'}
        </button>
      </div>

      {activeForm === 'deposit' && (
        <div className="form-container">
          <DepositLiquidityForm 
            pool={pool}
            onSuccess={(signature) => {
              onTxSuccess(signature);
              setActiveForm('none');
              fetchDetails();
            }}
          />
        </div>
      )}

      {activeForm === 'swap' && (
        <div className="form-container">
          <SwapForm 
            pool={pool}
            onSuccess={(signature) => {
              onTxSuccess(signature);
              setActiveForm('none');
              fetchDetails();
            }}
          />
        </div>
      )}

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

            <div className="pool-details">
              <span className="pool-label">Lending Pool lendingReceipt:</span>
              <span className="pool-value">{details.lendingPool.addresses.lendingReceipt}</span>
            </div>

            <div className="pool-details">
              <span className="pool-label">Lending Pool borrowReceipt:</span>
              <span className="pool-value">{details.lendingPool.addresses.borrowReceipt}</span>
            </div>

            <div className="pool-details">
              <span className="pool-label">Lending Pool collateralReceipt:</span>
              <span className="pool-value">{details.lendingPool.addresses.collateralReceipt}</span>
            </div>
          </>
        ) : (
          <div className="error-message">Failed to load lending pool details</div>
        )}
      </div>

      <div className="user-lending-details">
        <h4>User Lending Pool</h4>
        {isLoadingDetails ? (
          <div className="loading-lending-pool-details">Loading lending pool details...</div>
        ) : details ? (
          <>
            <div className="pool-details">
              <span className="pool-label">user tokenAAmount:</span>
              <span className="pool-value">{details.userAssets.tokenAAmount}</span>
            </div>

            <div className="pool-details">
              <span className="pool-label">user tokenBAmount:</span>
              <span className="pool-value">{details.userAssets.tokenBAmount}</span>
            </div>

            <div className="pool-details">
              <span className="pool-label">user lendingReceipt:</span>
              <span className="pool-value">{details.userAssets.lendingReceiptAmount}</span>
            </div>

            <div className="pool-details">
              <span className="pool-label">user borrowReceipt:</span>
              <span className="pool-value">{details.userAssets.borrowReceiptAmount}</span>
            </div>

            <div className="pool-details">
              <span className="pool-label">user collateralReceipt:</span>
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

          <button 
            className="lending-pool-action-button"
            onClick={() => setActiveForm(activeForm === 'depositCollateral' ? 'none' : 'depositCollateral')}
          >
            {activeForm === 'depositCollateral' ? 'Hide DepositCollateral' : 'DepositCollateral'}
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