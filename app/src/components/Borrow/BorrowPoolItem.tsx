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
import { CopyableAddress } from '../utils/copyableaddress';
import defaultTokenIcon from '../../assets/default-token.png';
import { shouldInitializePool } from '../utils/pool';
import { useParams, useNavigate } from 'react-router-dom';

export const BorrowerPoolItem: FC = () => {
  const { connection } = useConnection();
  const { publicKey: walletPublicKey } = useWallet();
  const { poolAddress } = useParams();
  const wallet = useAnchorWallet();
  const navigate = useNavigate();
  const [details, setDetails] = useState<PoolDetailInfo | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isPriceReversed, setIsPriceReversed] = useState(false);

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
                      <div className="token-pair-container">
                        <img 
                          src={details?.poolInfo.tokenAIcon || defaultTokenIcon} 
                          alt={details?.poolInfo.tokenASymbol || 'Token A'} 
                          className="token-icon"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = defaultTokenIcon;
                          }}
                        />
                        <img 
                          src={details?.poolInfo.tokenBIcon || defaultTokenIcon} 
                          alt={details?.poolInfo.tokenBSymbol || 'Token B'} 
                          className="token-icon"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = defaultTokenIcon;
                          }}
                        />
                      </div>
                      <span className="body-text">Pool Address:</span>
                      <CopyableAddress address={poolAddress || ''} />
                      <span className="body-text">Price</span>
                      <span className="body-text">Price</span>
                      {!isPriceReversed ? (<span className="code-text">1 A = {details.poolInfo.aToB.toFixed(6)} B</span>
                      ) : (<span className="code-text">1 B = {details.poolInfo.bToA.toFixed(6)} A</span>)}
                      <div className="body-text">
                        <button className="swap-direction-toggle" onClick={() => setIsPriceReversed(!isPriceReversed)}/>
                      </div>
                  </div>
                  </div>
                  <div className="step">
                    <div className="info-row">
                    <span className="body-text">Current Collateral Ratio(Min: {MIN_COLLATERAL_RATIO/BASE_RATE*100}%)</span>
                      <span className="code-text">{Number(details.userAssets.borrowReceiptAmount)*details.poolInfo.aToB /Number(details.userAssets.collateralReceiptAmount)*100}%</span>
                      <span className="body-text">Available TokenA Amount</span>
                      <span className="code-text">{details.lendingPoolInfo.tokenAAmount.toFixed(6)}</span>
                    </div>
                  </div>
                  <div className="step">
                    <div className="info-row">
                      <span className="body-text">You have borrowed tokenA</span>
                      <span className="code-text">{details.userAssets.borrowReceiptAmount}</span>
                      <span className="body-text">You have collateral tokenB</span>
                      <span className="code-text">{details.userAssets.collateralReceiptAmount}</span>                    </div>
                    <div className="note-text" style={{ marginBottom: 'var(--spacing-md)' }}>
                      Note: Please ensure you provide sufficient collateral based on the minimum collateral ratio.
                    </div>
                  </div>
                </div>
                <div className="step">
                  <div className="info-row">
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