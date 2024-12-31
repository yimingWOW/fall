import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { createPool } from '../utils/createPool';
import { useAmm } from '../contexts/AmmContext'; // 导入 useAmm

export const PoolCreateForm: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const { amm } = useAmm(); // 从上下文中获取 amm
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastTxSignature, setLastTxSignature] = useState<string>("");
  const [formData, setFormData] = useState({
    mintA: '',
    mintB: '',
    fee: '500',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLastTxSignature("");
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
      // 验证输入的公钥格式
      const ammPubkey = new PublicKey(amm.pubkey);
      const mintAPubkey = new PublicKey(formData.mintA);
      const mintBPubkey = new PublicKey(formData.mintB);

      const signature = await createPool(
        wallet,
        connection,
        ammPubkey,
        mintAPubkey,
        mintBPubkey,
        Number(formData.fee)  
      );
      
      console.log(`Transaction URL: https://explorer.solana.com/tx/${signature}`);
      setLastTxSignature(signature);
      setFormData({ mintA: '', mintB: '', fee: '500' }); // 重置表单
    } catch (err) {
      console.error("Error creating pool:", err);
      setError(err instanceof Error ? err.message : "Failed to create pool");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="create-amm-container">
        <h2>Create Pool</h2>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {lastTxSignature && (
          <div className="success-message">
            Pool created successfully! 
            <a 
              href={`https://explorer.solana.com/tx/${lastTxSignature}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              View transaction
            </a>
          </div>
        )}
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>AMM Pubkey:</label>
            <input
              type="text"
              value={amm ? amm.pubkey : ''}
              readOnly
              disabled
            />
          </div>
          <div className="form-group">
            <label>Token A Mint Address:</label>
            <input
              type="text"
              value={formData.mintA}
              onChange={(e) => setFormData({...formData, mintA: e.target.value})}
              placeholder="Enter token A mint address"
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>Token B Mint Address:</label>
            <input
              type="text"
              value={formData.mintB}
              onChange={(e) => setFormData({...formData, mintB: e.target.value})}
              placeholder="Enter token B mint address"
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>Fee (in basis points, 1-10000, default: 500 or 5%):</label>
            <input
              type="text"
              value={formData.fee}
              onChange={(e) => setFormData({...formData, fee: e.target.value})}
              placeholder="500"
              required
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading || !wallet}
          >
            {isLoading ? 'Creating...' : 'Create Pool'}
          </button>
        </form>
      </div>
    </div>
  );
};