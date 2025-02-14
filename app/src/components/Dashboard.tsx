import { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { EXCLUDED_PUBLIC_KEY } from '../utils/constants';
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
    <div className="section-title">{icon}{label}</div>
  </button>
);

const Dashboard: FC = () => {
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 从当前路径获取活动的tab
  const currentTab = location.pathname.split('/')[1] || 'guide';

  const handleTabChange = (newTab: string) => {
    navigate(`/${newTab}`);
  };

  return (
    <div className="dashboard">
      <nav className="tab-nav">
        {publicKey?.toBase58() === EXCLUDED_PUBLIC_KEY && (
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
          label="Long/Short"
        />
        <TabButton 
          isActive={currentTab === 'farm'} 
          onClick={() => handleTabChange('farm')}
          icon="🌾"
          label="Farm"
        />
        <TabButton 
          isActive={currentTab === 'lend'} 
          onClick={() => handleTabChange('lend')}
          icon="💰"
          label="Lend"
        />
        <TabButton 
          isActive={currentTab === 'borrow'} 
          onClick={() => handleTabChange('borrow')}
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
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;