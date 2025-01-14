import { FC, useState, useEffect } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { swap } from '../utils/swap';
import { PoolInfo } from '../utils/getPoolList';
import { getPoolDetail, PoolDetailInfo } from '../utils/getPoolDetail';
import '../style/SwapForm.css';

interface SwapFormProps {
  pool: PoolInfo;
  onSuccess: (signature: string) => void;
}

export const SwapForm: FC<SwapFormProps> = ({ pool, onSuccess }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [swapAtoB, setSwapAtoB] = useState(true);
  const [poolDetails, setPoolDetails] = useState<PoolDetailInfo | null>(null);
  const [formData, setFormData] = useState({
    inputAmount: '',
    minOutputAmount: '',
  });
  const [slippage, setSlippage] = useState('1.0');

  // 获取池子详情
  const fetchPoolDetails = async () => {
    try {
      const details = await getPoolDetail(
        connection,
        {
          pubkey: pool.pubkey.toString(),
          amm: pool.amm.toString(),
          mintA: pool.mintA.toString(),
          mintB: pool.mintB.toString(),
        },
        wallet?.publicKey || new PublicKey('')
      );
      setPoolDetails(details);
    } catch (error) {
      console.error('Error fetching pool details:', error);
    }
  };

  // 初始加载和方向改变时获取池子详情
  useEffect(() => {
    fetchPoolDetails();
  }, [pool, connection, wallet?.publicKey]);

  // 计算输出金额
  const calculateOutputAmount = (input: string) => {
    if (!poolDetails || !input) {
      return '';
    }

    const inputAmount = parseFloat(input);
    if (isNaN(inputAmount)) {
      return '';
    }

    // 根据交换方向选择正确的价格
    const price = swapAtoB ? poolDetails.pool.aToB : poolDetails.pool.bToA;
    const outputAmount = inputAmount * price;
    
    return outputAmount.toFixed(6);
  };

  // 处理输入金额变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const outputValue = calculateOutputAmount(inputValue);
    
    setFormData({
      inputAmount: inputValue,
      minOutputAmount: outputValue,
    });
  };

  // 处理交换方向改变
  const handleDirectionChange = () => {
    setSwapAtoB(!swapAtoB);
    // 清空输入，因为价格方向改变
    setFormData({
      inputAmount: '',
      minOutputAmount: '',
    });
  };

  const handleSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 允许空值，这样用户可以删除内容重新输入
    if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
      setSlippage(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !formData.inputAmount) return;

    setIsLoading(true);
    try {
      // 计算考虑滑点的最小输出金额
      const slippageMultiplier = (100 - parseFloat(slippage)) / 100;
      const minOutputWithSlippage = parseFloat(formData.minOutputAmount) * slippageMultiplier;

      const signature = await swap(
        wallet,
        connection,
        new PublicKey(pool.pubkey),
        new PublicKey(pool.amm),
        new PublicKey(pool.mintA),
        new PublicKey(pool.mintB),
        swapAtoB,
        parseFloat(formData.inputAmount),
        minOutputWithSlippage
      );
      onSuccess(signature);
      setFormData({ inputAmount: '', minOutputAmount: '' });
    } catch (error) {
      console.error('Swap error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="swap-wrapper">
      <form onSubmit={handleSubmit}>
        <div className="swap-container">
          <div className="swap-box">
            <div className="swap-header">You're Selling</div>
            <div className="token-section">
              <div className="token-selector">{swapAtoB ? 'Token A' : 'Token B'}</div>
              <input
                type="number"
                value={formData.inputAmount}
                onChange={handleInputChange}
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="button"
            className="swap-direction-toggle"
            onClick={handleDirectionChange}
            aria-label="Switch swap direction"
          />

          <div className="swap-box">
            <div className="swap-header">You're Buying</div>
            <div className="token-section">
              <div className="token-selector">{swapAtoB ? 'Token B' : 'Token A'}</div>
              <input
                type="number"
                value={formData.minOutputAmount}
                readOnly
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="slippage-settings">
            <div className="slippage-header">Slippage Tolerance</div>
            <div className="slippage-input-container">
              <input
                type="number"
                value={slippage}
                onChange={handleSlippageChange}
                placeholder="1.0"
                step="0.1"
                min="0"
                max="100"
              />
              <span className="percentage-symbol">%</span>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="submit-button"
          disabled={isLoading || !wallet || !formData.inputAmount}
        >
          {isLoading ? 'Swapping...' : 'Enter an amount'}
        </button>
      </form>
    </div>
  );
}; 