import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { createAmm } from '../../utils/createAmm';
import '../../style/Theme.css';
import '../../style/Typography.css';

export const CreateAmmForm: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [error, setError] = useState<string>("");
  const [fee, setFee] = useState<string>("500"); // 设置默认值为 500 (5%)
  const [isLoading, setIsLoading] = useState(false);
  const [lastCreatedAmmId, setLastCreatedAmmId] = useState<string>("");

  const handleCreateAmm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!wallet) {
      setError("Please connect your wallet first");
      setIsLoading(false);
      return;
    }

    const feeNumber = Number(fee);
    if (feeNumber < 1 || feeNumber > 10000) {
      setError("Fee must be between 1 and 10000");
      setIsLoading(false);
      return;
    }

    try {
      const ammId = PublicKey.unique();
      
      const signature = await createAmm(
        wallet,
        connection,
        ammId,
      );
      
      console.log(`Transaction URL: https://explorer.solana.com/tx/${signature}`);
      setLastCreatedAmmId(ammId.toString());
      setFee("500"); // 重置为默认值，而不是空字符串
    } catch (err) {
      console.error("Error creating AMM:", err);
      setError(err instanceof Error ? err.message : "Failed to create AMM. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-amm-container">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      {lastCreatedAmmId && (
        <div className="success-message">
          AMM created successfully! ID: {lastCreatedAmmId}
        </div>
      )}
      <form onSubmit={handleCreateAmm} className="form">
        <button 
          type="submit" 
          className="button btn-primary"
          disabled={isLoading || !wallet}
        >
          {isLoading ? 'Creating...' : 'Create AMM'}
        </button>
      </form>
    </div>
  );
};