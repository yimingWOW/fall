import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { wrapSol } from '../../utils/wrapSol';
import '../../style/Theme.css';
import '../../style/Typography.css';

interface WrapSolFormProps {
  onSuccess: (signature: string) => void;
}

export const WrapSolForm: FC<WrapSolFormProps> = ({ onSuccess }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!wallet) {
      setError("Please connect your wallet first");
      setIsLoading(false);
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      setIsLoading(false);
      return;
    }

    try {
      const signature = await wrapSol(
        connection,
        wallet,
        Number(amount)
      );
      console.log(`Transaction URL: https://explorer.solana.com/tx/${signature}`);
      onSuccess(signature);
      setAmount(""); // Reset form after success
    } catch (err) {
      console.error("Error wrapping SOL:", err);
      setError(err instanceof Error ? err.message : "Failed to wrap SOL");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wrapper">
      {error && (
        <div className="secondary-text" style={{ color: 'var(--error)' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter SOL amount"
            step="any"
            min="0"
            className="input-field"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)'
            }}
          />
        </div>

        <div className="align-center">
          <button 
            type="submit" 
            className="button btn-primary"
            disabled={isLoading || !wallet || !amount}
          >
            {isLoading ? 'Processing...' : 'Wrap SOL'}
          </button>
        </div>
      </form>
    </div>
  );
};
