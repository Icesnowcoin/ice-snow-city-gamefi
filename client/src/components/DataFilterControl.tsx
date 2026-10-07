import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Copy, Save, X } from 'lucide-react';
import { DataFilterService, FilterCondition, SortRule, FilterConfig } from '@/lib/dataFilterService';
import { toast } from 'sonner';

/**
 * 筛选操作符选项
 */
const FILTER_OPERATORS = [
  { value: 'equals', label: '等于' },
  { value: 'notEquals', label: '不等于' },
  { value: 'contains', label: '包含' },
  { value: 'notContains', label: '不包含' },
  { value: 'startsWith', label: '开头为' },
  { value: 'endsWith', label: '结尾为' },
  { value: 'greaterThan', label: '大于' },
  { value: 'lessThan', label: '小于' },
  { value: 'greaterThanOrEqual', label: '大于等于' },
  { value: 'lessThanOrEqual', label: '小于等于' },
  { value: 'between', label: '范围' },
  { value: 'in', label: '在列表中' },
  { value: 'regex', label: '正则表达式' },
];

/**
 * 筛选条件编辑器组件
 */
interface FilterConditionEditorProps {
  condition: FilterCondition;
  fields: string[];
  onUpdate: (condition: FilterCondition) => void;
  onRemove: () => void;
}

