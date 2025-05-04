import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { getPoolDetail, PoolDetailInfo } from '../../utils/getPoolDetail';
import { BorrowForm } from './BorrowForm';
import { RepayForm } from './RepayForm';
import { DepositCollateralForm } from './DepositCollateralForm';
import { PublicKey } from '@solana/web3.js';
import { PoolStatus } from '../Farm/PoolStatus';
import { BASE_RATE, MIN_COLLATERAL_RATIO } from '../../utils/constants';
import '../../style/Theme.css';
import '../../style/Typography.css';
import { shouldInitializePool } from '../utils/pool';
import { useParams, useNavigate } from 'react-router-dom';
import { PriceDisplay } from '../utils/PriceDisplay';
import { TokenPairDisplay } from '../utils/TokenPairDisplay';
import { AddressLabel } from '../utils/AddressLabel';
export const BorrowerPoolItem: FC = () => {
  const { connection } = useConnection();
  const { publicKey: walletPublicKey } = useWallet();
  const { poolAddress } = useParams();
  const wallet = useAnchorWallet();
  const navigate = useNavigate();
  const [details, setDetails] = useState<PoolDetailInfo | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchDetails = async () => {
    try {
      if (!wallet) return;
      if (!poolAddress) return;
      setIsLoadingDetails(true);
      const poolDetail = await getPoolDetail(
        wallet,
        connection, 
        new PublicKey(poolAddress), 
        walletPublicKey || new PublicKey('')
      );
      setDetails(poolDetail);
    } catch (error) {
      console.error('Error fetchDetails:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [poolAddress, connection, walletPublicKey]);

  return (
    <div className={`card-container`}>
      <div className="back-button-container">
        <button 
            className="button btn-primary"
            onClick={() => navigate('/borrow')}
            style={{ marginBottom: 'var(--spacing-md)' }}
          >
            Back
          </button>
      </div>
      {shouldInitializePool(details?.poolStatus || null) ? (
        <PoolStatus
        pool={details?.poolInfo || null}
        poolStatus={details?.poolStatus || null}
        onTxSuccess={() => {}}
        />
      ) : (
        <>
          <div className="card-container">  
              {isLoadingDetails ? (<div className="loading-spinner"></div>) : details ? (
              <div className="section">
                <div className="section">
                  <div className="step">
                    <div className="info-row">
                      <TokenPairDisplay poolInfo={details.poolInfo} />
                      <PriceDisplay 
                        aToB={details.poolInfo.aToB || 0}
                        bToA={details.poolInfo.bToA || 0}
                        tokenASymbol={details.poolInfo.tokenASymbol || ''}
                        tokenBSymbol={details.poolInfo.tokenBSymbol || ''}
                      />
                  </div>
                  </div>
                  <div className="step">
                    <div className="info-row">
                      <AddressLabel 
                        label="You have borrowed tokenA"
                        address={details.userAssets.borrowReceiptAmount}
                      />
                      <AddressLabel 
                        label="You have collateral tokenB"
                        address={details.userAssets.collateralReceiptAmount}
                      />
                    </div>
                    <div className="info-row">
                      <AddressLabel 
                        label="Available TokenA Amount"
                        address={details.lendingPoolInfo.tokenAAmount.toFixed(6)}
                      />
                      <AddressLabel 
                        label={`Current Collateral Ratio(Min: ${(MIN_COLLATERAL_RATIO/BASE_RATE*100).toFixed(2)}%)`}
                        address={`${(Number(details.userAssets.collateralReceiptAmount)  / 
                          (Number(details.userAssets.borrowReceiptAmount)* details.poolInfo.aToB) * 100).toFixed(2)}%`}
                      />
                    </div>
                    <div className="note-text">
                      Note: Please ensure you provide sufficient collateral based on the minimum collateral ratio.
                    </div>
                    <div className="note-text">
                      Your asset liquidation price is derived solely from Fall's liquidity pools and is independent of any other DEX or CEX.
                    </div>
                  </div>
                </div>
                <div className="step">
                    <div className="row-align-center">
                      <BorrowForm pool={details?.poolInfo} details={details} onSuccess={() => {fetchDetails();}}/>
                      <DepositCollateralForm pool={details?.poolInfo} onSuccess={() => {fetchDetails();}}/>
                    </div>
                    {Number(details.userAssets.borrowReceiptAmount) != 0 || Number(details.userAssets.collateralReceiptAmount) != 0 ? (
                      <div className="step">
                        <RepayForm pool={details?.poolInfo} onSuccess={() => {fetchDetails();}}/>
                      </div>
                    ) : (
                      <div className="secondary-text"></div>
                    )}
                  </div>
              </div>) : (<div className="secondary-text">Failed to load prices</div>)}
          </div>  
        </>
      )}
    </div>
  );
};