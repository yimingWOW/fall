import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { AmmList } from './Amm/AmmList.tsx';
import { SwapForm } from './Swap/SwapForm';
import { LiquidateForm } from './Liquidate/LiquidateForm';
import { AmmProvider } from '../contexts/AmmContext';
import { LenderPoolList } from './Lend/LendPoolList.tsx';
import { BorrowerPoolList } from './Borrow/BorrowPoolList.tsx';
import { EXCLUDED_PUBLIC_KEY } from '../utils/constants';
import { Guide } from './Guide/Guide.tsx';
import '../style/Theme.css';
import '../style/Typography.css';
import { FarmForm } from './Farm/FarmForm.tsx';

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
    <div className="section-title">{icon}{label}</div>
  </button>
);

const Dashboard: FC = () => {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState('guide');

  return (
    <AmmProvider>
      <nav className="tab-nav">
        {publicKey?.toBase58() == EXCLUDED_PUBLIC_KEY && (
          <TabButton 
            isActive={activeTab === 'amm'} 
            onClick={() => setActiveTab('amm')}
            icon="⚙️"
            label="AMM"
          />
        )}

        <TabButton 
          isActive={activeTab === 'guide'} 
          onClick={() => setActiveTab('guide')}
          icon="🧭"
          label="Guide"
        />
        
        <TabButton 
          isActive={activeTab === 'swap'} 
          onClick={() => setActiveTab('swap')}
          icon="↔️"
          label="Swap"
        />

        <TabButton 
          isActive={activeTab === 'farm'} 
          onClick={() => setActiveTab('farm')}
          icon="🌾"
          label="Farm"
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
          </>
        ) : activeTab === 'guide' ? (
          <Guide />
        ) : activeTab === 'swap' ? (
          <SwapForm onSuccess={() => {}} />
        ) : activeTab === 'lenderPool' ? (
          <LenderPoolList />
        ) : activeTab === 'borrowerPool' ? (
          <BorrowerPoolList />
        ) : activeTab === 'liquidate' ? (
          <LiquidateForm />
        ) : activeTab === 'farm' ? (
          <FarmForm />
        ) : (
          <div className="code-text">Coming Soon...</div>
        )}
      </div>
    </AmmProvider>
  );
};

export default Dashboard;