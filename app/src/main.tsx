import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WalletContextProvider } from './WalletContextProvider';
import './style/index.css';

import { Buffer } from 'buffer';
import 'stream-browserify';
import 'crypto-browserify';

if (typeof window !== 'undefined') {
  window.global = window;
  window.Buffer = Buffer; // 全局注册 Buffer
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletContextProvider>
      <App />
    </WalletContextProvider>
  </React.StrictMode>
);
