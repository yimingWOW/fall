import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { repay } from '../../utils/repay';
import { PoolInfo } from '../../utils/getPoolList';
import '../../style/Theme.css';
import '../../style/Typography.css';

interface RepayFormProps {
  pool: PoolInfo;
  onSuccess: (signature: string) => void;
}

export const RepayForm: FC<RepayFormProps> = ({ pool, onSuccess }) => {
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
      const poolPubkey = new PublicKey(pool.poolPk);
      const mintAPubkey = new PublicKey(pool.mintA);
      const mintBPubkey = new PublicKey(pool.mintB);
      const signature = await repay(
        wallet,
        connection,
        poolPubkey,
        mintAPubkey,
        mintBPubkey,
      );
      console.log(`Transaction URL: https://explorer.solana.com/tx/${signature}`);
      onSuccess(signature);
    } catch (err) {
      console.error("Error repaying:", err);
      setError(err instanceof Error ? err.message : "Failed to repay");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <h3 className="section-title">Repay your loan and withdraw collateral</h3>
      {error && (
        <div className="secondary-text" style={{ color: 'var(--error)' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="align-center">
          <button 
            type="submit" 
            className="button btn-primary"
            disabled={isLoading || !wallet}
          >
            {isLoading ? 'Processing...' : 'Repay'}
          </button>
        </div>
      </form>
    </div>
  );
};