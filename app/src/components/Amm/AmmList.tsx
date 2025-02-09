import { FC } from 'react';
import { useAmm } from '../contexts/AmmContext';
import { CreateAmmForm } from './CreateAmmForm';
import '../../style/Theme.css';
import '../../style/button.css';
import '../../style/Typography.css';

export const AmmList: FC = () => {
  const { amms, selectAmm, isLoading, error } = useAmm();

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
            <div key={amm.pubkey} onClick={() => selectAmm(amm)}>
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