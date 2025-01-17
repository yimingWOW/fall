import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getPoolDetail, PoolDetailInfo } from '../utils/getPoolDetail';
import { BorrowForm } from './BorrowForm';
import { RepayForm } from './RepayForm';
import { DepositCollateralForm } from './DepositCollateral';
import { PoolInfo } from '../utils/getPoolList';
import { PublicKey } from '@solana/web3.js';
import { BASE_RATE } from '../utils/constants';
import '../style/Theme.css';
import '../style/Typography.css';

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
    <div className="tap-page">
      <div className="card gradient-border">
        <h2 className="section-title">Current Prices</h2>
        {isLoadingDetails ? (
          <div className="loading-spinner"></div>
        ) : details ? (
          <>
            <div className="pool-item-content">
              <div>
                <span className="body-text">
                  Price (A → B)
                </span>
                <span className="code-text">
                  1 A = {details.poolInfo.aToB.toFixed(6)} B
                </span>
              </div>
              <div>
                <span className="body-text">
                  Price (B → A)
                </span>
                <span className="code-text">
                  1 B = {details.poolInfo.bToA.toFixed(6)} A
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="secondary-text">Failed to load prices</div>
        )}
      </div>

      <div className="card gradient-border">
        <h2 className="section-title">Credit Pool</h2>
        {isLoadingDetails ? (
          <div className="loading-spinner"></div>
        ) : details ? (
          <>
            <div className="pool-item-content">
              <div>
                <span className="body-text">
                  TokenA Addr
                </span>
                <span className="code-text" title={pool.mintA.toString()}>
                  {pool.mintA.toString().slice(0, 4)}...{pool.mintA.toString().slice(-4)}
                </span>
              </div>
              <div>
                <span className="body-text">
                  TokenA Balance
                </span>
                <span className="code-text">
                  {details.lendingPoolInfo.tokenAAmount.toFixed(6)}
                </span>
              </div>
            </div>

            <div className="pool-item-content">
              <div>
                <span className="body-text">
                  TokenB Addr
                </span>
                <span className="code-text" title={pool.mintB.toString()}>
                  {pool.mintB.toString().slice(0, 4)}...{pool.mintB.toString().slice(-4)}
                </span>
              </div>
              <div>
                <span className="body-text">
                  TokenB Balance
                </span>
                <span className="code-text">
                  {details.lendingPoolInfo.tokenBAmount.toFixed(6)}
                </span>
              </div>
            </div>
            
            <div className="pool-item-content">
              <div>
                <span className="body-text">
                  Min Collateral Ratio
                </span>
                <span className="code-text">
                  {(pool.minCollateralRatio/BASE_RATE*100).toFixed(2)}%
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="secondary-text">Failed to load credit pool details</div>
        )}
      </div>

      <div className="card gradient-border">
        <h2 className="section-title">Your Assets</h2>
        {isLoadingDetails ? (
          <div className="loading-spinner"></div>
        ) : details ? (
          <>
            <div className="pool-item-content">
              <div>
                <span className="body-text">
                  Borrowed tokenA
                </span>
                <span className="code-text">
                  {details.userAssets.borrowReceiptAmount}
                </span>
              </div>
              <div>
                <span className="body-text">
                  Collateral TokenB
                </span>
                <span className="code-text">
                  {details.userAssets.collateralReceiptAmount}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="secondary-text">Failed to load lending pool details</div>
        )}
      </div>

      <div className="card gradient-border">
        <h2 className="section-title">Actions</h2>

        {isLoadingDetails ? (
          <div className="loading-spinner"></div>
        ) : details ? (
          <>
            <button
              className="btn btn-primary"
              onClick={() => setShowDepositCollateral(!showDepositCollateral)}
            >
              {showDepositCollateral ? 'Show Borrow/Repay' : 'Show Deposit Collateral'}
            </button>

            {showDepositCollateral ? (
              <DepositCollateralForm 
                pool={pool}
                onSuccess={(signature) => {
                  onTxSuccess(signature);
                  fetchDetails();
                }}
              />
            ) : (
              Number(details.userAssets.borrowReceiptAmount) === 0 ? (
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
              )
            )}
          </>
        ) : (
          <div className="secondary-text">Failed to load lending pool details</div>
        )}
      </div>
    </div>
  );
};