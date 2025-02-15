import { FC } from 'react';
import '../../style/Typography.css';
import '../../style/Theme.css';
import '../../style/guide.css';

export const Introduction: FC = () => {
  return (
    <div className="card-container">
      <h1 className="title">Welcome to Fall Protocol</h1>

      <section className="section">
        <h2>What is Fall Protocol?</h2>
        <p>Fall is a decentralized lending protocol that operates without oracles. It provides shorting tools for any trading pair. Especially in the current meme coin market, anyone can create a lending pool on Fall immediately after a meme token is created, and profit by borrowing and shorting it at the right time.</p>
      </section>

      <section className="section">
        <h2>Key Features</h2>
        
        <div className="feature">
          <h3>🎯 Oracle-Free Design</h3>
          <p>Our unique oracle-free architecture ensures maximum security and reliability.</p>
        </div>

        <div className="feature">
          <h3>⚡ Instant Pool Creation</h3>
          <p>Create lending pools for any token pair immediately, perfect for catching new market opportunities.</p>
        </div>

        <div className="feature">
          <h3>🎮 Meme Coin Trading</h3>
          <p>Specialized tools for meme coin market participants, enabling both long and short positions.</p>
        </div>

        <div className="feature">
          <h3>💰 Open Liquidations</h3>
          <p>Anyone can participate in the liquidation process and earn rewards. Simply spot liquidatable positions and click to claim your rewards!</p>
        </div>
      </section>

      <section className="section">
        <h2>Why Choose Fall?</h2>
        <ul className="feature-list">
          <li>True Decentralization</li>
          <li>No Oracle Dependencies</li>
          <li>First-Mover Advantage for New Tokens</li>
          <li>Flexible Trading Strategies</li>
          <li>Community-Driven Development</li>
        </ul>
      </section>
    </div>
  );
};
