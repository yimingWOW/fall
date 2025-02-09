import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { WalletContextProvider } from './WalletContextProvider';
import './style/Theme.css';
import 'stream-browserify';
import 'crypto-browserify';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/fall">
      <WalletContextProvider>
        <App />
      </WalletContextProvider>
    </BrowserRouter>
  </React.StrictMode>
);
