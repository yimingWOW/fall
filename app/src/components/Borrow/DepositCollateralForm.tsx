import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { depositCollateral } from '../../utils/depositCollateral';
import BN from 'bn.js';
import { PoolInfo } from '../../utils/getPoolList';
import '../../style/Theme.css';
import '../../style/Typography.css';

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
    <div className="wrapper">
      <h3 className="section-title">Deposit Collateral</h3>
      {error && (<div className="code-text" style={{ color: 'var(--error)' }}>{error}</div>)}
      <form onSubmit={handleSubmit}>
        <div className="card-container">
          <input
            className="input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount to deposit"
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
            {isLoading ? 'Processing...' : 'Deposit'}
          </button>
        </div>
      </form>
    </div>
  );
};