const FilterConditionEditor: React.FC<FilterConditionEditorProps> = ({
  condition,
  fields,
  onUpdate,
  onRemove,
}) => {
  const handleFieldChange = (field: string) => {
    onUpdate({ ...condition, field });
  };

  const handleOperatorChange = (operator: string) => {
    onUpdate({ ...condition, operator: operator as any });
  };

  const handleValueChange = (value: string) => {
    onUpdate({ ...condition, value });
  };

  const handleValue2Change = (value2: string) => {
    onUpdate({ ...condition, value2 });
  };

  return (
    <div className="flex gap-2 items-end p-3 bg-secondary rounded-lg">
      <Select value={condition.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="选择字段" />
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field} value={field}>
              {field}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={condition.operator} onValueChange={handleOperatorChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="选择操作符" />
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPERATORS.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="值"
        value={condition.value || ''}
        onChange={(e) => handleValueChange(e.target.value)}
        className="flex-1"
      />

      {condition.operator === 'between' && (
        <Input
          placeholder="值2"
          value={condition.value2 || ''}
          onChange={(e) => handleValue2Change(e.target.value)}
          className="flex-1"
        />
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

/**
 * 排序规则编辑器组件
 */
interface SortRuleEditorProps {
  rule: SortRule;
  fields: string[];
  priority: number;
  onUpdate: (rule: SortRule) => void;
  onRemove: () => void;
}

const SortRuleEditor: React.FC<SortRuleEditorProps> = ({
  rule,
  fields,
  priority,
  onUpdate,
  onRemove,
}) => {
  return (
    <div className="flex gap-2 items-center p-3 bg-secondary rounded-lg">
      <Badge variant="outline" className="text-xs">
        优先级 {priority + 1}
      </Badge>

      <Select value={rule.field} onValueChange={(field) => onUpdate({ ...rule, field })}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="选择字段" />
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field} value={field}>
              {field}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={rule.direction} onValueChange={(direction) => onUpdate({ ...rule, direction: direction as 'asc' | 'desc' })}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="排序方向" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">升序</SelectItem>
          <SelectItem value="desc">降序</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-destructive hover:text-destructive ml-auto"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

/**
 * 数据筛选控制组件
 */
interface DataFilterControlProps {
  data: Record<string, any>[];
  fields: string[];
  onFilterChange?: (filteredData: Record<string, any>[]) => void;
  onConfigChange?: (config: FilterConfig) => void;
  showPreview?: boolean;
  maxPreviewRows?: number;
}

export const DataFilterControl: React.FC<DataFilterControlProps> = ({
  data,
  fields,
  onFilterChange,
  onConfigChange,
  showPreview = true,
  maxPreviewRows = 5,
}) => {
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [sorts, setSorts] = useState<SortRule[]>([]);
  const [presets, setPresets] = useState<Array<{ name: string; config: FilterConfig }>>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const filterService = useMemo(() => new DataFilterService(), []);

  // 应用筛选和排序
  const filteredData = useMemo(() => {
    const config: FilterConfig = { filters: conditions, sorts };
    return filterService.apply(data, config);
  }, [data, conditions, sorts, filterService]);

  // 通知变化
  React.useEffect(() => {
    onFilterChange?.(filteredData);
    onConfigChange?.({ filters: conditions, sorts });
  }, [filteredData, conditions, sorts, onFilterChange, onConfigChange]);

  // 添加筛选条件
  const addCondition = useCallback(() => {
    const newCondition: FilterCondition = {
      field: fields[0] || '',
      operator: 'equals',
      value: '',
    };
    setConditions([...conditions, newCondition]);
  }, [conditions, fields]);

  // 更新筛选条件
  const updateCondition = useCallback((index: number, condition: FilterCondition) => {
    const newConditions = [...conditions];
    newConditions[index] = condition;
    setConditions(newConditions);
  }, [conditions]);

  // 删除筛选条件
  const removeCondition = useCallback((index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  }, [conditions]);

  // 添加排序规则
  const addSort = useCallback(() => {
    const newSort: SortRule = {
      field: fields[0] || '',
      direction: 'asc',
      priority: sorts.length,
    };
    setSorts([...sorts, newSort]);
  }, [sorts, fields]);

  // 更新排序规则
  const updateSort = useCallback((index: number, sort: SortRule) => {
    const newSorts = [...sorts];
    newSorts[index] = { ...sort, priority: index };
    setSorts(newSorts);
  }, [sorts]);

  // 删除排序规则
  const removeSort = useCallback((index: number) => {
    setSorts(sorts.filter((_, i) => i !== index));
  }, [sorts]);

  // 清除所有筛选
  const clearFilters = useCallback(() => {
    setConditions([]);
    setSorts([]);
    setActivePreset(null);
    toast.info('已清除所有筛选条件');
  }, []);

  // 保存预设
  const savePreset = useCallback(() => {
    const name = prompt('请输入预设名称:');
    if (name) {
      const config: FilterConfig = { filters: conditions, sorts };
      setPresets([...presets, { name, config }]);
      toast.success(`预设 "${name}" 已保存`);
    }
  }, [conditions, sorts, presets]);

  // 应用预设
  const applyPreset = useCallback((preset: { name: string; config: FilterConfig }) => {
    setConditions(preset.config.filters || []);
    setSorts(preset.config.sorts || []);
    setActivePreset(preset.name);
    toast.info(`已应用预设 "${preset.name}"`);
  }, []);

  // 删除预设
  const deletePreset = useCallback((index: number) => {
    const name = presets[index].name;
    setPresets(presets.filter((_, i) => i !== index));
    if (activePreset === name) {
      setActivePreset(null);
    }
    toast.info(`预设 "${name}" 已删除`);
  }, [presets, activePreset]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>数据筛选和排序</CardTitle>
        <CardDescription>
          共 {data.length} 条数据，筛选后 {filteredData.length} 条
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="filters" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="filters">
              筛选条件 {conditions.length > 0 && `(${conditions.length})`}
            </TabsTrigger>
            <TabsTrigger value="sorts">
              排序规则 {sorts.length > 0 && `(${sorts.length})`}
            </TabsTrigger>
            <TabsTrigger value="presets">预设方案</TabsTrigger>
          </TabsList>

          {/* 筛选条件标签页 */}
          <TabsContent value="filters" className="space-y-3 mt-4">
            <div className="space-y-2">
              {conditions.map((condition, index) => (
                <FilterConditionEditor
                  key={index}
                  condition={condition}
                  fields={fields}
                  onUpdate={(c) => updateCondition(index, c)}
                  onRemove={() => removeCondition(index)}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={addCondition} variant="outline" size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                添加筛选条件
              </Button>
            </div>
          </TabsContent>

          {/* 排序规则标签页 */}
          <TabsContent value="sorts" className="space-y-3 mt-4">
            <div className="space-y-2">
              {sorts.map((sort, index) => (
                <SortRuleEditor
                  key={index}
                  rule={sort}
                  fields={fields}
                  priority={index}
                  onUpdate={(s) => updateSort(index, s)}
                  onRemove={() => removeSort(index)}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={addSort} variant="outline" size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                添加排序规则
              </Button>
            </div>
          </TabsContent>

          {/* 预设方案标签页 */}
          <TabsContent value="presets" className="space-y-3 mt-4">
            <div className="space-y-2">
              {presets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无预设方案，保存当前配置为预设
                </p>
              ) : (
                presets.map((preset, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      activePreset === preset.name ? 'bg-primary/10 border-primary' : 'bg-secondary hover:bg-secondary/80'
                    }`}
                    onClick={() => applyPreset(preset)}
                  >
                    <div>
                      <p className="font-medium text-sm">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {preset.config.filters?.length || 0} 个筛选，{preset.config.sorts?.length || 0} 个排序
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePreset(index);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <Button onClick={savePreset} variant="outline" size="sm" className="w-full" disabled={conditions.length === 0 && sorts.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              保存当前配置为预设
            </Button>
          </TabsContent>
        </Tabs>

        {/* 操作按钮 */}
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button onClick={clearFilters} variant="outline" size="sm" disabled={conditions.length === 0 && sorts.length === 0}>
            <X className="w-4 h-4 mr-2" />
            清除筛选
          </Button>
          <div className="flex-1" />
          <Badge variant="secondary">{filteredData.length} 条结果</Badge>
        </div>

        {/* 预览 */}
        {showPreview && filteredData.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium mb-3">预览（前 {Math.min(maxPreviewRows, filteredData.length)} 条）</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {fields.slice(0, 5).map((field) => (
                      <th key={field} className="text-left py-2 px-3 font-medium">
                        {field}
                      </th>
                    ))}
                    {fields.length > 5 && <th className="text-left py-2 px-3 font-medium">...</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, maxPreviewRows).map((row, index) => (
                    <tr key={index} className="border-b hover:bg-secondary/50">
                      {fields.slice(0, 5).map((field) => (
                        <td key={field} className="py-2 px-3 text-muted-foreground truncate">
                          {String(row[field] ?? '-')}
                        </td>
                      ))}
                      {fields.length > 5 && <td className="py-2 px-3 text-muted-foreground">...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataFilterControl;
