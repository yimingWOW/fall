import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { initPool } from '../utils/initPool';
import { useAmm } from '../contexts/AmmContext';
import { PoolInfo } from '../utils/getPoolList';

interface InitPoolFormProps {
  pool: PoolInfo;
  onSuccess: (signature: string) => void;
}

export const InitPoolForm: FC<InitPoolFormProps> = ({ pool, onSuccess }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const { amm } = useAmm();
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

    if (!amm) {
      setError("Please select an AMM first");
      setIsLoading(false);
      return;
    }

    try {
      const poolPubkey = new PublicKey(pool.pubkey);
      const mintAPubkey = new PublicKey(pool.mintA);
      const mintBPubkey = new PublicKey(pool.mintB);

      const signature = await initPool(
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
    <div className="init-pool-container">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <button 
        onClick={handleInitPool}
        className="submit-button"
        disabled={isLoading || !wallet}
      >
        {isLoading ? 'Initializing...' : 'Initialize Pool'}
      </button>
    </div>
  );
};