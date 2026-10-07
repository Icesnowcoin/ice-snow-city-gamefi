import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar, X } from 'lucide-react';

export interface FilterCriteria {
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  status?: 'success' | 'pending' | 'failed' | 'all';
  type?: 'deposit' | 'withdrawal' | 'refund' | 'fee' | 'income' | 'expense' | 'all';
}

interface TransactionFilterPanelProps {
  onFilterChange: (filters: FilterCriteria) => void;
  onReset: () => void;
}

export const TransactionFilterPanel: React.FC<TransactionFilterPanelProps> = ({
  onFilterChange,
  onReset,
}) => {
  const { lang } = useLanguage();
  const [filters, setFilters] = useState<FilterCriteria>({
    status: 'all',
    type: 'all',
  });

  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterCriteria>) => {
      const updated = { ...filters, ...newFilters };
      setFilters(updated);
      onFilterChange(updated);
    },
    [filters, onFilterChange]
  );

  const handleReset = useCallback(() => {
    setFilters({
      status: 'all',
      type: 'all',
    });
    onReset();
  }, [onReset]);

  const hasActiveFilters =
    filters.startDate ||
    filters.endDate ||
    filters.minAmount ||
    filters.maxAmount ||
    filters.status !== 'all' ||
    filters.type !== 'all';

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${hasActiveFilters ? 'bg-blue-500/10 border-blue-500' : ''}`}
        >
          <span className="text-lg">⚙️</span>
          {lang === 'zh' ? '高级筛选' : 'Advanced Filter'}
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {Object.values(filters).filter((v) => v && v !== 'all').length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {lang === 'zh' ? '筛选条件' : 'Filter Criteria'}
            </h3>
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                {lang === 'zh' ? '重置' : 'Reset'}
              </button>
            )}
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm">
              {lang === 'zh' ? '日期范围' : 'Date Range'}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  placeholder={lang === 'zh' ? '开始日期' : 'Start Date'}
                  value={formatDate(filters.startDate)}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    handleFilterChange({ startDate: date });
                  }}
                  className="pl-8 text-sm"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  placeholder={lang === 'zh' ? '结束日期' : 'End Date'}
                  value={formatDate(filters.endDate)}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    handleFilterChange({ endDate: date });
                  }}
                  className="pl-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Amount Range */}
          <div className="space-y-2">
            <Label className="text-sm">
              {lang === 'zh' ? '金额范围' : 'Amount Range'}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder={lang === 'zh' ? '最小' : 'Min'}
                value={filters.minAmount || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                  handleFilterChange({ minAmount: value });
                }}
                className="text-sm"
                min="0"
                step="0.01"
              />
              <Input
                type="number"
                placeholder={lang === 'zh' ? '最大' : 'Max'}
                value={filters.maxAmount || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                  handleFilterChange({ maxAmount: value });
                }}
                className="text-sm"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm">
              {lang === 'zh' ? '交易状态' : 'Transaction Status'}
            </Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                handleFilterChange({
                  status: value as 'success' | 'pending' | 'failed' | 'all',
                })
              }
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {lang === 'zh' ? '全部' : 'All'}
                </SelectItem>
                <SelectItem value="success">
                  {lang === 'zh' ? '成功' : 'Success'}
                </SelectItem>
                <SelectItem value="pending">
                  {lang === 'zh' ? '待处理' : 'Pending'}
                </SelectItem>
                <SelectItem value="failed">
                  {lang === 'zh' ? '失败' : 'Failed'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Type Filter */}
          <div className="space-y-2">
            <Label className="text-sm">
              {lang === 'zh' ? '交易类型' : 'Transaction Type'}
            </Label>
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) =>
                handleFilterChange({
                  type: value as
                    | 'deposit'
                    | 'withdrawal'
                    | 'refund'
                    | 'fee'
                    | 'income'
                    | 'expense'
                    | 'all',
                })
              }
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {lang === 'zh' ? '全部' : 'All'}
                </SelectItem>
                <SelectItem value="deposit">
                  {lang === 'zh' ? '充值' : 'Deposit'}
                </SelectItem>
                <SelectItem value="withdrawal">
                  {lang === 'zh' ? '提取' : 'Withdrawal'}
                </SelectItem>
                <SelectItem value="refund">
                  {lang === 'zh' ? '退款' : 'Refund'}
                </SelectItem>
                <SelectItem value="fee">
                  {lang === 'zh' ? '手续费' : 'Fee'}
                </SelectItem>
                <SelectItem value="income">
                  {lang === 'zh' ? '收入' : 'Income'}
                </SelectItem>
                <SelectItem value="expense">
                  {lang === 'zh' ? '支出' : 'Expense'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              {lang === 'zh' ? '应用' : 'Apply'}
            </Button>
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                {lang === 'zh' ? '清除' : 'Clear'}
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
