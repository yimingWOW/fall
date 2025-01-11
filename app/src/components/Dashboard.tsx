import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { CreateAmmForm } from './CreateAmmForm';
import { AmmList } from './AmmList';
import { PoolCreateForm } from './CreatePoolForm';
import { PoolList } from './PoolList';
import { LiquidateForm } from './LiquidateForm';
import { AmmProvider } from '../contexts/AmmContext';
import { LenderPoolList } from './LenderPoolList';
import { BorrowerPoolList } from './BorrowerPoolList';
const EXCLUDED_PUBLIC_KEY = 'GUXNPX5ci1Qj76MZe2aRJ33zK48VmT6gXVyR86CsF4T5';

const Dashboard: FC = () => {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState('amm');

  return (
    <AmmProvider>
    <div className="defi-dashboard">
      <div className="tabs">

        {publicKey?.toBase58() == EXCLUDED_PUBLIC_KEY && (
          <button 
            className={`tab ${activeTab === 'amm' ? 'active' : ''}`}
            onClick={() => setActiveTab('amm')}
          >
            AMM
          </button>
        )}

        <button 
          className={`tab ${activeTab === 'pool' ? 'active' : ''}`}
          onClick={() => setActiveTab('pool')}
        >
          Swap
        </button>

        <button 
          className={`tab ${activeTab === 'lenderPool' ? 'active' : ''}`}
          onClick={() => setActiveTab('lenderPool')}
        >
          Lend
        </button>

        <button 
          className={`tab ${activeTab === 'borrowerPool' ? 'active' : ''}`}
          onClick={() => setActiveTab('borrowerPool')}
        >
          Borrow
        </button>

        <button 
          className={`tab ${activeTab === 'liquidate' ? 'active' : ''}`}
          onClick={() => setActiveTab('liquidate')}
        >
          Liquidate
        </button>

      </div>

      <div className="content">
        {activeTab === 'amm' && publicKey?.toBase58() == EXCLUDED_PUBLIC_KEY ? 
        (<div>
            <AmmList />
            <CreateAmmForm />
          </div>
        ) 
          : activeTab === 'pool' ? (
            <div>
              <PoolList />
              <PoolCreateForm />
            </div>
          ) 
        : activeTab === 'lenderPool' ? (
          <div>
            <LenderPoolList />
          </div>
        ) 
        : activeTab === 'borrowerPool' ? (
          <div>
            <BorrowerPoolList />
          </div>
        ) 
        : activeTab === 'liquidate' ? (
          <div>
            <LiquidateForm />
          </div>
        ) 
        :(
          <FutureForm />
        )}
      </div>
    </div>
    </AmmProvider>
  );
};

// 交易表单组件
const FutureForm: FC = () => {
  return (
    <div>
      <h3> Coming Soon...</h3>
    </div>
  );
};

export default Dashboard;