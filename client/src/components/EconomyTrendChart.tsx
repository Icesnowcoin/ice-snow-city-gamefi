import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface TrendDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface EconomyTrendChartProps {
  data: TrendDataPoint[];
  title: string;
  dataKey: string;
  chartType?: 'line' | 'bar';
  onChartTypeChange?: (type: 'line' | 'bar') => void;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: {
    line?: string;
    bar?: string;
    grid?: string;
  };
  isLoading?: boolean;
  error?: string | null;
}

/**
 * 轻量级经济趋势图表组件
 * 支持折线图和柱状图展示
 */
export const EconomyTrendChart: React.FC<EconomyTrendChartProps> = ({
  data,
  title,
  dataKey,
  chartType = 'line',
  onChartTypeChange,
  height = 300,
  showLegend = true,
  showGrid = true,
  colors = {
    line: '#3b82f6',
    bar: '#3b82f6',
    grid: '#e5e7eb',
  },
  isLoading = false,
  error = null,
}) => {
  const [selectedChartType, setSelectedChartType] = React.useState<'line' | 'bar'>(chartType);

  const handleChartTypeChange = (type: string) => {
    const newType = type as 'line' | 'bar';
    setSelectedChartType(newType);
    onChartTypeChange?.(newType);
  };

  // 计算数据统计
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return { min: 0, max: 0, avg: 0, total: 0 };
    }

    const values = data.map(d => (typeof d[dataKey] === 'number' ? d[dataKey] : 0));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const total = values.reduce((a, b) => a + b, 0);

    return { min, max, avg, total };
  }, [data, dataKey]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="text-red-600 text-sm font-medium">{error}</div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-80 text-gray-400">
          无可用数据
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* 标题和图表类型选择 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <Select value={selectedChartType} onValueChange={handleChartTypeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">折线图</SelectItem>
              <SelectItem value="bar">柱状图</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600">最小值</div>
            <div className="text-lg font-semibold text-blue-600">{stats.min.toFixed(2)}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600">最大值</div>
            <div className="text-lg font-semibold text-green-600">{stats.max.toFixed(2)}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600">平均值</div>
            <div className="text-lg font-semibold text-purple-600">{stats.avg.toFixed(2)}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600">总计</div>
            <div className="text-lg font-semibold text-orange-600">{stats.total.toFixed(2)}</div>
          </div>
        </div>

        {/* 图表 */}
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={height}>
            {selectedChartType === 'line' ? (
              <LineChart data={data}>
                {showGrid && <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />}
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: `1px solid ${colors.grid}`,
                    borderRadius: '8px',
                  }}
                />
                {showLegend && <Legend />}
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={colors.line}
                  dot={{ fill: colors.line, r: 4 }}
                  activeDot={{ r: 6 }}
                  strokeWidth={2}
                  isAnimationActive={true}
                />
              </LineChart>
            ) : (
              <BarChart data={data}>
                {showGrid && <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />}
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: `1px solid ${colors.grid}`,
                    borderRadius: '8px',
                  }}
                />
                {showLegend && <Legend />}
                <Bar
                  dataKey={dataKey}
                  fill={colors.bar}
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};

/**
 * 多数据集趋势图表组件
 */
export interface MultiSeriesTrendChartProps {
  data: TrendDataPoint[];
  title: string;
  dataKeys: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  chartType?: 'line' | 'bar';
  onChartTypeChange?: (type: 'line' | 'bar') => void;
  height?: number;
  isLoading?: boolean;
  error?: string | null;
}

export const MultiSeriesTrendChart: React.FC<MultiSeriesTrendChartProps> = ({
  data,
  title,
  dataKeys,
  chartType = 'line',
  onChartTypeChange,
  height = 350,
  isLoading = false,
  error = null,
}) => {
  const [selectedChartType, setSelectedChartType] = React.useState<'line' | 'bar'>(chartType);

  const handleChartTypeChange = (type: string) => {
    const newType = type as 'line' | 'bar';
    setSelectedChartType(newType);
    onChartTypeChange?.(newType);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="text-red-600 text-sm font-medium">{error}</div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-96 text-gray-400">
          无可用数据
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* 标题和图表类型选择 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <Select value={selectedChartType} onValueChange={handleChartTypeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">折线图</SelectItem>
              <SelectItem value="bar">柱状图</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 图表 */}
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={height}>
            {selectedChartType === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                {dataKeys.map((item) => (
                  <Line
                    key={item.key}
                    type="monotone"
                    dataKey={item.key}
                    stroke={item.color}
                    name={item.name}
                    dot={{ fill: item.color, r: 3 }}
                    activeDot={{ r: 5 }}
                    strokeWidth={2}
                    isAnimationActive={true}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                {dataKeys.map((item) => (
                  <Bar
                    key={item.key}
                    dataKey={item.key}
                    fill={item.color}
                    name={item.name}
                    radius={[8, 8, 0, 0]}
                    isAnimationActive={true}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};

export default EconomyTrendChart;
