/**
 * Assets Panel Component
 * Displays player financial assets and wealth information
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Wallet, Home, Building2, PiggyBank } from 'lucide-react';

interface PlayerAssets {
  iscBalance: number;
  bankBalance: number;
  investments: number;
  realEstateValue: number;
  businessValue: number;
  totalAssets: number;
}

interface AssetsPanelProps {
  assets: PlayerAssets;
}

export const AssetsPanel: React.FC<AssetsPanelProps> = ({ assets }) => {
  const getAssetPercentage = (value: number, total: number) => {
    return total > 0 ? (value / total) * 100 : 0;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `¥${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `¥${(value / 1000).toFixed(2)}K`;
    }
    return `¥${value.toFixed(2)}`;
  };

  const assetBreakdown = [
    {
      label: '现金',
      value: assets.iscBalance,
      icon: Wallet,
      color: 'bg-green-500',
      percentage: getAssetPercentage(assets.iscBalance, assets.totalAssets),
    },
    {
      label: '银行存款',
      value: assets.bankBalance,
      icon: PiggyBank,
      color: 'bg-blue-500',
      percentage: getAssetPercentage(assets.bankBalance, assets.totalAssets),
    },
    {
      label: '投资',
      value: assets.investments,
      icon: TrendingUp,
      color: 'bg-purple-500',
      percentage: getAssetPercentage(assets.investments, assets.totalAssets),
    },
    {
      label: '房产',
      value: assets.realEstateValue,
      icon: Home,
      color: 'bg-orange-500',
      percentage: getAssetPercentage(assets.realEstateValue, assets.totalAssets),
    },
    {
      label: '商业',
      value: assets.businessValue,
      icon: Building2,
      color: 'bg-red-500',
      percentage: getAssetPercentage(assets.businessValue, assets.totalAssets),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Total Assets Card */}
      <Card className="bg-gradient-to-r from-cyan-600 to-blue-600 border-0">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-cyan-100 text-sm mb-2">总资产</p>
            <h2 className="text-4xl font-bold text-white">{formatCurrency(assets.totalAssets)}</h2>
          </div>
        </CardContent>
      </Card>

      {/* Asset Breakdown */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">资产分布</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {assetBreakdown.map((asset) => {
            const Icon = asset.icon;
            return (
              <div key={asset.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300 text-sm">{asset.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold text-sm">{formatCurrency(asset.value)}</p>
                    <p className="text-slate-400 text-xs">{asset.percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${asset.color} transition-all`}
                    style={{ width: `${asset.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Asset Details */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">详细信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700 p-3 rounded">
              <p className="text-slate-400 text-xs mb-1">现金</p>
              <p className="text-white font-semibold">{formatCurrency(assets.iscBalance)}</p>
            </div>
            <div className="bg-slate-700 p-3 rounded">
              <p className="text-slate-400 text-xs mb-1">银行存款</p>
              <p className="text-white font-semibold">{formatCurrency(assets.bankBalance)}</p>
            </div>
            <div className="bg-slate-700 p-3 rounded">
              <p className="text-slate-400 text-xs mb-1">投资</p>
              <p className="text-white font-semibold">{formatCurrency(assets.investments)}</p>
            </div>
            <div className="bg-slate-700 p-3 rounded">
              <p className="text-slate-400 text-xs mb-1">房产价值</p>
              <p className="text-white font-semibold">{formatCurrency(assets.realEstateValue)}</p>
            </div>
            <div className="bg-slate-700 p-3 rounded col-span-2">
              <p className="text-slate-400 text-xs mb-1">商业价值</p>
              <p className="text-white font-semibold">{formatCurrency(assets.businessValue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wealth Tips */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">财富提示</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li>• 定期存入银行以获得 7% 的年利息</li>
            <li>• 投资房产和商业可以增加被动收入</li>
            <li>• 多元化投资可以降低风险</li>
            <li>• 参与游戏事件可以获得额外奖励</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
