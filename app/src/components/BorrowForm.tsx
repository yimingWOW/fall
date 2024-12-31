import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { borrow } from '../utils/borrow';
import BN from 'bn.js';
import { LendingPoolInfo } from './LendingPoolItem';

interface BorrowFormProps {
  lendingPool: LendingPoolInfo;
  onSuccess: (signature: string) => void;
}

export const BorrowForm: FC<BorrowFormProps> = ({ lendingPool, onSuccess }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [borrowAmount, setBorrowAmount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");

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
      // 验证金额
      const borrowAmountNum = parseFloat(borrowAmount);
      const collateralAmountNum = parseFloat(collateralAmount);
      
      if (isNaN(borrowAmountNum) || borrowAmountNum <= 0) {
        throw new Error("Invalid borrow amount");
      }
      if (isNaN(collateralAmountNum) || collateralAmountNum <= 0) {
        throw new Error("Invalid collateral amount");
      }

      // 从 lendingPool 对象获取必要的公钥
      const poolPubkey = new PublicKey(lendingPool.pool);
      const mintAPubkey = new PublicKey(lendingPool.mintA);
      const mintBPubkey = new PublicKey(lendingPool.mintB);

      const signature = await borrow(
        wallet,
        connection,
        poolPubkey,
        mintAPubkey,
        mintBPubkey,
        new BN(borrowAmountNum ), // 转换为 lamports
        new BN(collateralAmountNum )
      );
      
      console.log(`Transaction URL: https://explorer.solana.com/tx/${signature}`);
      setBorrowAmount(""); // 重置表单
      setCollateralAmount("");
      onSuccess(signature);
    } catch (err) {
      console.error("Error borrowing:", err);
      setError(err instanceof Error ? err.message : "Failed to borrow");
    } finally {
      setIsLoading(false);
    }
  };

  const minCollateralRatio = (lendingPool.minCollateralRatio / 100).toFixed(2);

  return (
    <div className="form-wrapper">
      <h3>Borrow Tokens</h3>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Amount to Borrow (Token A):</label>
          <input
            type="number"
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(e.target.value)}
            placeholder="Enter amount to borrow"
            required
            min="0"
            step="any"
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label>Collateral Amount (Token B):</label>
          <input
            type="number"
            value={collateralAmount}
            onChange={(e) => setCollateralAmount(e.target.value)}
            placeholder="Enter collateral amount"
            required
            min="0"
            step="any"
            disabled={isLoading}
          />
        </div>
        <div className="lending-pool-info-summary">
          <div>Pool: {lendingPool.pool.slice(0, 4)}...{lendingPool.pool.slice(-4)}</div>
          <div>Token A (Borrow): {lendingPool.mintA.slice(0, 4)}...{lendingPool.mintA.slice(-4)}</div>
          <div>Token B (Collateral): {lendingPool.mintB.slice(0, 4)}...{lendingPool.mintB.slice(-4)}</div>
          <div>Min Collateral Ratio: {minCollateralRatio}%</div>
          <div>Base Rate: {(lendingPool.baseRate / 100).toFixed(2)}%</div>
        </div>
        <div className="warning-message">
          Note: Please ensure you provide sufficient collateral based on the minimum collateral ratio.
        </div>
        <button 
          type="submit" 
          className="action-button"
          disabled={isLoading || !wallet}
        >
          {isLoading ? 'Processing...' : 'Confirm Borrow'}
        </button>
      </form>
    </div>
  );
};