import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { depositLiquidity } from '../utils/depositLiquidity';
import { PoolInfo } from '../utils/getPoolList';

interface DepositLiquidityFormProps {
  pool: PoolInfo;
  onSuccess: (signature: string) => void;
}

export const DepositLiquidityForm: FC<DepositLiquidityFormProps> = ({ 
  pool, 
  onSuccess 
}) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState({
    amountA: '',
    amountB: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const amountA = parseFloat(formData.amountA) ;
      const amountB = parseFloat(formData.amountB) ;

      const signature = await depositLiquidity(
        wallet,
        connection,
        new PublicKey(pool.poolPk),
        new PublicKey(pool.amm),
        new PublicKey(pool.mintA),
        new PublicKey(pool.mintB),
        amountA,
        amountB
      );

      onSuccess(signature);
      setFormData({ amountA: '', amountB: '' });
    } catch (err) {
      console.error("Error depositing liquidity:", err);
      setError(err instanceof Error ? err.message : "Failed to deposit liquidity");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card gradient-border">
      <h2 className="section-title">Deposit Liquidity</h2>
      {error && (
        <div className="code-text" style={{ color: 'var(--error)' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <span className="sub-title">Amount Token A</span>
          <input
            className="input"
            type="number"
            step="any"
            value={formData.amountA}
            onChange={(e) => setFormData({...formData, amountA: e.target.value})}
            placeholder="Enter amount for token A"
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <span className="sub-title">Amount Token B</span>
          <input
            className="input"
            type="number"
            step="any"
            value={formData.amountB}
            onChange={(e) => setFormData({...formData, amountB: e.target.value})}
            placeholder="Enter amount for token B"
            required
            disabled={isLoading}
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading || !wallet}
        >
          {isLoading ? 'Depositing...' : 'Confirm Deposit'}
        </button>
      </form>
    </div>
  );
}; 