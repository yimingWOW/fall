import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { borrow } from '../../utils/borrow';
import BN from 'bn.js';
import { PoolInfo } from '../../utils/getPoolList';
import { PoolDetailInfo } from '../../utils/getPoolDetail';
import { BASE_RATE, MIN_COLLATERAL_RATIO } from '../../utils/constants';
import '../../style/Theme.css';
import '../../style/Typography.css';

interface BorrowFormProps {
  pool: PoolInfo;
  details: PoolDetailInfo;
  onSuccess: (signature: string) => void;
}

export const BorrowForm: FC<BorrowFormProps> = ({ pool, details, onSuccess }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [borrowAmount, setBorrowAmount] = useState("");

  const maxBorrowAmount = Number(details.userAssets.collateralReceiptAmount) * details.poolInfo.bToA/MIN_COLLATERAL_RATIO*BASE_RATE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!wallet) {
      setError("Please connect your wallet first");
      setIsLoading(false);
      return;
    }

    try {
      const borrowAmountNum = parseFloat(borrowAmount);
      if (isNaN(borrowAmountNum) || borrowAmountNum <= 0) {
        throw new Error("Invalid borrow amount");
      }

      if (borrowAmountNum > maxBorrowAmount) {
        throw new Error("Amount exceeds maximum borrowable amount");
      }

      const poolPubkey = new PublicKey(pool.poolPk);
      const mintAPubkey = new PublicKey(pool.mintA);
      const mintBPubkey = new PublicKey(pool.mintB);

      const signature = await borrow(
        wallet,
        connection,
        poolPubkey,
        mintAPubkey,
        mintBPubkey,
        new BN(borrowAmountNum),
      );
      
      console.log(`Transaction URL: https://explorer.solana.com/tx/${signature}`);
      setBorrowAmount("");
      onSuccess(signature);
    } catch (err) {
      console.error("Error borrowing:", err);
      setError(err instanceof Error ? err.message : "Failed to borrow");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <h3 className="section-title">Borrow Token</h3>
      {error && (<div className="secondary-text" style={{ color: 'var(--error)' }}>{error}</div>)}
      <form onSubmit={handleSubmit}>
        <div className="card-container">
          <input
            className="input"
            type="number"
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(e.target.value)}
            placeholder={`Enter amount (max: ${maxBorrowAmount.toFixed(6)})`}
            required
            min="0"
            max={maxBorrowAmount}
            step="any"
            disabled={isLoading}
          />
        </div>

        <div className="align-center">
          <button 
            type="submit" 
            className="button btn-primary"
            disabled={isLoading || !wallet}
          >
            {isLoading ? 'Processing...' : 'Borrow'}
          </button>
        </div>
      </form>
    </div>
  );
};