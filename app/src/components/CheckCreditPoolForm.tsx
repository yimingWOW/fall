import { FC, useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { checkCreditPool } from '../utils/checkCreditPool';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { PoolInfo } from '../utils/getPoolList';
import { InitPoolForm } from './InitPoolForm';

interface CheckCreditPoolFormProps {
  pool: PoolInfo;
}

export const CheckCreditPoolForm: FC<CheckCreditPoolFormProps> = ({ pool }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [isCreditPool, setIsCreditPool] = useState(false);
  const [showInitForm, setShowInitForm] = useState(false);

  useEffect(() => {
    const checkPool = async () => {
      try {
        if (!wallet) return;
        
        const poolPubkey = new PublicKey(pool.pubkey);
        const isCredit = await checkCreditPool(
          wallet,
          connection,
          poolPubkey,
          pool.mintA
        );
        
        setIsCreditPool(isCredit.isCreditPoolInitialized);
      } catch (error) {
        console.error('Error checking credit pool:', error);
      }
    };

    checkPool();
  }, [connection, pool, wallet]);

  if (!isCreditPool) {
    return (
      <div className="init-pool-section">
        <button
          className="action-button"
          onClick={() => setShowInitForm(!showInitForm)}
        >
          {showInitForm ? 'Hide Init Pool' : 'Init Pool'}
        </button>

        {showInitForm && (
          <InitPoolForm 
            pool={pool}
            onSuccess={() => {
              setShowInitForm(false);
              setIsCreditPool(true);
            }}
          />
        )}
      </div>
    );
  }

  return null;
}; 