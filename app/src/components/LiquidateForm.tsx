import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { liquidate } from '../utils/liquidate';
import { getPendingLiquidation } from '../utils/getPendingLiquidation';
import '../style/Theme.css';
import '../style/Typography.css';

export const LiquidateForm: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [error, setError] = useState<string>("");
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [lastTxSignature, setLastTxSignature] = useState<string>("");
  const [pendingLiquidations, setPendingLiquidations] = useState<PublicKey[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [processingLiquidation, setProcessingLiquidation] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !poolAddress) {
      setError("Please connect wallet and enter pool address");
      return;
    }

    try {
      setError("");
      setIsLoadingList(true);
      const liquidations = await getPendingLiquidation(wallet,new PublicKey(poolAddress),connection);
      console.log(liquidations);
      setPendingLiquidations(liquidations);
    } catch (err) {
      console.error("Error fetching pending liquidations:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch pending liquidations");
      setPendingLiquidations([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleLiquidatePosition = async (borrowerKey: PublicKey) => {
    setError("");
    setProcessingLiquidation(borrowerKey.toString());

    if (!wallet) {
      setError("Please connect your wallet first");
      setProcessingLiquidation(null);
      return;
    }

    let poolKey: PublicKey;
    try {
      poolKey = new PublicKey(poolAddress);
    } catch (err) {
      setError("Invalid pool address");
      setProcessingLiquidation(null);
      return;
    }

    try {
      const result = await liquidate(
        wallet,
        connection,
        poolKey,
        borrowerKey,
      );
      
      console.log(`Transaction URL: https://explorer.solana.com/tx/${result.tx}`);
      setLastTxSignature(result.tx);
      
      handleSearch(new Event('submit') as any);
    } catch (err) {
      console.error("Error liquidating position:", err);
      setError(err instanceof Error ? err.message : "Failed to liquidate. Please try again.");
    } finally {
      setProcessingLiquidation(null);
    }
  };

  return (
    <div className="tap-page">
      <div className="card gradient-border">
        <h3 className="section-title">Liquidate Positions</h3>
        
        {error && (
          <div className="body-text" style={{ color: 'var(--error)', marginBottom: 'var(--spacing-md)' }}>
            {error}
          </div>
        )}
        
        {lastTxSignature && (
          <div className="code-text" style={{ color: 'var(--primary)', marginBottom: 'var(--spacing-md)' }}>
            Liquidation successful! 
            <a 
              href={`https://explorer.solana.com/tx/${lastTxSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginLeft: 'var(--spacing-xs)' }}
            >
              View transaction
            </a>
          </div>
        )}

        <div className="form-group">
          <div className="code-text">
            <span className="body-text">
              Pool PublicKey (Could get from Lend page)
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
            <input
              className="input"
              type="text"
              value={poolAddress}
              onChange={(e) => setPoolAddress(e.target.value)}
              placeholder="Enter pool address"
            />
            <button 
              onClick={handleSearch}
              disabled={isLoadingList || !wallet || !poolAddress}
              className="btn btn-primary"
              style={{ minWidth: 'auto' }}
            >
              {isLoadingList ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        <div className="form-group">        
          {isLoadingList ? (
            <div className="code-text">
              <div className="loading-spinner"></div>
              <span className="body-text">
              Loading pending Bankrupts...
              </span>
            </div>
          ) : pendingLiquidations.length === 0 ? (
            <div className="code-text">
              <span className="body-text">
                No pending Bankrupts found
              </span>
            </div>
          ) : (
            <div className="pool-list">
              <h3 className="section-title">Pending Bankrupts</h3>
              {pendingLiquidations.map((item, index) => (
                <div key={index} className="card gradient-border" 
                     style={{ marginBottom: 'var(--spacing-sm)', padding: 'var(--spacing-sm)' }}>
                  <div className="code-text" style={{ marginBottom: 'var(--spacing-sm)' }}>
                    {item.toString()}
                  </div>
                  <div className="align-center">
                    <button
                      onClick={() => handleLiquidatePosition(item)}
                      disabled={processingLiquidation === item.toString()}
                      className="btn btn-primary"
                    >
                      {processingLiquidation === item.toString() ? 'Processing...' : 'Liquidate to earn'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};