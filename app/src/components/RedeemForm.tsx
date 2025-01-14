import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { redeem } from '../utils/redeem';
import { PoolInfo } from '../utils/getPoolList';

interface RedeemFormProps {
  pool: PoolInfo;
  onSuccess: (signature: string) => void;
}

export const RedeemForm: FC<RedeemFormProps> = ({ pool, onSuccess }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

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
      // 从 lendingPool 对象获取必要的公钥
      const poolPubkey = new PublicKey(pool.pubkey);

      const signature = await redeem(
        wallet,
        connection,
        poolPubkey,
      );
      
      console.log(`Transaction URL: https://explorer.solana.com/tx/${signature}`);
      onSuccess(signature);
    } catch (err) {
      console.error("Error redeeming:", err);
      setError(err instanceof Error ? err.message : "Failed to redeem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-wrapper">
      <h3>Redeem Tokens</h3>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="warning-message">
          Note: This will redeem all your lending receipt and return your tokenA.
        </div>
        <button 
          type="submit" 
          className="action-button"
          disabled={isLoading || !wallet}
        >
          {isLoading ? 'Processing...' : 'Confirm Redeem'}
        </button>
      </form>
    </div>
  );
};