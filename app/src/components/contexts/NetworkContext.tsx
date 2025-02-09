import { createContext, useContext } from 'react';
import { Cluster } from '../../WalletContextProvider';

interface NetworkContextType {
  network: Cluster;
  setNetwork: (network: Cluster) => void;
}

export const NetworkContext = createContext<NetworkContextType>({
  network: 'localnet',
  setNetwork: () => {},
});

export const useNetwork = () => useContext(NetworkContext);
