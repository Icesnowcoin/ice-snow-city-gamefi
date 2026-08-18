import React, { useState, useRef, useEffect } from 'react';
import { Coins, Zap, Droplet, RefreshCw } from 'lucide-react';
import '../styles/economy-status-bar.css';
import { BlockchainBalanceService } from '../economy/BlockchainBalanceService';

interface CurrencyDisplay {
  type: 'coin' | 'experience' | 'energy' | 'water' | 'isc';
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface EconomyStatusBarProps {
  coin: number;
  experience: number;
  energy?: number;
  water?: number;
  isc?: number;
  onCoinChange?: (newValue: number, oldValue: number) => void;
  onExperienceChange?: (newValue: number, oldValue: number) => void;
  onISCRefresh?: (balance: number) => void;
}

interface AnimatingValue {
  id: string;
  value: number;
  startTime: number;
  duration: number;
}

export const EconomyStatusBar: React.FC<EconomyStatusBarProps> = ({
  coin,
  experience,
  energy = 100,
  water = 100,
  isc = 0,
  onCoinChange,
  onExperienceChange,
  onISCRefresh,
}) => {
  const [displayCoin, setDisplayCoin] = useState(coin);
  const [displayExperience, setDisplayExperience] = useState(experience);
  const [displayISC, setDisplayISC] = useState(isc);
  const [animatingValues, setAnimatingValues] = useState<Map<string, AnimatingValue>>(new Map());
  const prevCoinRef = useRef(coin);
  const prevExpRef = useRef(experience);
  const prevISCRef = useRef(isc);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const blockchainServiceRef = useRef<BlockchainBalanceService | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // 数字跳动动画
  const animateValue = (key: string, fromValue: number, toValue: number, duration: number = 600) => {
    const animatingValue: AnimatingValue = {
      id: key,
      value: fromValue,
      startTime: Date.now(),
      duration,
    };

    setAnimatingValues((prev) => new Map(prev).set(key, animatingValue));

    const animate = () => {
      const now = Date.now();
      const elapsed = now - animatingValue.startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 使用缓动函数实现平滑动画
      const easeOutQuad = 1 - Math.pow(1 - progress, 2);
      const currentValue = Math.floor(fromValue + (toValue - fromValue) * easeOutQuad);

      if (key === 'coin') {
        setDisplayCoin(currentValue);
      } else if (key === 'experience') {
        setDisplayExperience(currentValue);
      } else if (key === 'isc') {
        setDisplayISC(currentValue);
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate) as unknown as number;
      } else {
        // 动画完成
        if (key === 'coin') {
          setDisplayCoin(toValue);
        } else if (key === 'experience') {
          setDisplayExperience(toValue);
        } else if (key === 'isc') {
          setDisplayISC(toValue);
        }

        setAnimatingValues((prev) => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        });
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate) as unknown as number;
  };

  // 初始化区块链服务
  useEffect(() => {
    if (!blockchainServiceRef.current) {
      blockchainServiceRef.current = new BlockchainBalanceService();
    }
  }, []);

  // 刷新链上 ISC 余额
  const handleRefreshISCBalance = async () => {
    if (isRefreshing || !blockchainServiceRef.current) return;

    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const result = await blockchainServiceRef.current.refreshISCBalance();

      if (result.success && result.balance !== undefined) {
        const oldISC = displayISC;
        setDisplayISC(result.balance);

        if (result.balance > oldISC) {
          animateValue('isc', oldISC, result.balance, 600);
        }

        if (onISCRefresh) {
          onISCRefresh(result.balance);
        }
      } else {
        setRefreshError(result.error || 'Failed to refresh balance');
      }
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 监听 coin 变化
  useEffect(() => {
    if (coin !== prevCoinRef.current) {
      const oldValue = prevCoinRef.current;
      prevCoinRef.current = coin;

      if (coin > oldValue) {
        // 金币增加，播放动画
        animateValue('coin', oldValue, coin, 600);
        if (onCoinChange) {
          onCoinChange(coin, oldValue);
        }
      } else {
        // 金币减少，直接更新
        setDisplayCoin(coin);
      }
    }
  }, [coin, onCoinChange]);

  // 监听 ISC 变化
  useEffect(() => {
    if (isc !== prevISCRef.current) {
      const oldValue = prevISCRef.current;
      prevISCRef.current = isc;

      if (isc > oldValue) {
        // ISC 增加，播放动画
        animateValue('isc', oldValue, isc, 600);
      } else {
        // ISC 减少，直接更新
        setDisplayISC(isc);
      }
    }
  }, [isc]);

  // 监听 experience 变化
  useEffect(() => {
    if (experience !== prevExpRef.current) {
      const oldValue = prevExpRef.current;
      prevExpRef.current = experience;

      if (experience > oldValue) {
        // 经验增加，播放动画
        animateValue('experience', oldValue, experience, 600);
        if (onExperienceChange) {
          onExperienceChange(experience, oldValue);
        }
      } else {
        // 经验减少，直接更新
        setDisplayExperience(experience);
      }
    }
  }, [experience, onExperienceChange]);

  // 清理资源
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="economy-status-bar" role="region" aria-label="Player Economy Status">
      {/* 金币显示 */}
      <div className="currency-item">
        <Coins className="currency-icon" size={20} />
        <span className="currency-label">Coin</span>
        <span className="currency-value">{displayCoin.toLocaleString()}</span>
      </div>

      {/* 经验显示 */}
      <div className="currency-item">
        <span className="currency-icon exp-icon">⭐</span>
        <span className="currency-label">EXP</span>
        <span className="currency-value">{displayExperience.toLocaleString()}</span>
      </div>

      {/* 能量显示 */}
      <div className="currency-item">
        <Zap className="currency-icon" size={20} />
        <span className="currency-label">Energy</span>
        <span className="currency-value">{energy}</span>
      </div>

      {/* 水显示 */}
      <div className="currency-item">
        <Droplet className="currency-icon" size={20} />
        <span className="currency-label">Water</span>
        <span className="currency-value">{water}</span>
      </div>

      {/* ISC 代币显示和刷新按钮 */}
      <div className="currency-item isc-container">
        <div className="isc-display">
          <Coins className="currency-icon isc-icon" size={20} />
          <span className="currency-label">ISC</span>
          <span className="currency-value isc-value">{displayISC.toLocaleString()}</span>
        </div>
        <button
          className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
          onClick={handleRefreshISCBalance}
          disabled={isRefreshing}
          title="Refresh ISC balance from blockchain"
          aria-label="Refresh ISC balance"
        >
          <RefreshCw size={16} className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`} />
        </button>
      </div>

      {/* 错误提示 */}
      {refreshError && (
        <div className="refresh-error" role="alert">
          {refreshError}
        </div>
      )}
    </div>
  );
};

export default EconomyStatusBar;
