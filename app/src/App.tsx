import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { FC } from 'react';
import Dashboard from './components/Dashboard';
import { NetworkSelect } from './WalletContextProvider';
import { useNetwork } from './contexts/NetworkContext';
import '@solana/wallet-adapter-react-ui/styles.css';
import './style/App.css';

const App: FC = () => {
  const { connected } = useWallet();
  const { network, setNetwork } = useNetwork();

  return (
    <div className="app-container">
      <nav className="app-nav">
        <div className="nav-content">
          <div className="nav-left">
            <h1 className="app-title">Fall</h1>
          </div>
          <div className="nav-right">
            <NetworkSelect 
              onChange={setNetwork} 
              value={network} 
            />
            <WalletMultiButton className="wallet-button" />
          </div>
        </div>
      </nav>

      <main className="app-main">
        {!connected ? (
          <div className="connect-wallet">
            <div className="connect-card">
              <span className="connect-icon">🌟</span>
              <h2>Welcome to Fall</h2>
              <p>Please connect your wallet to continue</p>
            </div>
          </div>
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
};

export default App;