import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { getPoolDetail, PoolDetailInfo } from '../utils/getPoolDetail';
import { checkCreditPool } from '../utils/checkCreditPool';
import { LendForm } from './LendForm';
import { RedeemForm } from './RedeemForm';
import { PoolInfo } from '../utils/getPoolList';
import { PublicKey } from '@solana/web3.js';
import { InitPoolForm } from './InitPoolForm';
import '../style/Theme.css';
import '../style/Typography.css';
import { shortenAddress } from '../utils/string';

interface PoolItemProps {
  pool: PoolInfo;
  onTxSuccess: (signature: string) => void;
}

export const LenderPoolItem: FC<PoolItemProps> = ({ pool, onTxSuccess }) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { publicKey: walletPublicKey } = useWallet();
  const [details, setDetails] = useState<PoolDetailInfo | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isCreditPool, setIsCreditPool] = useState(false);

  const checkPool = async () => {
    try {
      if (!wallet) return;
      
      const isCredit = await checkCreditPool(
        wallet,
        connection,
        pool.poolPk,
        pool.mintA
      );
      
      setIsCreditPool(isCredit.isCreditPoolInitialized);
    } catch (error) {
      console.error('Error checking credit pool:', error);
    }
  };

  useEffect(() => {
    checkPool();
  }, [connection, pool, wallet]);

  const fetchDetails = async () => {
    try {
      setIsLoadingDetails(true);
      const poolDetail = await getPoolDetail(
        connection, 
        pool, 
        walletPublicKey || new PublicKey('')
      );
      setDetails(poolDetail);
    } catch (error) {
      console.error('Error fetching pool prices:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (isCreditPool) {
      fetchDetails();
    }
  }, [pool, connection, walletPublicKey, isCreditPool]);

  console.log("isCreditPool", isCreditPool);

  if (!isCreditPool) {
    return (
      <div className="tap-page">
        <div className="card gradient-border">
          <div className="section-title">Initialize Pool</div>
          <div className="secondary-text" style={{ marginBottom: 'var(--spacing-md)' }}>
            <p>This liquidity pool has not created a lending pool yet.</p>
            <p>Click the button below to create one.</p>
          </div>
          <InitPoolForm 
            pool={pool}
            onSuccess={() => {
              setIsCreditPool(true);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="tap-page">
      <div className="card gradient-border">
        <div className="section-title">Credit Pool Details</div>
        <div className="pool-item-content">
          <div className="code-text">
            <span className="body-text">PoolPK</span>
            <span title={pool.poolPk.toString()}>
              {shortenAddress(pool.poolPk.toString())}
            </span>
          </div>
        </div>
        <div className="pool-item-content">
          <div className="code-text">
            <span className="body-text">TokenA Addr</span>
            <span title={pool.mintA.toString()}>
              {shortenAddress(pool.mintA.toString())}
            </span>
          </div>
          <div className="code-text">
            <span className="body-text">TokenA Balance</span>
            <span>{details?.lendingPoolInfo.tokenAAmount.toFixed(6)}</span>
          </div>
        </div>
        <div className="pool-item-content">
          <div className="code-text">
            <span className="body-text">TokenB Addr</span>
            <span title={pool.mintB.toString()}>
              {shortenAddress(pool.mintB.toString())}
            </span>
          </div>
          <div className="code-text">
            <span className="body-text">TokenB Balance</span>
            <span>{details?.lendingPoolInfo.tokenBAmount.toFixed(6)}</span>
          </div>
        </div>
      </div>

      <div className="card gradient-border">
        <div className="section-title">Your Assets</div>
        {isLoadingDetails ? (
          <div className="loading-spinner"></div>
        ) : details ? (
          <div className="pool-item-content">
            <div className="code-text">
              <span className="body-text">tokenA Balance</span>
              <span>{details.userAssets.tokenAAmount}</span>
            </div>
            <div className="code-text">
              <span className="body-text">You have lent tokenA</span>
              <span>{details.userAssets.lendingReceiptAmount}</span>
            </div>
          </div>
        ) : (
          <div className="secondary-text">Failed to load credit pool details</div>
        )}
      </div>

      <div className="card gradient-border">
        {isLoadingDetails ? (
          <div className="loading-spinner"></div>
        ) : details ? (
          <>
            {Number(details.userAssets.lendingReceiptAmount) === 0 ? (
              <LendForm 
                pool={pool}
                onSuccess={(signature) => {
                  onTxSuccess(signature);
                  fetchDetails();
                }}
              />
            ) : (
              <RedeemForm 
                pool={pool}
                onSuccess={(signature) => {
                  onTxSuccess(signature);
                  fetchDetails();
                }}
              />
            )}
          </>
        ) : (
          <div className="secondary-text">Failed to load credit pool details</div>
        )}
      </div>
    </div>
  );
};