import { FC } from 'react';
import { WrapSolForm } from './wrapSolForm';
import '../../style/Typography.css';
import '../../style/Theme.css';
import guidePic1 from '../../assets/guide_pic_1.png';
import '../../style/guide.css';
export const Guide: FC = () => {
  return (
    <div className="card-container">
        <h1 className="title">Getting Started with Fall Protocol</h1>
        
        <section className="section">
          <h2>Prerequisites</h2>
          <div className="step">
            <h3>1. Enable Devnet in Phantom Wallet</h3>
            <p>Open Phantom wallet settings → Developer Settings → Open Testnet Mode</p>
            <img src={guidePic1} alt="Enable Devnet in Phantom" className="guide-image" />
          </div>
          <div className="step">
            <h3>2. Get Devnet Token</h3>
            <p>Obtain Devnet SOL from the <a className="text-link" href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer">Solana Faucet</a></p>
            <p>Obtain Devnet USDT tokens from the <a className="text-link" href="https://spl-token-faucet.com/?token-name=USDT" target="_blank" rel="noopener noreferrer">SPL Token Faucet</a></p>
          </div>
          <div className="step">
            <h3>3. Convert SOL to WSOL for trading in Wsol-USDT Pool</h3>
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
            <h3>2. Start Trading</h3>
            <p>You can trade on the swap page and you can influence the price then liquidate the borrower's position</p>
          </div>
          <div className="step">
            <h3>3. Be a Farmer</h3>
            <p>Deposit your Token into the liquidity pool to start earning fees</p>
          </div>
          <div className="step">
            <h3>4. Long-term bullish on a meme</h3>
            <p>Visit the Lend page to lend your meme tokens and earn yields. Forget about it, and one day look back and it might have been to the moon</p>
          </div>
          <div className="step">
            <h3>5. Short worthless memes</h3>
            <p>Go to the Borrow page and short those Shittcoins!</p>
            <ul className="feature-list">
              <li>Deposit stablecoins as collateral</li>
              <li>Borrow meme tokens</li>
              <li>Sell borrowed meme when prices are high</li>
              <li>Buy back meme at lower prices, repay the borrowed meme and have a leisurely glass of Coke</li>
            </ul>
          </div>
          <div className="step">
            <h3>6. Liquidate the borrower's position</h3>
            <p>Visit the Liquidate page to liquidate the borrower's position</p>
          </div>
        </section>
    </div>
  );
};