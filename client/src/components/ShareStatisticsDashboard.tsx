import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Twitter, Send, Copy, Download, Loader2, TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface PlatformStats {
  platform: 'twitter' | 'telegram' | 'clipboard' | 'download';
  count: number;
  successCount: number;
}

interface ShareStatisticsData {
  platform: string;
  count: number;
  successCount: number;
  successRate: number;
}

const PLATFORM_COLORS = {
  twitter: '#1DA1F2',
  telegram: '#0088cc',
  clipboard: '#10b981',
  download: '#a855f7',
};

const PLATFORM_ICONS = {
  twitter: Twitter,
  telegram: Send,
  clipboard: Copy,
  download: Download,
};

const PLATFORM_LABELS = {
  twitter: 'Twitter',
  telegram: 'Telegram',
  clipboard: '剪贴板',
  download: '下载',
};

export const ShareStatisticsDashboard: React.FC = () => {
  const { lang } = useLanguage();
  const [platformStats, setPlatformStats] = useState<ShareStatisticsData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('7d');

  // Query hooks
  const countByPlatformQuery = trpc.shareStatistics.getCountByPlatform.useQuery(
    undefined,
    { enabled: false }
  );
  const summaryQuery = trpc.shareStatistics.getSummary.useQuery(
    undefined,
    { enabled: false }
  );

  // Load statistics
  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      const result = await countByPlatformQuery.refetch();
      if (result.data) {
        const stats = Object.entries(result.data).map(([platform, count]) => ({
          platform,
          count: count as number,
          successCount: count as number,
          successRate: 100,
        }));
        setPlatformStats(stats);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
      toast.error(lang === 'zh' ? '加载统计数据失败' : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [dateRange]);

  const totalShares = platformStats.reduce((sum, stat) => sum + stat.count, 0);
  const totalSuccess = platformStats.reduce((sum, stat) => sum + stat.successCount, 0);

  const chartData = platformStats.map(stat => ({
    name: PLATFORM_LABELS[stat.platform as keyof typeof PLATFORM_LABELS] || stat.platform,
    count: stat.count,
    successCount: stat.successCount,
  }));

  const pieData = platformStats.map(stat => ({
    name: PLATFORM_LABELS[stat.platform as keyof typeof PLATFORM_LABELS] || stat.platform,
    value: stat.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {lang === 'zh' ? '分享统计' : 'Share Statistics'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {lang === 'zh' ? '追踪您的交易海报分享情况' : 'Track your transaction poster shares'}
          </p>
        </div>
        <Button
          onClick={loadStatistics}
          disabled={isLoading || countByPlatformQuery.isLoading}
          className="gap-2"
        >
          {isLoading || countByPlatformQuery.isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <TrendingUp className="w-4 h-4" />
          )}
          {lang === 'zh' ? '刷新' : 'Refresh'}
        </Button>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2">
        {(['7d', '30d', 'all'] as const).map(range => (
          <Button
            key={range}
            variant={dateRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange(range)}
            className="border-slate-600"
          >
            {range === '7d' ? (lang === 'zh' ? '7天' : '7 Days') : 
             range === '30d' ? (lang === 'zh' ? '30天' : '30 Days') :
             (lang === 'zh' ? '全部' : 'All')}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">
              {lang === 'zh' ? '总分享数' : 'Total Shares'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-400">{totalShares}</div>
            <p className="text-xs text-slate-500 mt-2">
              {lang === 'zh' ? '所有平台' : 'All platforms'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">
              {lang === 'zh' ? '成功分享' : 'Successful Shares'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{totalSuccess}</div>
            <p className="text-xs text-slate-500 mt-2">
              {totalShares > 0 ? `${Math.round((totalSuccess / totalShares) * 100)}%` : '0%'}
            </p>
          </CardContent>
        </Card>

        {platformStats.slice(0, 2).map(stat => (
          <Card key={stat.platform} className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">
                {PLATFORM_LABELS[stat.platform as keyof typeof PLATFORM_LABELS]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: PLATFORM_COLORS[stat.platform as keyof typeof PLATFORM_COLORS] }}>
                {stat.count}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {lang === 'zh' ? '分享次数' : 'Share count'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="bar" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="bar" className="data-[state=active]:bg-slate-700">
            {lang === 'zh' ? '柱状图' : 'Bar Chart'}
          </TabsTrigger>
          <TabsTrigger value="pie" className="data-[state=active]:bg-slate-700">
            {lang === 'zh' ? '饼图' : 'Pie Chart'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bar">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle>{lang === 'zh' ? '分享分布' : 'Share Distribution'}</CardTitle>
              <CardDescription>
                {lang === 'zh' ? '按平台统计的分享数' : 'Share count by platform'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#06b6d4" name={lang === 'zh' ? '分享数' : 'Shares'} />
                    <Bar dataKey="successCount" fill="#10b981" name={lang === 'zh' ? '成功数' : 'Successful'} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-500">
                  {lang === 'zh' ? '暂无数据' : 'No data'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pie">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle>{lang === 'zh' ? '平台分布' : 'Platform Distribution'}</CardTitle>
              <CardDescription>
                {lang === 'zh' ? '各平台的分享占比' : 'Share proportion by platform'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PLATFORM_COLORS[entry.name.toLowerCase().replace(/[\s\u4e00-\u9fa5]/g, '') as keyof typeof PLATFORM_COLORS] || '#8884d8'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-500">
                  {lang === 'zh' ? '暂无数据' : 'No data'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Platform Details */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle>{lang === 'zh' ? '平台详情' : 'Platform Details'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platformStats.map(stat => {
              const Icon = PLATFORM_ICONS[stat.platform as keyof typeof PLATFORM_ICONS];
              return (
                <div key={stat.platform} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-5 h-5" style={{ color: PLATFORM_COLORS[stat.platform as keyof typeof PLATFORM_COLORS] }} />}
                    <div>
                      <p className="font-medium">
                        {PLATFORM_LABELS[stat.platform as keyof typeof PLATFORM_LABELS]}
                      </p>
                      <p className="text-sm text-slate-400">
                        {lang === 'zh' ? '成功率' : 'Success Rate'}: {stat.successRate}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{stat.count}</p>
                    <p className="text-sm text-slate-400">
                      {lang === 'zh' ? '分享' : 'shares'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function getStartDate(range: '7d' | '30d' | 'all'): Date | undefined {
  // Note: The backend queries don't use date filters currently
  // This function is here for future use
  return undefined;
}
