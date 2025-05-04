import { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { NetworkSelect } from './WalletContextProvider';
import { useNetwork } from './components/contexts/NetworkContext';
import { useRoutes } from 'react-router-dom';
import { routeConfig } from './Router/index';
import '@solana/wallet-adapter-react-ui/styles.css';
import './style/App.css';
import './style/button.css';
import './style/icon.css';
import './style/error.css';
import './style/tap.css';
import './style/Theme.css';
import './style/Typography.css';
import logo from './assets/favicon.png';
import { AmmProvider } from './components/contexts/AmmContext';

const AppContent: FC = () => {
  const { connected } = useWallet();
  const { network, setNetwork } = useNetwork();
  const routeElement = useRoutes(routeConfig);

  return (
    <div className="app-container">
      <nav className="app-nav">
        <div className="brand">
          <img src={logo} alt="Fall Logo" className="app-logo" />
          <h1 className="fall-title">Fall</h1>
        </div>
        <div className="controls">
          <NetworkSelect 
            onChange={setNetwork} 
            value={network} 
          />
          <WalletMultiButton className="button btn-primary" />
        </div>
      </nav>

      <main className="app-main">
        {!connected ? (
          <div className="connect-wallet">
            <div className="wrapper">
              <img src={logo} alt="Fall Logo" className="connect-logo" />
              <h2 className="section-title">Welcome to Fall</h2>
              <p className="section-title">Connect your wallet to continue</p>
            </div>
          </div>
        ) : (
          routeElement
        )}
      </main>

      <div className="social-links-corner">
        <a 
          href="https://github.com/yimingWOW/fall" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-link"
        >
          <i className="fab fa-github"></i>
        </a>
        <a 
          href="https://x.com/fall_labs" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-link"
        >
          <i className="fa-brands fa-x-twitter"></i>
        </a>
      </div>
    </div>
  );
};

const App: FC = () => {
  return (
    <AmmProvider>
      <AppContent />
    </AmmProvider>
  );
};

export default App;