import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getPoolDetail, PoolDetailInfo } from '../utils/getPoolDetail';
import { BorrowForm } from './BorrowForm';
import { RepayForm } from './RepayForm';
import { DepositCollateralForm } from './DepositCollateral';
import { PoolInfo } from '../utils/getPoolList';
import { PublicKey } from '@solana/web3.js';
import '../style/BorrowerPoolItem.css';
import { BASE_RATE } from '../utils/constants';

interface PoolItemProps {
  pool: PoolInfo;
  onTxSuccess: (signature: string) => void;
}

export const BorrowerPoolItem: FC<PoolItemProps> = ({ pool, onTxSuccess }) => {
  const { connection } = useConnection();
  const { publicKey: walletPublicKey } = useWallet();
  const [details, setDetails] = useState<PoolDetailInfo | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showDepositCollateral, setShowDepositCollateral] = useState(false);

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
    <div className="pool-item">

      <div className="pool-price-info">
        <h4>Current Prices</h4>
        {isLoadingDetails ? (
          <div className="loading-prices">Loading prices...</div>
        ) : details ? (
          <>
            <div className="pool-details">
              <span className="pool-label">TokenA Amount in Liquidity Pool:</span>
              <span className="pool-value">{details.poolInfo.tokenAAmount.toFixed(6)}</span>
              <span className="pool-label">TokenB Amount in Liquidity Pool:</span>
              <span className="pool-value">{details.poolInfo.tokenBAmount.toFixed(6)}</span>
            </div>
            <div className="pool-details">
              <span className="pool-label">Price (A → B):</span>
              <span className="pool-value">1 A = {details.poolInfo.aToB.toFixed(6)} B</span>
              <span className="pool-label">Price (B → A):</span>
              <span className="pool-value">1 B = {details.poolInfo.bToA.toFixed(6)} A</span>
            </div>
          </>
        ) : (
          <div className="error-message">Failed to load prices</div>
        )}
      </div>

      <div className="lending-pool-info">
        <h4>Credit Pool</h4>
        {isLoadingDetails ? (
          <div className="loading-lending-pool-details">Loading lending pool details...</div>
        ) : details ? (
          <>
            <div className="pool-details">
              <span className="pool-label">Token A mint addr:</span>
              <span className="pool-value" title={pool.mintA.toString()}>
                {pool.mintA.toString()}
              </span>
            </div>

            <div className="pool-details">
              <span className="pool-label">Credit Pool tokenA Amount:</span>
              <span className="pool-value">{details.lendingPoolInfo.tokenAAmount.toFixed(6)}</span>
            </div>

            <div className="pool-details">
              <span className="pool-label">Token B mint addr:</span>
              <span className="pool-value" title={pool.mintB.toString()}>
                {pool.mintB.toString()}
              </span>
            </div>

            <div className="pool-details">
              <span className="pool-label">Credit Pool tokenB Amount:</span>
              <span className="pool-value">{details.lendingPoolInfo.tokenBAmount.toFixed(6)}</span>
            </div>
            
            <div className="pool-details">
              <span className="pool-label">Min Collateral Ratio:</span>
              <span className="pool-value" title={pool.minCollateralRatio.toString()}>
                {(pool.minCollateralRatio/BASE_RATE).toFixed(6)}
              </span>
            </div>


          </>
        ) : (
          <div className="error-message">Failed to load credit pool details</div>
        )}
      </div>

      <div className="user-assets-details">
        <h4>Your Assets</h4>
        {isLoadingDetails ? (
          <div className="loading-lending-pool-details">Loading credit pool details...</div>
        ) : details ? (
          <>
            <div className="pool-details">
              <span className="pool-label">You have borrowed tokenA amount:</span>
              <span className="pool-value">{details.userAssets.borrowReceiptAmount}</span>
            </div>

            <div className="pool-details">
              <span className="pool-label">You have deposited collateral TokenB amount:</span>
              <span className="pool-value">{details.userAssets.collateralReceiptAmount}</span>
            </div>
          </>
        ) : (
          <div className="error-message">Failed to load lending pool details</div>
        )}
      </div>

      <div className="user-lending-details">
        {isLoadingDetails ? (
          <div className="loading-lending-pool-details">Loading lending pool details...</div>
        ) : details ? (
          <>

          <div className="lending-pool-action-buttons">
            <button
              className="lending-pool-action-button"
              onClick={() => setShowDepositCollateral(!showDepositCollateral)}
            >
              {showDepositCollateral ? 'Hide DepositCollateral' : 'DepositCollateral'}
            </button>
          </div>

          {showDepositCollateral && (
            <div className="form-container">
              <DepositCollateralForm 
                pool={pool}
                onSuccess={(signature) => {
                  onTxSuccess(signature);
                  setShowDepositCollateral(false);
                  fetchDetails();
                }}
              />
            </div>
          )}

            {Number(details.userAssets.borrowReceiptAmount) === 0 ? (
              <BorrowForm 
                pool={pool}
                details={details}
                onSuccess={(signature) => {
                  onTxSuccess(signature);
                  fetchDetails();
                }}
              />
            ) : (
              <RepayForm 
                pool={pool}
                onSuccess={(signature) => {
                  onTxSuccess(signature);
                  fetchDetails();
                }}
              />
            )}
          </>
        ) : (
          <div className="error-message">Failed to load lending pool details</div>
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