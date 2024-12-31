// src/App.tsx
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { FC } from 'react';
import Dashboard from './components/Dashboard';
import './index.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { NetworkSelect } from './WalletContextProvider';
import { useNetwork } from './contexts/NetworkContext';

const App: FC = () => {
  const { connected } = useWallet();
  const { network, setNetwork } = useNetwork();

  return (
    <div className="container">
      <nav className="navbar">
        <div className="navbar-content">
          <NetworkSelect onChange={setNetwork} value={network} />
          <WalletMultiButton />
        </div>
      </nav>

      <main className="main-content">
        {!connected ? (
          <div className="connect-prompt">
            <h2>Please connect your wallet to continue</h2>
          </div>
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
};

export default App;