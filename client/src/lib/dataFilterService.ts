/**
 * 数据筛选服务
 * 支持多维度筛选、排序和数据处理
 */

/**
 * 筛选条件类型
 */
export type FilterOperator = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'between' | 'in' | 'notIn' | 'regex' | 'startsWith' | 'endsWith';

/**
 * 筛选条件接口
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
  value2?: any; // 用于 between 操作
  caseSensitive?: boolean;
}

/**
 * 筛选组接口（支持 AND/OR）
 */
export interface FilterGroup {
  conditions: (FilterCondition | FilterGroup)[];
  logic: 'AND' | 'OR';
}

/**
 * 排序规则接口
 */
export interface SortRule {
  field: string;
  direction: 'asc' | 'desc';
  priority?: number;
}

/**
 * 筛选配置接口
 */
export interface FilterConfig {
  filters?: FilterCondition[];
  filterGroups?: FilterGroup[];
  sorts?: SortRule[];
  limit?: number;
  offset?: number;
}

/**
 * 数据筛选服务
 */
export class DataFilterService {
  /**
   * 检查单个条件是否匹配
   */
  private matchesCondition(item: Record<string, any>, condition: FilterCondition): boolean {
    const fieldValue = this.getNestedValue(item, condition.field);
    const { operator, value, value2, caseSensitive = false } = condition;

    // 处理空值
    if (fieldValue === null || fieldValue === undefined) {
      return operator === 'equals' ? value === null || value === undefined : false;
    }

    // 转换为字符串用于字符串操作
    const strValue = String(fieldValue);
    const strConditionValue = String(value);

    switch (operator) {
      case 'equals':
        return caseSensitive ? strValue === strConditionValue : strValue.toLowerCase() === strConditionValue.toLowerCase();

      case 'notEquals':
        return caseSensitive ? strValue !== strConditionValue : strValue.toLowerCase() !== strConditionValue.toLowerCase();

      case 'contains':
        return caseSensitive ? strValue.includes(strConditionValue) : strValue.toLowerCase().includes(strConditionValue.toLowerCase());

      case 'notContains':
        return caseSensitive ? !strValue.includes(strConditionValue) : !strValue.toLowerCase().includes(strConditionValue.toLowerCase());

      case 'startsWith':
        return caseSensitive ? strValue.startsWith(strConditionValue) : strValue.toLowerCase().startsWith(strConditionValue.toLowerCase());

      case 'endsWith':
        return caseSensitive ? strValue.endsWith(strConditionValue) : strValue.toLowerCase().endsWith(strConditionValue.toLowerCase());

      case 'greaterThan':
        return Number(fieldValue) > Number(value);

      case 'lessThan':
        return Number(fieldValue) < Number(value);

      case 'greaterThanOrEqual':
        return Number(fieldValue) >= Number(value);

      case 'lessThanOrEqual':
        return Number(fieldValue) <= Number(value);

      case 'between':
        return Number(fieldValue) >= Number(value) && Number(fieldValue) <= Number(value2);

      case 'in':
        return Array.isArray(value) ? value.includes(fieldValue) : false;

      case 'notIn':
        return Array.isArray(value) ? !value.includes(fieldValue) : true;

      case 'regex':
        try {
          const regex = new RegExp(value, caseSensitive ? '' : 'i');
          return regex.test(strValue);
        } catch {
          return false;
        }

      default:
        return true;
    }
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * 检查筛选组是否匹配
   */
  private matchesFilterGroup(item: Record<string, any>, group: FilterGroup): boolean {
    const results = group.conditions.map((condition) => {
      if ('conditions' in condition) {
        // 是一个筛选组
        return this.matchesFilterGroup(item, condition as FilterGroup);
      } else {
        // 是一个条件
        return this.matchesCondition(item, condition as FilterCondition);
      }
    });

    return group.logic === 'AND' ? results.every((r) => r) : results.some((r) => r);
  }

  /**
   * 应用筛选条件
   */
  filter(data: Record<string, any>[], conditions: FilterCondition[]): Record<string, any>[] {
    if (!conditions || conditions.length === 0) {
      return data;
    }

    return data.filter((item) => conditions.every((condition) => this.matchesCondition(item, condition)));
  }

  /**
   * 应用筛选组
   */
  filterByGroup(data: Record<string, any>[], group: FilterGroup): Record<string, any>[] {
    return data.filter((item) => this.matchesFilterGroup(item, group));
  }

  /**
   * 排序数据
   */
  sort(data: Record<string, any>[], rules: SortRule[]): Record<string, any>[] {
    if (!rules || rules.length === 0) {
      return data;
    }

    const sortedRules = rules.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

    return [...data].sort((a, b) => {
      for (const rule of sortedRules) {
        const aValue = this.getNestedValue(a, rule.field);
        const bValue = this.getNestedValue(b, rule.field);

        let comparison = 0;

        if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        }

        if (comparison !== 0) {
          return rule.direction === 'asc' ? comparison : -comparison;
        }
      }

      return 0;
    });
  }

