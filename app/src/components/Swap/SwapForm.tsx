import { FC, useState, useEffect } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { swap } from '../../utils/swap';
import { PoolInfo, getPoolList } from '../../utils/getPoolList';
import { getPoolDetail, PoolDetailInfo } from '../../utils/getPoolDetail';
import '../../style/button.css';
import '../../style/wrapper.css';
import '../../style/input.css';
import '../../style/Typography.css';
import '../../style/search.css';
import '../../style/icon.css';

export const SwapForm: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [swapAtoB, setSwapAtoB] = useState(true);
  const [poolDetails, setPoolDetails] = useState<PoolDetailInfo | null>(null);
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [selectedPool, setSelectedPool] = useState<PoolInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    inputAmount: '',
    minOutputAmount: '',
  });
  const [slippage, setSlippage] = useState('1.0');
  const [error, setError] = useState<string | ''>('');

  // 获取池子详情
  const fetchPoolDetails = async () => {
    try {
      if (!wallet) return;
      const details = await getPoolDetail(
        wallet,
        connection,
        new PublicKey(selectedPool!.poolPk),
        wallet.publicKey
      );
      setPoolDetails(details);
    } catch (error) {
      console.error('Error fetching pool details:', error);
    }
  };

  // 获取所有池子
  useEffect(() => {
    const fetchPools = async () => {
      if (wallet && connection) {
        try {
          const poolList = await getPoolList(wallet, connection);
          setPools(poolList);
        } catch (error) {
          console.error('Error fetching pools:', error);
        }
      }
    };
    fetchPools();
  }, [wallet, connection]);

  // 当选择池子变化时获取池子详情
  useEffect(() => {
    if (selectedPool) {
      fetchPoolDetails();
    }
  }, [selectedPool]);

  const filteredPools = pools.filter(pool =>
    pool.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePoolSelect = (pool: PoolInfo) => {
    setSelectedPool(pool);
    setIsDropdownOpen(false);
    setSearchTerm(pool.displayName || '');
  };

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
    const price = swapAtoB ? poolDetails.poolInfo.aToB : poolDetails.poolInfo.bToA;
    const outputAmount = inputAmount * price;
    
    // 确保返回整数字符串
    return Math.round(outputAmount).toString();
  };

  // 更新处理输入变化的函数
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'input' | 'output') => {
    const value = e.target.value;
    
    if (field === 'input') {
      // 当输入金额变化时，自动计算输出金额
      const calculatedOutput = calculateOutputAmount(value);
      setFormData({
        inputAmount: value,
        minOutputAmount: calculatedOutput,
      });
    } else {
      // 当用户直接输入输出金额时，使用用户输入的值
      setFormData(prev => ({
        ...prev,
        minOutputAmount: value,
      }));
    }
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
    if (!wallet || !formData.inputAmount || !selectedPool) return;

    setIsLoading(true);
    setError('');
    
    try {
      const slippageMultiplier = (100 - parseFloat(slippage)) / 100;
      // 确保所有数值都被转换为整数
      const inputAmount = Math.round(parseFloat(formData.inputAmount));
      const minOutputAmount = Math.round(
        parseFloat(formData.minOutputAmount) * slippageMultiplier
      );

      await swap(
        wallet,
        connection,
        new PublicKey(selectedPool.poolPk),
        new PublicKey(selectedPool.amm),
        new PublicKey(selectedPool.mintA),
        new PublicKey(selectedPool.mintB),
        swapAtoB,
        inputAmount,
        minOutputAmount
      );
      
      setFormData({ inputAmount: '', minOutputAmount: '' });
    } catch (error: any) {
      const errorMessage = error.message || 'An unknown error occurred';
      console.error('Swap error:', error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wrapper">
        <form onSubmit={handleSubmit}>
        <div className="pool-select" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          {selectedPool ? (
            <span>{selectedPool.displayName}</span>
          ) : (
            <span className="placeholder">Select a pool</span>
          )}
          <span className="dropdown-arrow">▼</span>
        </div>
        {isDropdownOpen && (
          <div className="step">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search pools..."
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
            <div className="body-text">
              {filteredPools.map((pool) => (
                <div
                  key={pool.poolPk.toString()}
                  className="pool-option"
                  onClick={() => handlePoolSelect(pool)}
                >
                  {pool.displayName}
                </div>
              ))}
              {filteredPools.length === 0 && (
                <div className="no-results">No pools found</div>
              )}
            </div>
          </div>
        )}

        {selectedPool && (
          <div className="wrapper-container">
            <div className="wrapper-box">
              <div className="input-header">You're Selling</div>
              <div className="token-section">
                <div className="token-selector">{swapAtoB ? 'Token A' : 'Token B'}</div>
                <input
                  type="number"
                  value={formData.inputAmount}
                  onChange={(e) => handleInputChange(e, 'input')}
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

            <div className="wrapper-box">
              <div className="input-header">You're Buying</div>
              <div className="token-section">
                <div className="token-selector">{swapAtoB ? 'Token B' : 'Token A'}</div>
                <input
                  type="number"
                  value={formData.minOutputAmount}
                  onChange={(e) => handleInputChange(e, 'output')}
                  placeholder="0.00"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="wrapper-box">
              <div className="token-section">
                <div className="input-header">Slippage Tolerance</div>
                <input
                  type="number"
                  value={slippage}
                  onChange={handleSlippageChange}
                  placeholder="1.0"
                  step="0.1"
                  min="0"
                  max="100"
                />
                <div className="token-selector">%</div>
                </div>
              </div>
              {error && (
                <div className="error-message" style={{
                  color: 'red',
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  borderRadius: '4px'
                }}>
                  {error}
                </div>
              )}
              <button 
                type="submit"
                className="button btn-primary"
                disabled={isLoading || !wallet || !formData.inputAmount || !selectedPool}
                >
                {isLoading ? 'Swapping...' : selectedPool ? 'Enter an amount' : 'Select a pool'}
              </button>
          </div>
        )}
      </form>
    </div>
  );
}; 