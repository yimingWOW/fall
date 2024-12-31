import { FC, useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { getLendingPoolDetails } from '../utils/getLendingPoolDetails';
import { PublicKey } from '@solana/web3.js';
import { LendForm } from './LendForm';
import { RedeemForm } from './RedeemForm';
import { BorrowForm } from './BorrowForm.tsx';
import { RepayForm } from './RepayForm.tsx';
import { useWallet } from '@solana/wallet-adapter-react';

// types/lending.ts
export interface LendingPoolInfo {
  pubkey: string;      // Lending Pool ID
  pool: string;        // Pool ID
  mintA: string;       // Token A Mint Address
  mintB: string;       // Token B Mint Address
  lendingReceipt: string;
  borrowReceipt: string;
  collateralReceipt: string;
  minCollateralRatio: number;
  baseRate: number;
  borrowInterest: number;
}

interface LendingPoolDetails {
  tokenAAmount: number;
  tokenBAmount: number;
  lendingReceiptSupply: number;
  borrowReceiptSupply: number;
  collateralReceiptSupply: number;
  addresses: {
    lendingReceipt: string;
    borrowReceipt: string;
    collateralReceipt: string;
    lendingPoolAuthority: string;
  };
  userAssets: {
    tokenAAmount: string;
    tokenBAmount: string;
    lendingReceiptAmount: string;
    borrowReceiptAmount: string;
    collateralReceiptAmount: string;
  };
}

interface LendingPoolItemProps {
  lendingPool: LendingPoolInfo;
  onTxSuccess: (signature: string) => void;
}

export const LendingPoolItem: FC<LendingPoolItemProps> = ({ lendingPool, onTxSuccess }) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [activeForm, setActiveForm] = useState<'none' | 'borrow' | 'lend'>('none');
  const [details, setDetails] = useState<LendingPoolDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      const result = await getLendingPoolDetails(connection, {
        pool: lendingPool.pool,
        mintA: lendingPool.mintA,
        mintB: lendingPool.mintB,
      },
      publicKey as PublicKey,
    );
      setDetails(result);
    } catch (error) {
      console.error('Error fetching lending pool details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [lendingPool, connection]);

  return (
    <div className="lending-pool-item">
      <div className="pool-info-grid">
        {/* 基本信息 */}
        <div className="info-section">
          <h4>Basic Information</h4>

          <div className="info-row">
            <span className="info-label">Pool Pubkey:</span>
            <span className="info-value" title={lendingPool.pubkey}>
              {`${lendingPool.pubkey.slice(0, 4)}...${lendingPool.pubkey.slice(-4)}`}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">Liquidity Pool:</span>
            <span className="info-value" title={lendingPool.pool}>
              {`${lendingPool.pool.slice(0, 4)}...${lendingPool.pool.slice(-4)}`}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">mintA addr:</span>
            <span className="info-value" title={lendingPool.mintA}>
              {`${lendingPool.mintA.slice(0, 4)}...${lendingPool.mintA.slice(-4)}`}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">mintB addr:</span>
            <span className="info-value" title={lendingPool.mintB}>
              {`${lendingPool.mintB.slice(0, 4)}...${lendingPool.mintB.slice(-4)}`}
            </span>
          </div>

        </div>

        {/* 参数信息 */}
        <div className="info-section">
          <h4>Pool Parameters</h4>
          <div className="info-row">
            <span className="info-label">Min Collateral Ratio:</span>
            <span className="info-value">
              {(lendingPool.minCollateralRatio / 100).toFixed(2)}%
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Base Rate:</span>
            <span className="info-value">
              {(lendingPool.baseRate / 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* 实时数据 */}
        {isLoading ? (
          <div className="info-section">
            <h4>Loading...</h4>
          </div>
        ) : details ? (
          <div className="info-section">
            <h4>Current Status</h4>
            <div className="info-row">
              <span className="info-label">Token A Balance:</span>
              <span className="info-value">
                {details.tokenAAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6
                })}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Token B Balance:</span>
              <span className="info-value">
                {details.tokenBAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6
                })}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Lending Receipts:</span>
              <span className="info-value">
                {details.lendingReceiptSupply.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6
                })}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Borrow Receipts:</span>
              <span className="info-value">
                {details.borrowReceiptSupply.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6
                })}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Collateral Receipts:</span>
              <span className="info-value">
                {details.collateralReceiptSupply.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6
                })}
              </span>
            </div>

          </div>
        ) : null}
      

        {/* 实时数据 */}
          {isLoading ? (
          <div className="info-section">
            <h4>Loading...</h4>
          </div>
        ) : details ? (
          <div className="info-section">
            <h4>User Assets</h4>

            <div className="info-row">
              <span className="info-label">User Token A Amount:</span>
              <span className="info-value">
                {details.userAssets.tokenAAmount}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">User Token B Amount:</span>
              <span className="info-value">
                {details.userAssets.tokenBAmount}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">User Lending Receipt Amount:</span>
              <span className="info-value">
                {details.userAssets.lendingReceiptAmount}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">User Borrow Receipt Amount:</span>
              <span className="info-value">
                {details.userAssets.borrowReceiptAmount}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">User Collateral Receipt Amount:</span>
              <span className="info-value">
                {details.userAssets.collateralReceiptAmount}
              </span>
            </div>

          </div>
        ) : null}
      </div>

      <div className="pool-actions">
        <div className="action-buttons">
          <button 
            className="action-button"
            onClick={() => setActiveForm(activeForm === 'lend' ? 'none' : 'lend')}
          >
            {activeForm === 'lend' ? 'Hide Lend' : 'Lend'}
          </button>

          <button 
            className="action-button"
            onClick={() => setActiveForm(activeForm === 'redeem' ? 'none' : 'redeem')}
          >
            {activeForm === 'redeem' ? 'Hide Redeem' : 'Redeem'}
          </button>

          <button 
            className="action-button"
            onClick={() => setActiveForm(activeForm === 'borrow' ? 'none' : 'borrow')}
          >
            {activeForm === 'borrow' ? 'Hide Borrow' : 'Borrow'}
          </button>

          <button 
            className="action-button"
            onClick={() => setActiveForm(activeForm === 'repay' ? 'none' : 'repay')}
          >
            {activeForm === 'repay' ? 'Hide Repay' : 'Repay'}
          </button>

        </div>

        <button 
          className="refresh-button"
          onClick={fetchDetails}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Forms */}
      {activeForm === 'lend' && (
        <div className="form-container">
          <LendForm 
            lendingPool={lendingPool}
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
            lendingPool={lendingPool}
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
            lendingPool={lendingPool}
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
            lendingPool={lendingPool}
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