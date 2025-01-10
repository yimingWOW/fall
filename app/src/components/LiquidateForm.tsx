import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { liquidate } from '../utils/liquidate';
import { getPendingLiquidation, type PendingLiquidation } from '../utils/getPendingLiquidation';

export const LiquidateForm: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [borrowerAddress, setBorrowerAddress] = useState<string>("");
  const [lastTxSignature, setLastTxSignature] = useState<string>("");
  const [pendingLiquidations, setPendingLiquidations] = useState<PendingLiquidation[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);


  // 搜索待清算列表
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !poolAddress) {
      setError("Please connect wallet and enter pool address");
      return;
    }

    try {
      setError("");
      setIsLoadingList(true);
      const poolKey = new PublicKey(poolAddress);
      const liquidations = await getPendingLiquidation(wallet, poolKey, connection);
      setPendingLiquidations(liquidations);
    } catch (err) {
      console.error("Error fetching pending liquidations:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch pending liquidations");
      setPendingLiquidations([]);
    } finally {
      setIsLoadingList(false);
    }
  };


  const handleLiquidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!wallet) {
      setError("Please connect your wallet first");
      setIsLoading(false);
      return;
    }

    let poolKey: PublicKey;
    let borrowerKey: PublicKey;
    try {
      poolKey = new PublicKey(poolAddress);
      borrowerKey = new PublicKey(borrowerAddress);
    } catch (err) {
      setError("Invalid pool or borrower address");
      setIsLoading(false);
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
      
      setPoolAddress("");
      setBorrowerAddress("");
    } catch (err) {
      console.error("Error liquidating position:", err);
      setError(err instanceof Error ? err.message : "Failed to liquidate. Please try again.");
    } finally {
      setIsLoading(false);
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

            {/* 搜索表单 */}
            <div className="search-form">
        <div className="form-group">
          <label htmlFor="pool-address">Pool Address:</label>
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


        {/* 待清算列表展示 */}
        <div className="pending-liquidations">
          <h3>Pending Liquidations</h3>
          {isLoadingList ? (
            <div className="loading">Loading pending liquidations...</div>
          ) : pendingLiquidations.length === 0 ? (
            <p>No pending liquidations found</p>
          ) : (
            <ul className="liquidation-list">
              {pendingLiquidations.map((item, index) => (
                <li 
                  key={index} 
                  className="liquidation-item"
                  onClick={() => setBorrowerAddress(item.userAuthorityPda.toString())}
                >
                  <div>Borrower: {item.userAuthorityPda.toString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 清算表单 */}
      <form onSubmit={handleLiquidate} className="liquidate-form">
        <div className="form-group">
          <label htmlFor="borrower-address">Borrower Address:</label>
          <input
            id="borrower-address"
            type="text"
            value={borrowerAddress}
            onChange={(e) => setBorrowerAddress(e.target.value)}
            placeholder="Enter borrower address"
            className="input-field"
          />
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={isLoading || !wallet || !poolAddress || !borrowerAddress}
        >
          {isLoading ? 'Liquidating...' : 'Liquidate Position'}
        </button>
      </form>
    </div>


  );
};