import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { withdrawLiquidity } from '../../utils/withdrawLiquidity';
import { PoolInfo } from '../../utils/getPoolList';
import '../../style/Theme.css';
import '../../style/button.css';
import '../../style/wrapper.css';

interface WithdrawLiquidityFormProps {
  pool: PoolInfo;
  amount: number;
  onSuccess: (signature: string) => void;
}

export const WithdrawLiquidityForm: FC<WithdrawLiquidityFormProps> = ({ 
  pool, 
  amount,
  onSuccess 
}) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!pool?.poolPk || !pool?.amm || !pool?.mintA || !pool?.mintB) {
        throw new Error("Invalid pool information");
      }

      console.log("Withdraw parameters:", {
        poolPk: pool.poolPk,
        amm: pool.amm,
        mintA: pool.mintA,
        mintB: pool.mintB,
        amount
      });

      const signature = await withdrawLiquidity(
        wallet,
        connection,
        new PublicKey(pool.poolPk),
        new PublicKey(pool.amm),
        new PublicKey(pool.mintA),
        new PublicKey(pool.mintB),
        amount
      );

      onSuccess(signature);
    } catch (err) {
      console.error("Error WithdrawLiquidityForm:", err);
      setError(err instanceof Error ? err.message : "Failed to withdraw liquidity");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <form onSubmit={handleSubmit}>
      <div className="wrapper-container">
        <div className="wrapper-header">
          <div className="body-text">Your Liquidity: {amount} LP</div>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
        <button 
          type="submit" 
          className="button btn-primary"
          disabled={isLoading || !wallet || !amount || !pool?.poolPk || !pool?.amm || !pool?.mintA || !pool?.mintB}
        >
          {!wallet 
            ? 'Connect Wallet' 
            : isLoading 
              ? 'Withdrawing Liquidity...' 
              : 'Withdraw Liquidity'}
        </button>
        </div>
      </form>
    </div>
  );
}; 