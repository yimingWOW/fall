import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { borrow } from '../utils/borrow';
import BN from 'bn.js';
import { PoolInfo } from '../utils/getPoolList';

interface BorrowFormProps {
  pool: PoolInfo;
  onSuccess: (signature: string) => void;
}

export const BorrowForm: FC<BorrowFormProps> = ({ pool, onSuccess }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [borrowAmount, setBorrowAmount] = useState("");

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
      if (isNaN(borrowAmountNum) || borrowAmountNum <= 0) {
        throw new Error("Invalid borrow amount");
      }

      // 从 lendingPool 对象获取必要的公钥
      const poolPubkey = new PublicKey(pool.pubkey);
      const mintAPubkey = new PublicKey(pool.mintA);
      const mintBPubkey = new PublicKey(pool.mintB);

      const signature = await borrow(
        wallet,
        connection,
        poolPubkey,
        mintAPubkey,
        mintBPubkey,
        new BN(borrowAmountNum ), // 转换为 lamports
      );
      
      console.log(`Transaction URL: https://explorer.solana.com/tx/${signature}`);
      setBorrowAmount(""); // 重置表单
      onSuccess(signature);
    } catch (err) {
      console.error("Error borrowing:", err);
      setError(err instanceof Error ? err.message : "Failed to borrow");
    } finally {
      setIsLoading(false);
    }
  };

  const minCollateralRatio = (pool.minCollateralRatio / 100).toFixed(2);

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
        <div className="lending-pool-info-summary">
          <div>Pool: {pool.pubkey.toString().slice(0, 4)}...{pool.pubkey.toString().slice(-4)}</div>
          <div>Token A (Borrow): {pool.mintA.toString().slice(0, 4)}...{pool.mintA.toString().slice(-4)}</div>
          <div>Token B (Collateral): {pool.mintB.toString().slice(0, 4)}...{pool.mintB.toString().slice(-4)}</div>
          <div>Min Collateral Ratio: {minCollateralRatio}%</div>
          <div>Base Rate: {(pool.fee / 100).toFixed(2)}%</div>
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