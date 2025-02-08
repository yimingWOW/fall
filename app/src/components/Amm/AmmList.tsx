import { FC, useEffect, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { getAmmAccounts, AmmInfo } from '../../utils/getAmmList';
import { useAmm } from '../../contexts/AmmContext'; 
import { CreateAmmForm } from './CreateAmmForm';
import '../../style/Theme.css';
import '../../style/button.css';
import '../../style/Typography.css';

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
    <div className="tap-page">
      <h2>Existing AMMs</h2>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      {isLoading ? (
        <div>Loading AMMs...</div>
      ) : amms.length === 0 ? (
        <div className="card-container">
          <p>No AMMs found</p>
        </div>
      ) : (
        <div className="card-container">
          {amms.map((amm) => (
            <div key={amm.pubkey} onClick={() => handleSelectAmm(amm)}>
              <div className="section">
                <div className="step">
                  <span className="body-text">AMM Pubkey:</span>
                  <span className="code-text">{amm.pubkey}</span>
                </div>
                <div className="step">
                  <span className="body-text">AMM ID:</span>
                  <span className="code-text">{amm.ammid} bps</span>
                </div>
                <div className="step">
                  <span className="body-text">AMM Admin:</span>
                  <span className="code-text">{amm.admin} bps</span>
                </div>
            </div>
            </div>
          ))}
        </div>
      )}
    <CreateAmmForm />
    </div>
  );
};