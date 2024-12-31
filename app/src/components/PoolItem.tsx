import { FC, useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { getPoolPrice } from '../utils/getPoolPrice';
import { SwapForm } from './SwapForm';
import { DepositLiquidityForm } from './DepositLiquidityForm';

export interface PoolInfo {
  pubkey: string;
  amm: string;
  mintA: string;
  mintB: string;
}

interface PoolItemProps {
  pool: PoolInfo;
  onTxSuccess: (signature: string) => void;
}

export const PoolItem: FC<PoolItemProps> = ({ pool, onTxSuccess }) => {
  const { connection } = useConnection();
  const [activeForm, setActiveForm] = useState<'none' | 'deposit' | 'swap'>('none');
  const [prices, setPrices] = useState<PoolPrices | null>(null);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoadingPrices(true);
        const poolPrices = await getPoolPrice(connection, pool);
        setPrices(poolPrices);
      } catch (error) {
        console.error('Error fetching pool prices:', error);
      } finally {
        setIsLoadingPrices(false);
      }
    };

    fetchPrices();
  }, [pool, connection]);


  return (
    <div className="pool-item">
      <div className="pool-header">
        <h3>Pool Details</h3>
      </div>
      
      <div className="pool-details">
          <span className="pool-label">AMM Pubkey:</span>
          <span className="pool-value" title={pool.amm}>
            {pool.amm}
          </span>
        </div>

      <div className="pool-info">
        <div className="pool-details">
          <span className="pool-label">Pool Pubkey:</span>
          <span className="pool-value" title={pool.pubkey}>
            {pool.pubkey}
          </span>
        </div>

        <div className="pool-details">
          <span className="pool-label">Token A mint addr:</span>
          <span className="pool-value" title={pool.mintA}>
            {pool.mintA}
          </span>
        </div>

        <div className="pool-details">
          <span className="pool-label">Token B mint addr:</span>
          <span className="pool-value" title={pool.mintB}>
            {pool.mintB}
          </span>
        </div>
      </div>

      <div className="pool-price-info">
        <h4>Pool Liquidity & Prices</h4>
        {isLoadingPrices ? (
          <div className="loading-prices">Loading prices...</div>
        ) : prices ? (
          <>
            <div className="pool-details">
              <span className="pool-label">Token A Reserve:</span>
              <span className="pool-value">{prices.reserveA.toFixed(6)}</span>
            </div>
            <div className="pool-details">
              <span className="pool-label">Token B Reserve:</span>
              <span className="pool-value">{prices.reserveB.toFixed(6)}</span>
            </div>
            <div className="pool-details">
              <span className="pool-label">Price (A → B):</span>
              <span className="pool-value">1 A = {prices.aToB.toFixed(6)} B</span>
            </div>
            <div className="pool-details">
              <span className="pool-label">Price (B → A):</span>
              <span className="pool-value">1 B = {prices.bToA.toFixed(6)} A</span>
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
            }}
          />
        </div>
      )}
    </div>
  );
};