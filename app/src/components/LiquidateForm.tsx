import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { liquidate } from '../utils/liquidate';
import { getPendingLiquidation } from '../utils/getPendingLiquidation';
import '../styles/LiquidateForm.css';

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
    <div className="liquidate-container">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      {lastTxSignature && (
        <div className="success-message">
          Liquidation successful! 
          <a 
            href={`https://explorer.solana.com/tx/${lastTxSignature}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View transaction
          </a>
        </div>
      )}

        <div className="search-form">
        <div className="form-group">
          <label htmlFor="pool-address">Pool PublicKey(Could get from Lend page):</label>
          <div className="input-with-button">
            <input
              id="pool-address"
              type="text"
              value={poolAddress}
              onChange={(e) => setPoolAddress(e.target.value)}
              placeholder="Enter pool address"
              className="input-field"
            />
            <button 
              onClick={handleSearch}
              disabled={isLoadingList || !wallet || !poolAddress}
              className="search-button"
            >
              {isLoadingList ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>


        <div className="pending-liquidations">
          <h3>Pending Bankrupts</h3>
          {isLoadingList ? (
            <div className="loading">Loading pending Bankrupts...</div>
          ) : pendingLiquidations.length === 0 ? (
            <p>No pending Bankrupts found</p>
          ) : (
            <ul className="liquidation-list">
              {pendingLiquidations.map((item, index) => (
                <li key={index} className="liquidation-item">
                  <div>{item.toString()}</div>
                  <button
                    onClick={() => handleLiquidatePosition(item)}
                    disabled={processingLiquidation === item.toString()}
                    className="liquidate-button"
                  >
                    {processingLiquidation === item.toString() ? 'Processing...' : 'Liquidate to earn'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>

  );
};