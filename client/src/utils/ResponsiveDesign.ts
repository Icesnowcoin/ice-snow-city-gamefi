/**
 * 响应式设计工具
 * 用于处理不同屏幕尺寸的布局和交互
 */

export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface BreakPoints {
  xs: number;  // 0px
  sm: number;  // 640px
  md: number;  // 768px
  lg: number;  // 1024px
  xl: number;  // 1280px
  '2xl': number; // 1536px
}

export const breakPoints: BreakPoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * 获取当前屏幕尺寸
 */
export function getCurrentScreenSize(width: number = window.innerWidth): ScreenSize {
  if (width < breakPoints.sm) return 'xs';
  if (width < breakPoints.md) return 'sm';
  if (width < breakPoints.lg) return 'md';
  if (width < breakPoints.xl) return 'lg';
  if (width < breakPoints['2xl']) return 'xl';
  return '2xl';
}

/**
 * 检查是否为移动设备
 */
export function isMobileDevice(): boolean {
  return window.innerWidth < breakPoints.md;
}

/**
 * 检查是否为平板设备
 */
export function isTabletDevice(): boolean {
  return window.innerWidth >= breakPoints.md && window.innerWidth < breakPoints.lg;
}

/**
 * 检查是否为桌面设备
 */
export function isDesktopDevice(): boolean {
  return window.innerWidth >= breakPoints.lg;
}

/**
 * 响应式值 - 根据屏幕尺寸返回不同的值
 */
export function responsiveValue<T>(
  values: Partial<Record<ScreenSize, T>>,
  defaultValue: T
): T {
  const screenSize = getCurrentScreenSize();
  return values[screenSize] ?? defaultValue;
}

/**
 * 响应式字体大小
 */
export const responsiveFontSize = {
  xs: responsiveValue(
    {
      xs: '12px',
      sm: '13px',
      md: '14px',
      lg: '14px',
      xl: '14px',
    },
    '14px'
  ),
  sm: responsiveValue(
    {
      xs: '14px',
      sm: '14px',
      md: '15px',
      lg: '15px',
      xl: '15px',
    },
    '15px'
  ),
  base: responsiveValue(
    {
      xs: '16px',
      sm: '16px',
      md: '16px',
      lg: '16px',
      xl: '16px',
    },
    '16px'
  ),
  lg: responsiveValue(
    {
      xs: '18px',
      sm: '18px',
      md: '18px',
      lg: '20px',
      xl: '20px',
    },
    '20px'
  ),
  xl: responsiveValue(
    {
      xs: '20px',
      sm: '20px',
      md: '24px',
      lg: '24px',
      xl: '28px',
    },
    '28px'
  ),
  '2xl': responsiveValue(
    {
      xs: '24px',
      sm: '24px',
      md: '28px',
      lg: '32px',
      xl: '36px',
    },
    '36px'
  ),
};

/**
 * 响应式间距
 */
export const responsiveSpacing = {
  xs: responsiveValue(
    {
      xs: '4px',
      sm: '4px',
      md: '4px',
      lg: '4px',
      xl: '4px',
    },
    '4px'
  ),
  sm: responsiveValue(
    {
      xs: '8px',
      sm: '8px',
      md: '8px',
      lg: '8px',
      xl: '8px',
    },
    '8px'
  ),
  md: responsiveValue(
    {
      xs: '12px',
      sm: '12px',
      md: '16px',
      lg: '16px',
      xl: '16px',
    },
    '16px'
  ),
  lg: responsiveValue(
    {
      xs: '16px',
      sm: '16px',
      md: '20px',
      lg: '24px',
      xl: '24px',
    },
    '24px'
  ),
  xl: responsiveValue(
    {
      xs: '20px',
      sm: '20px',
      md: '24px',
      lg: '32px',
      xl: '32px',
    },
    '32px'
  ),
};

/**
 * 响应式布局配置
 */
export const responsiveLayout = {
  containerPadding: responsiveValue(
    {
      xs: '12px',
      sm: '16px',
      md: '20px',
      lg: '24px',
      xl: '32px',
    },
    '32px'
  ),
  gridColumns: responsiveValue(
    {
      xs: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
    },
    5
  ),
  maxWidth: responsiveValue(
    {
      xs: '100%',
      sm: '540px',
      md: '720px',
      lg: '960px',
      xl: '1140px',
    },
    '1140px'
  ),
};

/**
 * React Hook: 使用屏幕尺寸
 */
export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState<ScreenSize>(
    getCurrentScreenSize()
  );

  React.useEffect(() => {
    const handleResize = () => {
      setScreenSize(getCurrentScreenSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    screenSize,
    isMobile: screenSize === 'xs' || screenSize === 'sm',
    isTablet: screenSize === 'md' || screenSize === 'lg',
    isDesktop: screenSize === 'xl' || screenSize === '2xl',
  };
}

/**
 * 触摸设备检测
 */
export function isTouchDevice(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0)
  );
}

/**
 * 获取安全区域内边距 (用于 iOS 刘海屏)
 */
export function getSafeAreaInsets() {
  const style = getComputedStyle(document.documentElement);
  return {
    top: style.getPropertyValue('--safe-area-inset-top'),
    right: style.getPropertyValue('--safe-area-inset-right'),
    bottom: style.getPropertyValue('--safe-area-inset-bottom'),
    left: style.getPropertyValue('--safe-area-inset-left'),
  };
}

/**
 * 禁用缩放 (用于移动设备)
 */
export function disableZoom() {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
    );
  }
}

/**
 * 启用缩放
 */
export function enableZoom() {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, user-scalable=yes'
    );
  }
}

import React from 'react';
