import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { getPoolDetail, PoolDetailInfo } from '../../utils/getPoolDetail';
import { LendForm } from './LendForm';
import { RedeemForm } from './RedeemForm';
import { PublicKey } from '@solana/web3.js';
import '../../style/Theme.css';
import '../../style/Typography.css';
import { shortenAddress } from '../../utils/string';
import defaultTokenIcon from '../../assets/default-token.png';
import { PoolStatus } from '../Farm/PoolStatus';
import { shouldInitializePool } from '../utils/pool';
import { CopyableAddress } from '../utils/copyableaddress';
import { useParams, useNavigate } from 'react-router-dom';

export const LenderPoolItem: FC = () => {
  const { poolAddress } = useParams();
  const navigate = useNavigate();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { publicKey: walletPublicKey } = useWallet();
  const [details, setDetails] = useState<PoolDetailInfo | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isPriceReversed, setIsPriceReversed] = useState(false);
   
  console.log("poolAddress", poolAddress);

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
          onClick={() => navigate('/lend')}
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
          {!isPriceReversed ? (<span className="code-text">1 A = {details?.poolInfo.aToB.toFixed(6)} B</span>
          ) : (<span className="code-text">1 B = {details?.poolInfo.bToA.toFixed(6)} A</span>)}
          <div className="body-text">
            <button className="swap-direction-toggle" onClick={() => setIsPriceReversed(!isPriceReversed)}/>
          </div>
        </div>
        </div>
      </div>

      <div className="section">
        <div className="step">
          <div className="info-row">
            <span className="body-text">TokenA Address:</span>
            <span className="code-text">{shortenAddress(details?.poolInfo.mintA.toString() || '')}</span>
            <span className="body-text">TokenB Address:</span>
            <span className="code-text">{shortenAddress(details?.poolInfo.mintB.toString() || '')}</span>
          </div>
          <div className="info-row">
            <span className="body-text">Pool TokenA Amount:</span>
            <span className="code-text">{details?.lendingPoolInfo.tokenAAmount.toFixed(6)}</span>
            <span className="body-text">Pool TokenB Amount:</span>
            <span className="code-text">{details?.lendingPoolInfo.tokenBAmount.toFixed(6)}</span>
          </div>
        </div>
      </div>
      
      {isLoadingDetails ? (<div className="loading-spinner"></div>) : details ? (
        <div className="section">
          <div className="step">
            <div className="info-row">
              <span className="body-text">Your TokenA Balance:</span>
              <span className="code-text">{details?.userAssets.tokenAAmount}</span>
              <span className="body-text">You have lent tokenA:</span>
              <span className="code-text">{details.userAssets.lendingReceiptAmount}</span>
            </div>
          </div>
          {Number(details.userAssets.lendingReceiptAmount) === 0 ? (
            <div className="step">
            <LendForm pool={details?.poolInfo}onSuccess={() => {fetchDetails();}}/>
            </div>
          ) : (
            <div className="step">
            <RedeemForm pool={details?.poolInfo}onSuccess={() => {fetchDetails();}}/>
            </div>
          )}
        </div>
      ) : (
        <div className="secondary-text">Failed to load credit pool details</div>
      )}
    </> 
  )}
  </div>
  );
};