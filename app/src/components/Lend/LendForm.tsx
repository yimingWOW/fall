import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { lend } from '../../utils/lend';
import BN from 'bn.js';
import { PoolInfo } from '../../utils/getPoolList';
import '../../style/Theme.css';
import '../../style/Typography.css';

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

    if (!wallet) {34  
      setError("Please connect your wallet first");
      setIsLoading(false);
      return;
    }

    try {
      const lendAmount = parseFloat(amount);
      if (isNaN(lendAmount) || lendAmount <= 0) {
        throw new Error("Invalid amount");
      }

      const poolPubkey = new PublicKey(pool.poolPk);
      const signature = await lend(
        wallet,
        connection,
        poolPubkey,
        new BN(lendAmount)
      );
      
      console.log(`Transaction URL: https://explorer.solana.com/tx/${signature.tx}`);
      setAmount("");
      onSuccess(signature.tx);
    } catch (err) {
      console.error("Error lending:", err);
      setError(err instanceof Error ? err.message : "Failed to lend");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <form onSubmit={handleSubmit}>
        <div className="wrapper-container">
          <div className="wrapper-header">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>
          <div className="wrapper-box">
            <input
              className="input"
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
          <div className="align-center">
            <button 
              type="submit" 
              className="button btn-primary"
              disabled={isLoading || !wallet}
              >
              {isLoading ? 'Processing...' : 'Confirm Lend'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};