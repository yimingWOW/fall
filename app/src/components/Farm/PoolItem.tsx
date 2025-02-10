import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { getPoolDetail, PoolDetailInfo } from '../../utils/getPoolDetail';
import { DepositLiquidityForm } from './DepositLiquidityForm';
import { PublicKey } from '@solana/web3.js';
import '../../style/Theme.css';
import { WithdrawLiquidityForm } from './WithdrawLiquidityForm';
import { PoolStatus } from './PoolStatus';
import { shouldInitializePool } from '../utils/pool';
import '../../style/button.css';
import '../../style/Typography.css';
import { useParams, useNavigate } from 'react-router-dom';
import { PriceDisplay } from '../utils/PriceDisplay';

export const PoolItem: FC = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { poolAddress } = useParams();
  const navigate = useNavigate();
  const { publicKey: walletPublicKey } = useWallet();
  const [details, setDetails] = useState<PoolDetailInfo | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchDetails = async () => {
    try {
      if (!wallet) return;
      setIsLoadingDetails(true);
      const poolDetail = await getPoolDetail(
        wallet,
        connection, 
        new PublicKey(poolAddress || ''),
        walletPublicKey || new PublicKey('')
      );
      setDetails(poolDetail);
    } catch (error) {
      console.error('Error fetchDetails', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };
  
  useEffect(() => {
    fetchDetails();
  }, [poolAddress, connection, walletPublicKey]);

  return (
    <div className="card-container">
      <div className="back-button-container">
        <button 
          className="button btn-primary"
          onClick={() => navigate('/farm')}
          style={{ marginBottom: 'var(--spacing-md)' }}
        >
          Back
        </button>
      </div>
      {shouldInitializePool(details?.poolStatus || null) ? (
        <div className="section">
          <PoolStatus
            pool={details?.poolInfo || null}
            poolStatus={details?.poolStatus || null}
            onTxSuccess={fetchDetails}
          />
        </div>
      ) : (
        <div className="section">
          {isLoadingDetails ? (
            <div className="step">
              <div className="code-text">Loading prices...</div>
            </div>
          ) : details ? (
              <>                
              <div className="align-center">
                <div className="step" >
                  <div className="info-row">
                    <PriceDisplay 
                      aToB={details.poolInfo.aToB}
                      bToA={details.poolInfo.bToA}
                      tokenASymbol={details.poolInfo.tokenASymbol}
                      tokenBSymbol={details.poolInfo.tokenBSymbol}
                    />
                    <span className="body-text">Pool TokenA Amount:</span>
                    <span className="code-text">{details?.poolInfo.tokenAAmount.toFixed(6)}</span>
                    <span className="body-text">Pool TokenB Amount:</span>
                    <span className="code-text">{details?.poolInfo.tokenBAmount.toFixed(6)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="step">
              <div className="code-text" style={{ color: 'var(--error)' }}>
                Failed to load prices
              </div>
            </div>
          )}
          <DepositLiquidityForm 
            pool={details?.poolInfo || null}
            onSuccess={fetchDetails}
          />
          <div className="wrapper"></div>
            {isLoadingDetails ? (
              <div className="loading-state">
                <div className="code-text">Loading your liquidity amount...</div>
              </div>
            ) : details ? (
              <WithdrawLiquidityForm
                pool={details?.poolInfo || null}
                amount={parseFloat(details.userAssets.liquidityAmount)}
                onSuccess={fetchDetails}
              />
            ) : (
              <div className="error-state">
                <div className="code-text">Failed to load your liquidity amount</div>
              </div>
            )}
            {walletPublicKey?.toBase58() == details?.poolInfo.admin.toString() && (
              <div className="step">
                <div className="info-row">
                  <div className="body-text">You are the admin of this pool</div>
                  <div className="code-text">You have {details?.poolInfo.adminFeeAmount} admin fee</div>
                </div>
              </div>
            )}
          </div>
      )}
    </div>
  );
};