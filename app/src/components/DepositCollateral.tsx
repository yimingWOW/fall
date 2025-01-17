import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { depositCollateral } from '../utils/depositCollateral';
import BN from 'bn.js';
import { PoolInfo } from '../utils/getPoolList';

interface DepositCollateralFormProps {
  pool: PoolInfo;
  onSuccess: (signature: string) => void;
}

export const DepositCollateralForm: FC<DepositCollateralFormProps> = ({ pool, onSuccess }) => {
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
      const collateralAmount = parseFloat(amount);
      if (isNaN(collateralAmount) || collateralAmount <= 0) {
        throw new Error("Invalid amount");
      }

      const poolPubkey = new PublicKey(pool.poolPk);
      const mintBPubkey = new PublicKey(pool.mintB);

      const signature = await depositCollateral(
        wallet,
        connection,
        poolPubkey,
        mintBPubkey,
        new BN(collateralAmount)
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
    <div className="card gradient-border compact">
      <h2 className="section-title">Deposit Collateral</h2>
      {error && (
        <div className="code-text" style={{ color: 'var(--error)' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <span className="sub-title">Amount to Deposit</span>
          <input
            className="input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount of collateral to deposit"
            required
            min="0"
            step="any"
            disabled={isLoading}
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading || !wallet}
        >
          {isLoading ? 'Processing...' : 'Confirm Deposit'}
        </button>
      </form>
    </div>
  );
};