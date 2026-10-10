import React from 'react';
import './loading-indicator.css';

/**
 * 加载指示器类型
 */
export type LoadingType = 'spinner' | 'dots' | 'ring' | 'wave' | 'pulse';

/**
 * 加载指示器组件属性
 */
interface LoadingIndicatorProps {
  type?: LoadingType;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

/**
 * 加载指示器组件
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  type = 'spinner',
  size = 'md',
  color,
  className = '',
}) => {
  const sizeClass = `loading-${size}`;

  switch (type) {
    case 'dots':
      return (
        <div className={`dots-loading ${sizeClass} ${className}`}>
          <span />
          <span />
          <span />
        </div>
      );

    case 'ring':
      return (
        <div
          className={`ring-loading ${sizeClass} ${className}`}
          style={{ borderTopColor: color }}
        />
      );

    case 'wave':
      return (
        <div className={`wave-loading ${sizeClass} ${className}`}>
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      );

    case 'pulse':
      return (
        <div className={`pulse-loading ${sizeClass} ${className}`}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: color || '#3b82f6' }} />
        </div>
      );

    case 'spinner':
    default:
      return (
        <div
          className={`loading-spinner ${sizeClass} ${className}`}
          style={{ borderTopColor: color }}
        />
      );
  }
};

/**
 * 按钮加载状态包装器
 */
interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  loading,
  children,
  loadingText = '加载中...',
}) => {
  if (!loading) {
    return <>{children}</>;
  }

  return (
    <>
      <LoadingIndicator type="spinner" size="sm" />
      <span style={{ marginLeft: '6px' }}>{loadingText}</span>
    </>
  );
};

/**
 * 进度条加载组件
 */
interface ProgressBarProps {
  visible?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  visible = true,
  className = '',
}) => {
  if (!visible) return null;

  return (
    <div
      className={`progress-bar ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 9999,
      }}
    />
  );
};

export default LoadingIndicator;
