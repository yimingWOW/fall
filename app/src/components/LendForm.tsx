import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { lend } from '../utils/lend';
import BN from 'bn.js';
import { PoolInfo } from '../utils/getPoolList';
import '../style/LendForm.css';

interface LendFormProps {
  pool: PoolInfo;
  onSuccess: (signature: string) => void;
}

export const LendForm: FC<LendFormProps> = ({ pool, onSuccess }) => {
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
      const poolPubkey = new PublicKey(pool.pubkey);
      const signature = await lend(
        wallet,
        connection,
        poolPubkey,
        new BN(lendAmount)
      );
      
      console.log(`Transaction URL: https://explorer.solana.com/tx/${signature.tx}`);
      setAmount(""); // 重置表单
      onSuccess(signature.tx);
    } catch (err) {
      console.error("Error lending:", err);
      setError(err instanceof Error ? err.message : "Failed to lend");
    } finally {
      setIsLoading(false);
    }
  };

  console.log(pool);
  return (
    <div className="form-wrapper">
      <h3>Lend TokenA</h3>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Token A Amount to Lend:</label>
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