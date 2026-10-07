import { useMemo } from 'react';
import type { TrendDataPoint } from '@/components/EconomyTrendChart';

export interface MarketPrice {
  id: string;
  name: string;
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  timestamp: number;
}

export interface EconomyData {
  totalGold: number;
  totalFood: number;
  totalEnergy: number;
  totalWater: number;
  timestamp: number;
}

/**
 * 生成市场价格趋势数据
 */
export const useMarketPriceTrendData = (
  marketPrices: MarketPrice[] = [],
  selectedField: 'currentPrice' | 'priceChangePercent' | 'volume' = 'currentPrice'
): TrendDataPoint[] => {
  return useMemo(() => {
    if (!marketPrices || marketPrices.length === 0) {
      return [];
    }

    return marketPrices.map((price) => ({
      name: price.name,
      value: price[selectedField] as number,
      currentPrice: price.currentPrice,
      priceChange: price.priceChange,
      priceChangePercent: price.priceChangePercent,
      volume: price.volume,
    }));
  }, [marketPrices, selectedField]);
};

/**
 * 生成经济数据趋势
 */
export const useEconomyTrendData = (
  economyData: EconomyData[] = [],
  selectedMetric: 'totalGold' | 'totalFood' | 'totalEnergy' | 'totalWater' = 'totalGold'
): TrendDataPoint[] => {
  return useMemo(() => {
    if (!economyData || economyData.length === 0) {
      return [];
    }

    return economyData.map((data, index) => ({
      name: `时间 ${index + 1}`,
      value: data[selectedMetric],
      totalGold: data.totalGold,
      totalFood: data.totalFood,
      totalEnergy: data.totalEnergy,
      totalWater: data.totalWater,
    }));
  }, [economyData, selectedMetric]);
};

/**
 * 生成多维度经济数据趋势
 */
export const useMultiMetricEconomyTrendData = (
  economyData: EconomyData[] = []
): TrendDataPoint[] => {
  return useMemo(() => {
    if (!economyData || economyData.length === 0) {
      return [];
    }

    return economyData.map((data, index) => ({
      name: `时间 ${index + 1}`,
      value: data.totalGold,
      金币: data.totalGold,
      食物: data.totalFood,
      能量: data.totalEnergy,
      水: data.totalWater,
    }));
  }, [economyData]);
};

/**
 * 生成价格变化趋势数据
 */
export const usePriceChangeTrendData = (
  marketPrices: MarketPrice[] = []
): TrendDataPoint[] => {
  return useMemo(() => {
    if (!marketPrices || marketPrices.length === 0) {
      return [];
    }

    return marketPrices.map((price) => ({
      name: price.name,
      value: price.priceChangePercent,
      priceChange: price.priceChange,
      currentPrice: price.currentPrice,
    }));
  }, [marketPrices]);
};

/**
 * 生成交易量趋势数据
 */
export const useVolumeTrendData = (
  marketPrices: MarketPrice[] = []
): TrendDataPoint[] => {
  return useMemo(() => {
    if (!marketPrices || marketPrices.length === 0) {
      return [];
    }

    return marketPrices.map((price) => ({
      name: price.name,
      value: price.volume,
      currentPrice: price.currentPrice,
      priceChangePercent: price.priceChangePercent,
    }));
  }, [marketPrices]);
};

/**
 * 计算趋势统计信息
 */
export interface TrendStats {
  min: number;
  max: number;
  avg: number;
  total: number;
  trend: 'up' | 'down' | 'stable';
}

export const useTrendStats = (data: TrendDataPoint[], dataKey: string = 'value'): TrendStats => {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return { min: 0, max: 0, avg: 0, total: 0, trend: 'stable' };
    }

    const values = data.map(d => (typeof d[dataKey] === 'number' ? d[dataKey] : 0));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const total = values.reduce((a, b) => a + b, 0);

    // 计算趋势
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (data.length > 1) {
      const firstValue = typeof data[0][dataKey] === 'number' ? (data[0][dataKey] as number) : 0;
      const lastValue = typeof data[data.length - 1][dataKey] === 'number' ? (data[data.length - 1][dataKey] as number) : 0;
      if (lastValue > firstValue) {
        trend = 'up';
      } else if (lastValue < firstValue) {
        trend = 'down';
      }
    }

    return { min, max, avg, total, trend };
  }, [data, dataKey]);
};

/**
 * 对趋势数据进行平滑处理（移动平均）
 */
export const useSmoothTrendData = (
  data: TrendDataPoint[],
  windowSize: number = 3,
  dataKey: string = 'value'
): TrendDataPoint[] => {
  return useMemo(() => {
    if (!data || data.length < windowSize) {
      return data;
    }

    const smoothed: TrendDataPoint[] = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
      const window = data.slice(start, end);
      const values = window.map(d => (typeof d[dataKey] === 'number' ? d[dataKey] : 0));
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      smoothed.push({
        ...data[i],
        [dataKey]: avg,
      });
    }

    return smoothed;
  }, [data, windowSize, dataKey]);
};

/**
 * 按指定条件过滤趋势数据
 */
export const useFilteredTrendData = (
  data: TrendDataPoint[],
  predicate: (item: TrendDataPoint) => boolean
): TrendDataPoint[] => {
  return useMemo(() => {
    if (!data) {
      return [];
    }
    return data.filter(predicate);
  }, [data, predicate]);
};

export default {
  useMarketPriceTrendData,
  useEconomyTrendData,
  useMultiMetricEconomyTrendData,
  usePriceChangeTrendData,
  useVolumeTrendData,
  useTrendStats,
  useSmoothTrendData,
  useFilteredTrendData,
};
