import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { swap } from '../utils/swap';

interface PoolInfo {
  pubkey: string;
  amm: string;
  mintA: string;
  mintB: string;
}

interface SwapFormProps {
  pool: PoolInfo;
  onSuccess: (signature: string) => void;
}

export const SwapForm: FC<SwapFormProps> = ({ pool, onSuccess }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [swapAtoB, setSwapAtoB] = useState(true);
  const [formData, setFormData] = useState({
    inputAmount: '',
    minOutputAmount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const inputAmount = parseFloat(formData.inputAmount) ;
      const minOutputAmount = parseFloat(formData.minOutputAmount) ;

      console.log("inputAmount", inputAmount);
      console.log("minOutputAmount", minOutputAmount);
      console.log("swapAtoB", swapAtoB);
      console.log("pool.pubkey", pool.pubkey);
      console.log("pool.amm", pool.amm);
      console.log("pool.mintA", pool.mintA);
      console.log("pool.mintB", pool.mintB);
      const signature = await swap(
        wallet,
        connection,
        new PublicKey(pool.pubkey),
        new PublicKey(pool.amm),
        new PublicKey(pool.mintA),
        new PublicKey(pool.mintB),
        swapAtoB,
        inputAmount,
        minOutputAmount
      );

      onSuccess(signature);
      setFormData({ inputAmount: '', minOutputAmount: '' });
    } catch (err) {
      console.error("Error in swap:", err);
      setError(err instanceof Error ? err.message : "Failed to swap");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="swap-form">
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <div className="swap-direction">
          <button
            type="button"
            className={`direction-button ${swapAtoB ? 'active' : ''}`}
            onClick={() => setSwapAtoB(true)}
          >
            A → B
          </button>
          <button
            type="button"
            className={`direction-button ${!swapAtoB ? 'active' : ''}`}
            onClick={() => setSwapAtoB(false)}
          >
            B → A
          </button>
        </div>
      </div>
      <div className="form-group">
        <label>Input Amount:</label>
        <input
          type="number"
          step="any"
          value={formData.inputAmount}
          onChange={(e) => setFormData({...formData, inputAmount: e.target.value})}
          placeholder={`Enter amount for token ${swapAtoB ? 'A' : 'B'}`}
          required
          disabled={isLoading}
        />
      </div>
      <div className="form-group">
        <label>Minimum Output Amount:</label>
        <input
          type="number"
          step="any"
          value={formData.minOutputAmount}
          onChange={(e) => setFormData({...formData, minOutputAmount: e.target.value})}
          placeholder={`Minimum amount of token ${swapAtoB ? 'B' : 'A'}`}
          required
          disabled={isLoading}
        />
      </div>
      <button 
        type="submit" 
        className="submit-button"
        disabled={isLoading || !wallet}
      >
        {isLoading ? 'Swapping...' : 'Swap'}
      </button>
    </form>
  );
}; 