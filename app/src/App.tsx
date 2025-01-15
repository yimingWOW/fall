import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { FC } from 'react';
import Dashboard from './components/Dashboard';
import { NetworkSelect } from './WalletContextProvider';
import { useNetwork } from './contexts/NetworkContext';
import '@solana/wallet-adapter-react-ui/styles.css';
import './style/App.css';
import logo from '../public/favicon.png'; 


const App: FC = () => {
  const { connected } = useWallet();
  const { network, setNetwork } = useNetwork();

  return (
    <div className="app-container">
      <nav className="app-nav">
        <div className="nav-content">
          <div className="nav-left">
            <img src={logo} alt="Fall Logo" className="app-logo" />
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
              <img src={logo} alt="Fall Logo" className="connect-logo" />
              <h2>Welcome to Fall</h2>
              <p>Please connect your wallet to continue</p>
            </div>
          </div>
        ) : (
          <Dashboard />
        )}
      </main>

      <div className="social-links-corner">
        <a 
          href="https://github.com/yimingWOW/fall" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-icon"
        >
          <i className="fab fa-github"></i>
        </a>
        <a 
          href="https://x.com/fall_labs" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-icon"
        >
          <i className="fa-brands fa-x-twitter"></i>
        </a>
      </div>
    </div>
  );
};

export default App;