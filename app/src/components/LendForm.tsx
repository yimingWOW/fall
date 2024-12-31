import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { lend } from '../utils/lend';
import BN from 'bn.js';
import { LendingPoolInfo } from './LendingPoolItem';


interface LendFormProps {
  lendingPool: LendingPoolInfo;
  onSuccess: (signature: string) => void;
}

export const LendForm: FC<LendFormProps> = ({ lendingPool, onSuccess }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");

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
      const lendAmount = parseFloat(amount);
      if (isNaN(lendAmount) || lendAmount <= 0) {
        throw new Error("Invalid amount");
      }

      // 从 lendingPool 对象获取必要的公钥
      const poolPubkey = new PublicKey(lendingPool.pool);
      const mintAPubkey = new PublicKey(lendingPool.mintA);
      const mintBPubkey = new PublicKey(lendingPool.mintB);

      const signature = await lend(
        wallet,
        connection,
        poolPubkey,
        mintAPubkey,
        mintBPubkey,
        new BN(lendAmount)
      );
      
      console.log(`Transaction URL: https://explorer.solana.com/tx/${signature}`);
      setAmount(""); // 重置表单
      onSuccess(signature);
    } catch (err) {
      console.error("Error lending:", err);
      setError(err instanceof Error ? err.message : "Failed to lend");
    } finally {
      setIsLoading(false);
    }
  };

  console.log(lendingPool);
  return (
    <div className="form-wrapper">
      <h3>Lend Tokens</h3>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Amount to Lend:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount to lend"
            required
            min="0"
            step="any"
            disabled={isLoading}
          />
        </div>
        <div className="lendingPool-info-summary">
          <div>Pool: {lendingPool.pool.slice(0, 4)}...{lendingPool.pool.slice(-4)}</div>
          <div>Token A: {lendingPool.mintA.slice(0, 4)}...{lendingPool.mintA.slice(-4)}</div>
          <div>Token B: {lendingPool.mintB.slice(0, 4)}...{lendingPool.mintB.slice(-4)}</div>
        </div>
        <button 
          type="submit" 
          className="action-button"
          disabled={isLoading || !wallet}
        >
          {isLoading ? 'Processing...' : 'Confirm Lend'}
        </button>
      </form>
    </div>
  );
};