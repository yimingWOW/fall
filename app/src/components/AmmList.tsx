import { FC, useEffect, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { getAmmAccounts } from '../utils/getAmmList';
import { useAmm } from '../contexts/AmmContext'; 

interface AmmInfo {
  pubkey: string;
  ammid: string;
}

export const AmmList: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [amms, setAmms] = useState<AmmInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { setAmm } = useAmm();

  const fetchAmms = async () => {
    if (!wallet) return;
    
    setIsLoading(true);
    try {
      const ammAccounts = await getAmmAccounts(wallet, connection);
      setAmms(ammAccounts);
      if (ammAccounts.length > 0) {
        setAmm(ammAccounts[0]);
      }
    } catch (err) {
      console.error("Error fetching AMMs:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch AMMs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAmms();
  }, [wallet, connection]);

  const handleSelectAmm = (amm: AmmInfo) => {
    setAmm(amm);
  };

  return (
    <div className="create-amm-container">
      <h2>Existing AMMs</h2>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      {isLoading ? (
        <div>Loading AMMs...</div>
      ) : amms.length === 0 ? (
        <div className="form-group">
          <p>No AMMs found</p>
        </div>
      ) : (
        <div className="form-group">
          {amms.map((amm) => (
            <div key={amm.pubkey} className="amm-item" onClick={() => handleSelectAmm(amm)}>
              <div className="amm-details">
                <span className="amm-label">AMM Pubkey:</span>
                <span className="amm-value">{amm.pubkey}</span>
              </div>
              <div className="amm-details">
                <span className="amm-label">AMM ID:</span>
                <span className="amm-value">{amm.ammid} bps</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};