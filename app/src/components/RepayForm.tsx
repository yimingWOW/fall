import { FC, useState, useEffect } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { repay } from '../utils/repay';
import BN from 'bn.js';
import { LendingPoolInfo } from './LendingPoolItem';

interface RepayFormProps {
  lendingPool: LendingPoolInfo;
  onSuccess: (signature: string) => void;
}

export const RepayForm: FC<RepayFormProps> = ({ lendingPool, onSuccess }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [repayAmount, setRepayAmount] = useState("");
  const [borrowBalance, setBorrowBalance] = useState<number | null>(null);

  // 获取用户当前借款余额
  useEffect(() => {
    const fetchBorrowBalance = async () => {
      if (!wallet) return;
      try {
        // 这里需要实现获取用户借款余额的逻辑
        // const balance = await getBorrowBalance(wallet.publicKey, lendingPool);
        // setBorrowBalance(balance);
      } catch (err) {
        console.error("Error fetching borrow balance:", err);
      }
    };

    fetchBorrowBalance();
  }, [wallet, lendingPool]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!wallet) {
      setError("Please connect your wallet first");
      setIsLoading(false);
      return;
    }

    try {
      // 验证还款金额
      const repayAmountNum = parseFloat(repayAmount);
      if (isNaN(repayAmountNum) || repayAmountNum <= 0) {
        throw new Error("Invalid repay amount");
      }

      // 如果有借款余额信息，验证还款金额不超过借款金额
      if (borrowBalance !== null && repayAmountNum > borrowBalance) {
        throw new Error("Repay amount cannot exceed borrow balance");
      }

      // 从 lendingPool 对象获取必要的公钥
      const poolPubkey = new PublicKey(lendingPool.pool);
      const mintAPubkey = new PublicKey(lendingPool.mintA);
      const mintBPubkey = new PublicKey(lendingPool.mintB);

      const signature = await repay(
        wallet,
        connection,
        poolPubkey,
        mintAPubkey,
        mintBPubkey,
        new BN(repayAmountNum ) // 转换为 lamports
      );
      
      console.log(`Transaction URL: https://explorer.solana.com/tx/${signature}`);
      setRepayAmount(""); // 重置表单
      onSuccess(signature);
    } catch (err) {
      console.error("Error repaying:", err);
      setError(err instanceof Error ? err.message : "Failed to repay");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    if (borrowBalance !== null) {
      setRepayAmount(borrowBalance.toString());
    }
  };

  return (
    <div className="form-wrapper">
      <h3>Repay Loan</h3>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Amount to Repay (Token A):</label>
          <div className="input-with-max">
            <input
              type="number"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              placeholder="Enter amount to repay"
              required
              min="0"
              step="any"
              disabled={isLoading}
            />
            <button
              type="button"
              className="max-button"
              onClick={handleMaxClick}
              disabled={borrowBalance === null}
            >
              MAX
            </button>
          </div>
        </div>

        <div className="lending-pool-info-summary">
          <div>Pool: {lendingPool.pool.slice(0, 4)}...{lendingPool.pool.slice(-4)}</div>
          <div>Token A (Repay): {lendingPool.mintA.slice(0, 4)}...{lendingPool.mintA.slice(-4)}</div>
          <div>Token B (Collateral): {lendingPool.mintB.slice(0, 4)}...{lendingPool.mintB.slice(-4)}</div>
          {borrowBalance !== null && (
            <div>Current Borrow Balance: {borrowBalance} Token A</div>
          )}
        </div>

        <div className="info-message">
          Note: Repaying your loan will return your collateral proportionally.
        </div>

        <button 
          type="submit" 
          className="action-button"
          disabled={isLoading || !wallet}
        >
          {isLoading ? 'Processing...' : 'Confirm Repay'}
        </button>
      </form>
    </div>
  );
};