  /**
   * 应用完整筛选配置
   */
  apply(data: Record<string, any>[], config: FilterConfig): Record<string, any>[] {
    let result = data;

    // 应用筛选条件
    if (config.filters && config.filters.length > 0) {
      result = this.filter(result, config.filters);
    }

    // 应用筛选组
    if (config.filterGroups && config.filterGroups.length > 0) {
      for (const group of config.filterGroups) {
        result = this.filterByGroup(result, group);
      }
    }

    // 应用排序
    if (config.sorts && config.sorts.length > 0) {
      result = this.sort(result, config.sorts);
    }

    // 应用分页
    if (config.offset !== undefined || config.limit !== undefined) {
      const offset = config.offset ?? 0;
      const limit = config.limit ?? result.length;
      result = result.slice(offset, offset + limit);
    }

    return result;
  }

  /**
   * 获取唯一值（用于生成筛选选项）
   */
  getUniqueValues(data: Record<string, any>[], field: string): any[] {
    const values = data.map((item) => this.getNestedValue(item, field)).filter((v) => v !== null && v !== undefined);
    return Array.from(new Set(values));
  }

  /**
   * 获取数据统计
   */
  getStatistics(data: Record<string, any>[], field: string): {
    min: number;
    max: number;
    avg: number;
    sum: number;
    count: number;
  } {
    const values = data
      .map((item) => {
        const value = this.getNestedValue(item, field);
        return typeof value === 'number' ? value : Number(value);
      })
      .filter((v) => !isNaN(v));

    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, sum: 0, count: 0 };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / values.length,
      sum,
      count: values.length,
    };
  }

  /**
   * 创建预设筛选
   */
  createPreset(name: string, config: FilterConfig): { name: string; config: FilterConfig } {
    return { name, config };
  }

  /**
   * 合并筛选配置
   */
  mergeConfigs(configs: FilterConfig[]): FilterConfig {
    const merged: FilterConfig = {
      filters: [],
      filterGroups: [],
      sorts: [],
    };

    for (const config of configs) {
      if (config.filters) {
        merged.filters!.push(...config.filters);
      }
      if (config.filterGroups) {
        merged.filterGroups!.push(...config.filterGroups);
      }
      if (config.sorts) {
        merged.sorts!.push(...config.sorts);
      }
    }

    return merged;
  }

  /**
   * 验证筛选配置
   */
  validateConfig(config: FilterConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.filters) {
      for (const filter of config.filters) {
        if (!filter.field) {
          errors.push('筛选条件缺少字段名');
        }
        if (!filter.operator) {
          errors.push('筛选条件缺少操作符');
        }
        if (filter.operator === 'between' && (filter.value2 === undefined || filter.value2 === null)) {
          errors.push('between 操作符需要两个值');
        }
      }
    }

    if (config.sorts) {
      for (const sort of config.sorts) {
        if (!sort.field) {
          errors.push('排序规则缺少字段名');
        }
        if (!['asc', 'desc'].includes(sort.direction)) {
          errors.push('排序方向必须是 asc 或 desc');
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

/**
 * 创建全局数据筛选服务实例
 */
export const createDataFilterService = (): DataFilterService => {
  return new DataFilterService();
};

/**
 * 筛选服务单例
 */
let filterServiceInstance: DataFilterService | null = null;

export const getDataFilterService = (): DataFilterService => {
  if (!filterServiceInstance) {
    filterServiceInstance = createDataFilterService();
  }
  return filterServiceInstance;
};
