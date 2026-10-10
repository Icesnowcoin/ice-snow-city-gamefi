import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataFilterControl } from '@/components/DataFilterControl';
import { DataFilterService, FilterConfig } from '@/lib/dataFilterService';
import { DataExportControl } from '@/components/DataExportControl';
import { EconomyTrendChart, MultiSeriesTrendChart, TrendDataPoint } from '@/components/EconomyTrendChart';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface FilteredTableProps {
  data: Record<string, any>[];
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any) => React.ReactNode;
  }>;
  title: string;
  description?: string;
  onFilterChange?: (filteredData: Record<string, any>[]) => void | undefined;
  showChart?: boolean;
  chartConfig?: {
    dataKey: string;
    chartType?: 'line' | 'bar';
    height?: number;
  };
}

const FilteredTable: React.FC<FilteredTableProps> = ({
  data,
  columns,
  title,
  description,
  onFilterChange,
  showChart = false,
  chartConfig,
}) => {
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({});
  const [chartType, setChartType] = useState<'line' | 'bar'>(chartConfig?.chartType || 'line');
  const filterService = new DataFilterService();

  // Apply filters and sorts to data
  const filteredData = useMemo(() => {
    return filterService.apply(data, filterConfig);
  }, [data, filterConfig, filterService]);

  // Notify parent of filtered data changes
  useMemo(() => {
    onFilterChange?.(filteredData);
  }, [filteredData, onFilterChange]);

  // Transform filtered data for chart
  const chartData = useMemo(() => {
    if (!showChart || !chartConfig || filteredData.length === 0) {
      return [];
    }

    return filteredData.map((item) => ({
      name: item[columns[0]?.key] || 'Unknown',
      [chartConfig.dataKey]: item[chartConfig.dataKey] || 0,
      ...item,
    })) as TrendDataPoint[];
  }, [filteredData, showChart, chartConfig, columns]);

  const handleFilterChange = (filteredData: Record<string, any>[]) => {
    // Update parent component if needed
    onFilterChange?.(filteredData);
  };

  // Prepare export data format
  const getExportData = () => {
    return filteredData.map((row) =>
      columns.reduce(
        (acc, col) => {
          acc[col.label] = row[col.key];
          return acc;
        },
        {} as Record<string, any>
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Chart Section */}
      {showChart && chartConfig && chartData.length > 0 && (
        <EconomyTrendChart
          data={chartData}
          title={`${title} - 趋势图表`}
          dataKey={chartConfig.dataKey}
          chartType={chartType}
          onChartTypeChange={setChartType}
          height={chartConfig.height || 300}
          showLegend={true}
          showGrid={true}
          colors={{
            line: '#3b82f6',
            bar: '#3b82f6',
            grid: '#e5e7eb',
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Control */}
          <DataFilterControl
            data={data}
            fields={columns.map((col) => col.key)}
            onFilterChange={handleFilterChange}
            onConfigChange={(config) => {
              setFilterConfig(config);
            }}
          />

          {/* Export Control */}
          <div className="flex justify-end">
            <DataExportControl
              data={getExportData()}
              filename={`${title}-export`}
            />
          </div>

          {/* Filtered Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((row, idx) => (
                    <TableRow key={idx}>
                      {columns.map((col) => (
                        <TableCell key={`${idx}-${col.key}`}>
                          {col.render ? col.render(row[col.key]) : row[col.key]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                      没有匹配的数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">总记录数</p>
              <p className="text-lg font-semibold">{data.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">筛选结果</p>
              <p className="text-lg font-semibold">{filteredData.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">过滤条件</p>
              <p className="text-lg font-semibold">{filterConfig.filters?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">排序规则</p>
              <p className="text-lg font-semibold">{filterConfig.sorts?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface EconomyPanelWithFilterProps {
  marketData?: Array<{
    id: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    stock: number;
  }>;
  seasonData?: Array<{
    id: string;
    season: string;
    startDate: string;
    endDate: string;
    cropBonus: number;
    priceBonus: number;
  }>;
  bankData?: Array<{
    id: string;
    account: string;
    balance: number;
    interestRate: number;
    lastUpdate: string;
  }>;
}

export const EconomyPanelWithFilter: React.FC<EconomyPanelWithFilterProps> = ({
  marketData = [],
  seasonData = [],
  bankData = [],
}) => {
  const marketColumns = [
    { key: 'name', label: '商品名称' },
    {
      key: 'price',
      label: '价格 (ISC)',
      render: (value: number) => <span className="font-semibold">{value.toLocaleString()}</span>,
    },
    {
      key: 'change',
      label: '价格变化',
      render: (value: number) => (
        <span className={value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : ''}>
          {value > 0 ? '+' : ''}{value.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'changePercent',
      label: '变化百分比',
      render: (value: number) => (
        <div className="flex items-center gap-1">
          {value > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : value < 0 ? (
            <TrendingDown className="w-4 h-4 text-red-600" />
          ) : null}
          <span className={value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : ''}>
            {value > 0 ? '+' : ''}{value.toFixed(2)}%
          </span>
        </div>
      ),
    },
    {
      key: 'stock',
      label: '库存',
      render: (value: number) => <span>{value.toLocaleString()}</span>,
    },
  ];

  const seasonColumns = [
    { key: 'season', label: '季节' },
    { key: 'startDate', label: '开始日期' },
    { key: 'endDate', label: '结束日期' },
    {
      key: 'cropBonus',
      label: '作物奖励 (%)',
      render: (value: number) => <span className="text-green-600">+{value}%</span>,
    },
    {
      key: 'priceBonus',
      label: '价格奖励 (%)',
      render: (value: number) => <span className="text-blue-600">+{value}%</span>,
    },
  ];

  const bankColumns = [
    { key: 'account', label: '账户名称' },
    {
      key: 'balance',
      label: '余额',
      render: (value: number) => <span className="font-semibold">{value.toLocaleString()}</span>,
    },
    {
      key: 'interestRate',
      label: '年利率 (%)',
      render: (value: number) => <span className="text-green-600">{value.toFixed(2)}%</span>,
    },
    { key: 'lastUpdate', label: '最后更新' },
  ];

  return (
    <Tabs defaultValue="market" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="market">市场价格</TabsTrigger>
        <TabsTrigger value="season">季节信息</TabsTrigger>
        <TabsTrigger value="bank">银行详情</TabsTrigger>
      </TabsList>

      <TabsContent value="market">
        <FilteredTable
          data={marketData}
          columns={marketColumns}
          title="市场价格"
          description="实时商品市场价格，支持筛选和排序"
          showChart={true}
          chartConfig={{
            dataKey: 'price',
            chartType: 'line',
            height: 300,
          }}
        />
      </TabsContent>

      <TabsContent value="season">
        <FilteredTable
          data={seasonData}
          columns={seasonColumns}
          title="季节信息"
          description="当前季节信息和奖励倍数"
          showChart={true}
          chartConfig={{
            dataKey: 'cropBonus',
            chartType: 'bar',
            height: 300,
          }}
        />
      </TabsContent>

      <TabsContent value="bank">
        <FilteredTable
          data={bankData}
          columns={bankColumns}
          title="银行详情"
          description="银行账户信息和利率详情"
          showChart={true}
          chartConfig={{
            dataKey: 'balance',
            chartType: 'line',
            height: 300,
          }}
        />
      </TabsContent>
    </Tabs>
  );
};

export default EconomyPanelWithFilter;
