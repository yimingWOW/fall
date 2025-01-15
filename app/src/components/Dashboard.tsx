import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { CreateAmmForm } from './CreateAmmForm';
import { AmmList } from './AmmList';
import { CreatePoolForm } from './CreatePoolForm';
import { PoolList } from './PoolList';
import { LiquidateForm } from './LiquidateForm';
import { AmmProvider } from '../contexts/AmmContext';
import { LenderPoolList } from './LenderPoolList';
import { BorrowerPoolList } from './BorrowerPoolList';
import { EXCLUDED_PUBLIC_KEY } from '../utils/constants';
import { Guide } from './Guide';
import '../style/Dashboard.css';

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

const TabButton: FC<TabButtonProps> = ({ isActive, onClick, icon, label }) => (
  <button 
    className={`nav-tab ${isActive ? 'active' : ''}`}
    onClick={onClick}
  >
    <span className="tab-icon">{icon}</span>
    <span className="tab-label">{label}</span>
  </button>
);

const Dashboard: FC = () => {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState('pool');

  return (
    <div className="dashboard-wrapper">
        <AmmProvider>
        <div className="dashboard-container">
          <div className="dashboard-content">
            <nav className="navigation-tabs">

              <TabButton 
                isActive={activeTab === 'guide'} 
                onClick={() => setActiveTab('guide')}
                icon="🧭"
                label="Guide"
                data-tab="guide"
              />

              {publicKey?.toBase58() == EXCLUDED_PUBLIC_KEY && (
                <TabButton 
                  isActive={activeTab === 'amm'} 
                  onClick={() => setActiveTab('amm')}
                  icon="⚙️"
                  label="AMM"
                  data-tab="amm"
                />
              )}
              
              <TabButton 
                isActive={activeTab === 'pool'} 
                onClick={() => setActiveTab('pool')}
                icon="↔️"
                label="Swap"
                data-tab="pool"
              />
              
              <TabButton 
                isActive={activeTab === 'lenderPool'} 
                onClick={() => setActiveTab('lenderPool')}
                icon="💰"
                label="Lend"
                data-tab="lenderPool"
              />
              
              <TabButton 
                isActive={activeTab === 'borrowerPool'} 
                onClick={() => setActiveTab('borrowerPool')}
                icon="🏦"
                label="Borrow"
                data-tab="borrowerPool"
              />
              
              <TabButton 
                isActive={activeTab === 'liquidate'} 
                onClick={() => setActiveTab('liquidate')}
                icon="⚡"
                label="Liquidate"
                data-tab="liquidate"
              />
            </nav>

            <div className="tab-content">
              {activeTab === 'amm' && publicKey?.toBase58() == EXCLUDED_PUBLIC_KEY ? (
                <div>
                  <AmmList />
                  <CreateAmmForm />
                </div>
              ) : activeTab === 'guide' ? (
                <div>
                  <Guide />
                </div>
              ): activeTab === 'pool' ? (
                <div>
                  <div className="pool-header">
                    <CreatePoolForm />
                  </div>
                  <PoolList />
                </div>
              ) : activeTab === 'lenderPool' ? (
                <div>
                  <LenderPoolList />
                </div>
              ) : activeTab === 'borrowerPool' ? (
                <div>
                  <BorrowerPoolList />
                </div>
              ) : activeTab === 'liquidate' ? (
                <div>
                  <LiquidateForm />
                </div>
              ) : (
                <FutureForm />
              )}
            </div>
          </div>
        </div>
      </AmmProvider>
    </div>
  );
};

const FutureForm: FC = () => {
  return (
    <div>
      <h3>Coming Soon...</h3>
    </div>
  );
};

export default Dashboard;