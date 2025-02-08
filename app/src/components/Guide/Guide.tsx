import { FC } from 'react';
import { WrapSolForm } from './wrapSolForm';
import '../../style/Typography.css';
import '../../style/Theme.css';

export const Guide: FC = () => {
  return (
    <div className="card-container">
        <h1 className="title">Getting Started with Fall Protocol</h1>
        
        <section className="section">
          <h2>Prerequisites</h2>
          <div className="step">
            <h3>1. Get Devnet SOL</h3>
            <p>Request Devnet SOL from the <a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer">Solana Faucet</a></p>
          </div>
          
          <div className="step">
            <h3>2. Get Test USDT</h3>
            <p>Obtain test USDT tokens from the <a href="https://spl-token-faucet.com/?token-name=USDT" target="_blank" rel="noopener noreferrer">SPL Token Faucet</a></p>
          </div>
        </section>

        <section className="section">
          <h2>Setup Instructions</h2>
          <div className="step">
            <h3>Convert SOL to WSOL for trading in Wsol-USDT Pool</h3>
            <WrapSolForm onSuccess={() => {}} />
          </div>
        </section>

        <section className="section">
          <h2>Using the Protocol</h2>
          <div className="step">
            <h3>1. Connect Your Wallet</h3>
            <p>Use the "Connect Wallet" button in the top right corner</p>
          </div>
          <div className="step">
            <h3>2. Add Liquidity</h3>
            <p>Deposit your WSOL and USDT into the liquidity pool to start earning fees</p>
          </div>
          <div className="step">
            <h3>3. Start Trading</h3>
            <p>Once you have funds in the pool, you can begin trading on the platform</p>
          </div>
          <div className="step">
            <h3>4. Become a Lender</h3>
            <p>Visit the Lend page to lend out your meme tokens and earn yields. This is a great way to generate passive income from your meme token holdings.</p>
          </div>
          <div className="step">
            <h3>5. Become a Borrower</h3>
            <p>Head to the Borrow page where you can:</p>
            <ul className="feature-list">
              <li>Deposit stablecoins as collateral</li>
              <li>Borrow meme tokens you're interested in</li>
              <li>Implement short-selling strategies by selling borrowed tokens when prices are high</li>
              <li>Buy back tokens at lower prices to profit from price decreases</li>
            </ul>
          </div>
        </section>
    </div>
  );
};