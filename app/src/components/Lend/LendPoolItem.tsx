import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { getPoolDetail, PoolDetailInfo } from '../../utils/getPoolDetail';
import { LendForm } from './LendForm';
import { RedeemForm } from './RedeemForm';
import { PublicKey } from '@solana/web3.js';
import '../../style/Theme.css';
import '../../style/Typography.css';
import { PoolStatus } from '../Farm/PoolStatus';
import { shouldInitializePool } from '../utils/pool';
import { useParams, useNavigate } from 'react-router-dom';
import { PriceDisplay } from '../utils/PriceDisplay';
import { TokenPairDisplay } from '../utils/TokenPairDisplay';
import { AddressLabel } from '../utils/AddressLabel';

export const LenderPoolItem: FC = () => {
  const { poolAddress } = useParams();
  const navigate = useNavigate();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { publicKey: walletPublicKey } = useWallet();
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
              <TokenPairDisplay poolInfo={details?.poolInfo || null} />
              <PriceDisplay 
                  aToB={details?.poolInfo.aToB || 0}
                  bToA={details?.poolInfo.bToA || 0}
                  tokenASymbol={details?.poolInfo.tokenASymbol || ''}
                  tokenBSymbol={details?.poolInfo.tokenBSymbol || ''}
                />
            </div>
            </div>
          </div>

          <div className="section">
            <div className="step">
              <div className="info-row">
                <AddressLabel 
                  label="TokenA Address"
                  address={details?.poolInfo.mintA.toString()}
                />
                <AddressLabel 
                  label="TokenB Address"
                  address={details?.poolInfo.mintB.toString()}
                />
              </div>
              <div className="info-row">
                <AddressLabel 
                  label="Lending Pool TokenA Amount"
                  address={details?.lendingPoolInfo.tokenAAmount.toFixed(6)}
                />
                <AddressLabel 
                  label="Lending Pool TokenB Amount"
                  address={details?.lendingPoolInfo.tokenBAmount.toFixed(6)}
                />
              </div>
              <div className="info-row">
                <AddressLabel 
                  label="Loaned TokenA Amount"
                  address={details?.lendingPoolInfo.borrowReceiptSupply.toFixed(6)}
                />
                <AddressLabel 
                  label="Collateral TokenB Amount"
                  address={details?.lendingPoolInfo.collateralReceiptSupply.toFixed(6)}
                />
              </div>
              <div className="note-text">
                Note: Profit sharing is based on time and capital contribution among lenders.
              </div>
              <div className="note-text">
                Lent funds in the lending pool earn 0.05% profit per block, paid from borrowers' collateral.
              </div>
              <div className="note-text">
                In case of mass liquidation events, lenders may not recover their full assets but receive a combination of lent assets and borrower collateral. Withdrawals follow a first-come-first-served principle.
              </div>
            </div>
          </div>
      
          {isLoadingDetails ? (<div className="loading-spinner"></div>) : details ? (
            <div className="section">
              <div className="step">
                <div className="info-row">
                    <AddressLabel 
                      label="Your TokenA Balance"
                      address={details?.userAssets.tokenAAmount}
                    />
                    <AddressLabel 
                      label="You have lent tokenA"
                      address={details.userAssets.lendingReceiptAmount}
                    />
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