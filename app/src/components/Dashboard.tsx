import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { tab } = useParams();
  const [currentTab, setCurrentTab] = useState(tab || 'guide');
  
  const handleTabChange = (newTab: string) => {
    setCurrentTab(newTab);
    navigate(`/fall/${newTab}`);
  };

  return (
    <AmmProvider>
      <nav className="tab-nav">
        {publicKey?.toBase58() == EXCLUDED_PUBLIC_KEY && (
          <TabButton 
            isActive={currentTab === 'amm'} 
            onClick={() => handleTabChange('amm')}
            icon="⚙️"
            label="AMM"
          />
        )}

        <TabButton 
          isActive={currentTab === 'guide'} 
          onClick={() => handleTabChange('guide')}
          icon="🧭"
          label="Guide"
        />
        
        <TabButton 
          isActive={currentTab === 'swap'} 
          onClick={() => handleTabChange('swap')}
          icon="↔️"
          label="Swap"
        />

        <TabButton 
          isActive={currentTab === 'farm'} 
          onClick={() => handleTabChange('farm')}
          icon="🌾"
          label="Farm"
        />
        
        <TabButton 
          isActive={currentTab === 'lenderPool'} 
          onClick={() => handleTabChange('lenderPool')}
          icon="💰"
          label="Lend"
        />
        
        <TabButton 
          isActive={currentTab === 'borrowerPool'} 
          onClick={() => handleTabChange('borrowerPool')}
          icon="🏦"
          label="Borrow"
        />
        
        <TabButton 
          isActive={currentTab === 'liquidate'} 
          onClick={() => handleTabChange('liquidate')}
          icon="⚡"
          label="Liquidate"
        />
      </nav>

      <div className="dashboard-content">
        {currentTab === 'amm' && publicKey?.toBase58() == EXCLUDED_PUBLIC_KEY ? (
          <AmmList />
        ) : currentTab === 'guide' ? (
          <Guide />
        ) : currentTab === 'swap' ? (
          <SwapForm onSuccess={() => {}} />
        ) : currentTab === 'lenderPool' ? (
          <LenderPoolList />
        ) : currentTab === 'borrowerPool' ? (
          <BorrowerPoolList />
        ) : currentTab === 'liquidate' ? (
          <LiquidateForm />
        ) : currentTab === 'farm' ? (
          <FarmForm />
        ) : (
          <Guide />
        )}
      </div>
    </AmmProvider>
  );
};

export default Dashboard;