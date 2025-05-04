import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useNavigate } from 'react-router-dom';
import { createPool } from '../../utils/createPool';
import { useAmm } from '../contexts/AmmContext';
import '../../style/Theme.css';
import '../../style/Typography.css';

export const CreatePoolForm: FC = () => {
  const navigate = useNavigate();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const { amm } = useAmm();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastTxSignature, setLastTxSignature] = useState<string>("");
  const [formData, setFormData] = useState({
    mintA: '',
    mintB: '',
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
      const ammPubkey = new PublicKey(amm.pubkey);
      const mintAPubkey = new PublicKey(formData.mintA);
      const mintBPubkey = new PublicKey(formData.mintB);

      const signature = await createPool(
        wallet,
        connection,
        ammPubkey,
        mintAPubkey,
        mintBPubkey,
      );
      
      setLastTxSignature(signature.toString());
      setFormData({ mintA: '', mintB: '' });
      navigate('/farm');
    } catch (err) {
      console.error("Error creating pool:", err);
      setError(err instanceof Error ? err.message : "Failed to create pool");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <div className="back-button-container">
        <button 
          className="button btn-primary"
          onClick={() => navigate('/farm')}
          style={{ marginBottom: 'var(--spacing-md)' }}
        >
          Back
        </button>
      </div>
      <div className="wrapper-container">
        <div className="wrapper-box">
          <div className="section-title">Create New Pool</div>
          <div className="note-text">Note: Init pool need sign 5 times</div>
          {error && (
            <div className="code-text" style={{ color: 'var(--error)' }}>
              {error}
            </div>
          )}
          {lastTxSignature && (
            <div>
              <span className="code-text" style={{ color: 'var(--primary)' }}>
                Pool created successfully! 
              </span>
              <a 
                href={`https://explorer.solana.com/tx/${lastTxSignature}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="code-text"
                style={{ marginLeft: 'var(--spacing-xs)' }}
              >
                View transaction
              </a>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="wrapper-box">
              <span className="sub-title">AMM Pubkey</span>
              <input
                className="input"
                type="text"
                value={amm ? amm.pubkey : ''}
                readOnly
                disabled
              />
            </div>
            <div className="wrapper-box">
              <span className="sub-title">Token A Mint Address</span>
              <input
                className="input"
                type="text"
                value={formData.mintA}
                onChange={(e) => setFormData({...formData, mintA: e.target.value})}
                placeholder="Enter token A mint address"
                required
                disabled={isLoading}
              />
            </div>
            <div className="wrapper-box">
              <span className="sub-title">Token B Mint Address</span>
              <input
                className="input"
                type="text"
                value={formData.mintB}
                onChange={(e) => setFormData({...formData, mintB: e.target.value})}
                placeholder="Enter token B mint address"
                required
                disabled={isLoading}
              />
            </div>
            <div className="align-center">
              <button 
                type="submit" 
                className="button btn-primary"
                disabled={isLoading || !wallet}
              >
                {isLoading ? 'Creating...' : 'Create Pool'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};