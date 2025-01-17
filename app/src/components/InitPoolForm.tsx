import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { createCreditPool } from '../utils/createCreditPool';
import { PoolInfo } from '../utils/getPoolList';
import '../style/InitPoolForm.css';

interface InitPoolFormProps {
  pool: PoolInfo;
  onSuccess: (signature: string) => void;
}

export const InitPoolForm: FC<InitPoolFormProps> = ({ pool, onSuccess }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInitPool = async () => {
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

      const signature = await createCreditPool(
        wallet,
        connection,
        poolPubkey,
        mintAPubkey,
        mintBPubkey
      );
      
      console.log(`Transaction URL: https://explorer.solana.com/tx/${signature}`);
      if (onSuccess) {
        onSuccess(signature.toString());
      }
    } catch (err) {
      console.error("Error initializing pool:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize pool");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card gradient-border">
      <h2 className="section-title">Initialize Pool</h2>
      {error && (
        <div className="code-text" style={{ color: 'var(--error)' }}>
          {error}
        </div>
      )}
      <button 
        onClick={handleInitPool}
        className="btn btn-primary"
        disabled={isLoading || !wallet}
      >
        <span className="code-text">
          {isLoading ? 'Initializing...' : 'Initialize Pool'}
        </span>
      </button>
    </div>
  );
};