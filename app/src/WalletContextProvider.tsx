import { FC, ReactNode, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { NetworkContext } from './contexts/NetworkContext';
import './style/index.css';

export type Cluster = 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet';

export const ENDPOINTS = {
  'mainnet-beta': clusterApiUrl('mainnet-beta'),
  'testnet': clusterApiUrl('testnet'),
  'devnet': clusterApiUrl('devnet'),
  'localnet': 'http://127.0.0.1:8899'
};

export const NetworkSelect: FC<{ onChange: (cluster: Cluster) => void, value: Cluster }> = ({ onChange, value }) => {
  return (
    <div className="solana-network-select-container">
      <select 
        onChange={(e) => onChange(e.target.value as Cluster)}
        value={value}
        className="solana-network-select"
      >
        <option value="devnet">Devnet</option>
        <option value="localnet">Localnet</option>
        <option value="testnet">Testnet</option>
        <option value="mainnet-beta">Mainnet</option>
      </select>
    </div>
  );
};

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  const [network, setNetwork] = useState<Cluster>('devnet');
  const endpoint = useMemo(() => ENDPOINTS[network], [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </NetworkContext.Provider>
  );
};