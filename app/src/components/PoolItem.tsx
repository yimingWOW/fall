import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getPoolDetail, PoolDetailInfo } from '../utils/getPoolDetail';
import { SwapForm } from './SwapForm';
import { DepositLiquidityForm } from './DepositLiquidityForm';
import { InitPoolForm } from './InitPoolForm';
import { PoolInfo } from '../utils/getPoolList';
import { PublicKey } from '@solana/web3.js';
interface PoolItemProps {
  pool: PoolInfo;
  onTxSuccess: (signature: string) => void;
}

export const PoolItem: FC<PoolItemProps> = ({ pool, onTxSuccess }) => {
  const { connection } = useConnection();
  const { publicKey: walletPublicKey } = useWallet();
  const [activeForm, setActiveForm] = useState<'none' | 'initPool' | 'deposit' | 'swap'>('none');
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

    </div>
  );
};