import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { CreateAmmForm } from './CreateAmmForm';
import { AmmList } from './AmmList';
import { PoolList } from './PoolList';
import { LiquidateForm } from './LiquidateForm';
import { AmmProvider } from '../contexts/AmmContext';
import { LenderPoolList } from './LenderPoolList';
import { BorrowerPoolList } from './BorrowerPoolList';
import { EXCLUDED_PUBLIC_KEY } from '../utils/constants';
import { Guide } from './Guide';
import '../style/Theme.css';
import '../style/Typography.css';

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

const TabButton: FC<TabButtonProps> = ({ isActive, onClick, icon, label }) => (
  <button 
    className={`tab-button ${isActive ? 'active' : ''}`}
    onClick={onClick}
  >
    <div className="section-title">{icon}</div>
    <div className="section-title">{label}</div>
  </button>
);

const Dashboard: FC = () => {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState('pool');

  return (
    <AmmProvider>
      <nav className="tab-nav">
        <TabButton 
          isActive={activeTab === 'guide'} 
          onClick={() => setActiveTab('guide')}
          icon="🧭"
          label="Guide"
        />

        {publicKey?.toBase58() == EXCLUDED_PUBLIC_KEY && (
          <TabButton 
            isActive={activeTab === 'amm'} 
            onClick={() => setActiveTab('amm')}
            icon="⚙️"
            label="AMM"
          />
        )}
        
        <TabButton 
          isActive={activeTab === 'pool'} 
          onClick={() => setActiveTab('pool')}
          icon="↔️"
          label="Swap"
        />
        
        <TabButton 
          isActive={activeTab === 'lenderPool'} 
          onClick={() => setActiveTab('lenderPool')}
          icon="💰"
          label="Lend"
        />
        
        <TabButton 
          isActive={activeTab === 'borrowerPool'} 
          onClick={() => setActiveTab('borrowerPool')}
          icon="🏦"
          label="Borrow"
        />
        
        <TabButton 
          isActive={activeTab === 'liquidate'} 
          onClick={() => setActiveTab('liquidate')}
          icon="⚡"
          label="Liquidate"
        />
      </nav>

      <div className="dashboard-content">
        {activeTab === 'amm' && publicKey?.toBase58() == EXCLUDED_PUBLIC_KEY ? (
          <>
            <AmmList />
            <CreateAmmForm />
          </>
        ) : activeTab === 'guide' ? (
          <Guide />
        ) : activeTab === 'pool' ? (
          <PoolList />
        ) : activeTab === 'lenderPool' ? (
          <LenderPoolList />
        ) : activeTab === 'borrowerPool' ? (
          <BorrowerPoolList />
        ) : activeTab === 'liquidate' ? (
          <LiquidateForm />
        ) : (
          <div className="code-text">Coming Soon...</div>
        )}
      </div>
    </AmmProvider>
  );
};

export default Dashboard;