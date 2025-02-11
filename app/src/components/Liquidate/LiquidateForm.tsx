import { FC, useState, useEffect } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { liquidate } from '../../utils/liquidate';
import { getPendingLiquidation, PendingLiquidation } from '../../utils/getPendingLiquidation';
import '../../style/Theme.css';
import { AddressLabel } from '../utils/AddressLabel';
import '../../style/Typography.css';
import { useParams, useNavigate } from 'react-router-dom';

export const LiquidateForm: FC = () => {
  const navigate = useNavigate();
  const { poolAddress: poolAddressParam } = useParams<{ poolAddress?: string }>();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [error, setError] = useState<string>("");
  const [poolAddress, setPoolAddress] = useState<PublicKey | undefined>(
    poolAddressParam ? new PublicKey(poolAddressParam) : undefined
  );
  const [lastTxSignature, setLastTxSignature] = useState<string>("");
  const [pendingLiquidations, setPendingLiquidations] = useState<PendingLiquidation[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [processingLiquidation, setProcessingLiquidation] = useState<string | null>(null);

  useEffect(() => {
    if (poolAddressParam && wallet) {
      handleSearch(new Event('submit') as any);
    }
  }, [poolAddressParam, wallet]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !poolAddress) {
      setError("Please connect wallet and enter pool address");
      return;
    }

    // Update URL if pool address was manually entered
    if (!poolAddressParam) {
      navigate(`/liquidate/${poolAddress.toString()}`);
    }

    try {
      setError("");
      setIsLoadingList(true);
      const liquidations = await getPendingLiquidation(wallet, poolAddress, connection);
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

    if (!poolAddress) {
      setError("Invalid pool address");
      setProcessingLiquidation(null);
      return;
    }

    try {
      const result = await liquidate(
        wallet,
        connection,
        poolAddress,
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
      <div className="card-container">
        <div className="section">
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
          <div className="section">
            {!poolAddressParam && (
              <>
                <div className="code-text">
                  <span className="body-text">
                    Pool PublicKey (Could get from Lend page)
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                  <input
                    className="input"
                    type="text"
                    value={poolAddress?.toString()}
                    onChange={(e) => setPoolAddress(new PublicKey(e.target.value))}
                    placeholder="Enter pool address"
                  />
                  <button 
                    onClick={handleSearch}
                    disabled={isLoadingList || !wallet || !poolAddress}
                    className="button btn-primary"
                    style={{ minWidth: 'auto' }}
                  >
                    {isLoadingList ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </>
            )}
          </div>

        <div className="section">        
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
            <div className="section">
              {pendingLiquidations.map((item, index) => (
                <div key={index} className="step">
                  <div className="info-row">
                    <AddressLabel 
                      label="Bankrupt Address"
                      address={item.userAuthorityPda.toString()}
                    />
                    <span className="body-text">Borrow/Collateral:</span>
                    <span className="code-text">{item.borrowReceiptTokenAmount.toString()}/{item.collateralReceiptTokenAmount.toString()}</span>
                    <button
                      onClick={() => handleLiquidatePosition(item.userAuthorityPda)}
                      disabled={processingLiquidation === item.userAuthorityPda.toString()}
                      className="button btn-primary"
                      >
                      {processingLiquidation === item.userAuthorityPda.toString() ? 'Processing...' : 'Liquidate and earn'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
      </div>
    );
};