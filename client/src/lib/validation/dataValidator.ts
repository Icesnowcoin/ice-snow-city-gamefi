/**
 * 数据验证模块
 * 提供统一的数据验证和错误处理
 */

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * 验证规则
 */
export interface ValidationRule {
  required?: boolean;
  type?: string;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  message?: string;
}

/**
 * 数据验证器
 */
export class DataValidator {
  private rules: Map<string, ValidationRule[]> = new Map();

  /**
   * 添加验证规则
   */
  addRule(field: string, rule: ValidationRule): void {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field)!.push(rule);
  }

  /**
   * 添加多个验证规则
   */
  addRules(rules: Record<string, ValidationRule | ValidationRule[]>): void {
    Object.entries(rules).forEach(([field, rule]) => {
      if (Array.isArray(rule)) {
        rule.forEach((r) => this.addRule(field, r));
      } else {
        this.addRule(field, rule);
      }
    });
  }

  /**
   * 验证数据
   */
  validate(data: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    this.rules.forEach((fieldRules, field) => {
      const value = data[field];

      for (const rule of fieldRules) {
        const error = this.validateField(field, value, rule);
        if (error) {
          errors.push(error);
        }
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证单个字段
   */
  private validateField(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationError | null {
    // 检查必填
    if (rule.required && (value === null || value === undefined || value === "")) {
      return {
        field,
        message: rule.message || `${field} is required`,
        code: "REQUIRED",
      };
    }

    if (value === null || value === undefined) {
      return null;
    }

    // 检查类型
    if (rule.type) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      if (actualType !== rule.type) {
        return {
          field,
          message: rule.message || `${field} must be of type ${rule.type}`,
          code: "TYPE_MISMATCH",
        };
      }
    }

    // 检查最小值
    if (rule.min !== undefined) {
      if (typeof value === "string" && value.length < rule.min) {
        return {
          field,
          message: rule.message || `${field} must be at least ${rule.min} characters`,
          code: "MIN_LENGTH",
        };
      }
      if (typeof value === "number" && value < rule.min) {
        return {
          field,
          message: rule.message || `${field} must be at least ${rule.min}`,
          code: "MIN_VALUE",
        };
      }
    }

    // 检查最大值
    if (rule.max !== undefined) {
      if (typeof value === "string" && value.length > rule.max) {
        return {
          field,
          message: rule.message || `${field} must be at most ${rule.max} characters`,
          code: "MAX_LENGTH",
        };
      }
      if (typeof value === "number" && value > rule.max) {
        return {
          field,
          message: rule.message || `${field} must be at most ${rule.max}`,
          code: "MAX_VALUE",
        };
      }
    }

    // 检查正则表达式
    if (rule.pattern && typeof value === "string") {
      if (!rule.pattern.test(value)) {
        return {
          field,
          message: rule.message || `${field} format is invalid`,
          code: "PATTERN_MISMATCH",
        };
      }
    }

    // 检查自定义验证
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        return {
          field,
          message: typeof result === "string" ? result : rule.message || `${field} validation failed`,
          code: "CUSTOM_VALIDATION",
        };
      }
    }

    return null;
  }

  /**
   * 清除规则
   */
  clear(): void {
    this.rules.clear();
  }
}

/**
 * 常用验证规则集合
 */
export const CommonValidationRules = {
  // 用户名验证
  username: {
    required: true,
    type: "string",
    min: 3,
    max: 20,
    pattern: /^[a-zA-Z0-9_-]+$/,
    message: "Username must be 3-20 characters, alphanumeric with _ or -",
  },

  // 邮箱验证
  email: {
    required: true,
    type: "string",
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Invalid email format",
  },

  // 密码验证
  password: {
    required: true,
    type: "string",
    min: 8,
    max: 50,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: "Password must be 8-50 characters with uppercase, lowercase, and number",
  },

  // 数字验证
  number: {
    type: "number",
    custom: (value: any) => !isNaN(value),
    message: "Must be a valid number",
  },

  // 正整数验证
  positiveInteger: {
    type: "number",
    min: 1,
    custom: (value: any) => Number.isInteger(value) && value > 0,
    message: "Must be a positive integer",
  },

  // URL 验证
  url: {
    type: "string",
    pattern: /^https?:\/\/.+/,
    message: "Invalid URL format",
  },

  // 手机号验证
  phone: {
    type: "string",
    pattern: /^1[3-9]\d{9}$/,
    message: "Invalid phone number",
  },

  // ID 卡验证
  idCard: {
    type: "string",
    pattern: /^\d{18}$/,
    message: "Invalid ID card number",
  },
};

/**
 * 快速验证函数
 */
export function validateUsername(username: string): ValidationResult {
  const validator = new DataValidator();
  validator.addRule("username", CommonValidationRules.username);
  return validator.validate({ username });
}

export function validateEmail(email: string): ValidationResult {
  const validator = new DataValidator();
  validator.addRule("email", CommonValidationRules.email);
  return validator.validate({ email });
}

export function validatePassword(password: string): ValidationResult {
  const validator = new DataValidator();
  validator.addRule("password", CommonValidationRules.password);
  return validator.validate({ password });
}

export function validateUrl(url: string): ValidationResult {
  const validator = new DataValidator();
  validator.addRule("url", CommonValidationRules.url);
  return validator.validate({ url });
}

export function validatePhone(phone: string): ValidationResult {
  const validator = new DataValidator();
  validator.addRule("phone", CommonValidationRules.phone);
  return validator.validate({ phone });
}

/**
 * 数据清理函数
 */
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, "") // 移除 HTML 标签
    .replace(/\s+/g, " "); // 规范化空格
}

export function sanitizeNumber(num: any): number | null {
  const parsed = parseFloat(num);
  return isNaN(parsed) ? null : parsed;
}

export function sanitizeBoolean(value: any): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

/**
 * 数据转换函数
 */
export function toUpperCase(str: string): string {
  return str.toUpperCase();
}

export function toLowerCase(str: string): string {
  return str.toLowerCase();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toTitleCase(str: string): string {
  return str
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}
