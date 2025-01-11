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
                  <div>Borrower Authority PDA: {item.userAuthorityPda.toString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <form onSubmit={handleLiquidate} className="liquidate-form">
        <div className="form-group">
          <label htmlFor="borrower-address">Note: The current demo does not yet support liquidation based on PDAs. The public key is not the same as the PDA. So the PDA above is useless now. U'd better to use another account to borrow and then liquidate that account with it's Public Key.</label>
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