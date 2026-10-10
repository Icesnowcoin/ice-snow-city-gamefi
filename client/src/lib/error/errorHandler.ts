/**
 * 错误处理模块
 * 提供统一的错误处理和恢复机制
 */

export enum ErrorCode {
  // 网络错误
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  CONNECTION_LOST = "CONNECTION_LOST",

  // 认证错误
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",

  // 验证错误
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",

  // 服务器错误
  SERVER_ERROR = "SERVER_ERROR",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",

  // 业务错误
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  ITEM_NOT_FOUND = "ITEM_NOT_FOUND",
  OPERATION_FAILED = "OPERATION_FAILED",

  // 系统错误
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  MAINTENANCE = "MAINTENANCE",
}

export interface AppError {
  code: ErrorCode;
  message: string;
  statusCode?: number;
  details?: Record<string, any>;
  originalError?: Error;
  timestamp: string;
  requestId?: string;
}

/**
 * 应用错误类
 */
export class ApplicationError extends Error implements AppError {
  code: ErrorCode;
  message: string;
  statusCode?: number;
  details?: Record<string, any>;
  originalError?: Error;
  timestamp: string;
  requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      statusCode?: number;
      details?: Record<string, any>;
      originalError?: Error;
      requestId?: string;
    }
  ) {
    super(message);
    this.code = code;
    this.message = message;
    this.statusCode = options?.statusCode;
    this.details = options?.details;
    this.originalError = options?.originalError;
    this.timestamp = new Date().toISOString();
    this.requestId = options?.requestId;

    Object.setPrototypeOf(this, ApplicationError.prototype);
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
    };
  }
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  private static errorListeners: Array<(error: AppError) => void> = [];
  private static retryStrategies = new Map<ErrorCode, (error: AppError) => boolean>();

  /**
   * 注册错误监听器
   */
  static onError(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * 处理错误
   */
  static handle(error: unknown, requestId?: string): AppError {
    let appError: AppError;

    if (error instanceof ApplicationError) {
      appError = error.toJSON();
    } else if (error instanceof Error) {
      appError = this.parseError(error, requestId);
    } else if (typeof error === "string") {
      appError = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: error,
        timestamp: new Date().toISOString(),
        requestId,
      };
    } else {
      appError = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: "An unknown error occurred",
        timestamp: new Date().toISOString(),
        requestId,
        details: error as Record<string, any>,
      };
    }

    // 通知所有监听器
    this.errorListeners.forEach((listener) => {
      try {
        listener(appError);
      } catch (err) {
        console.error("Error in error listener:", err);
      }
    });

    return appError;
  }

  /**
   * 解析错误
   */
  private static parseError(error: Error, requestId?: string): AppError {
    const message = error.message || "Unknown error";

    // 根据错误消息判断错误类型
    if (message.includes("timeout") || message.includes("TIMEOUT")) {
      return {
        code: ErrorCode.TIMEOUT,
        message: "Request timeout",
        timestamp: new Date().toISOString(),
        requestId,
        originalError: error,
      };
    }

    if (message.includes("network") || message.includes("NETWORK")) {
      return {
        code: ErrorCode.NETWORK_ERROR,
        message: "Network error",
        timestamp: new Date().toISOString(),
        requestId,
        originalError: error,
      };
    }

    if (message.includes("401") || message.includes("unauthorized")) {
      return {
        code: ErrorCode.UNAUTHORIZED,
        message: "Unauthorized",
        statusCode: 401,
        timestamp: new Date().toISOString(),
        requestId,
        originalError: error,
      };
    }

    if (message.includes("403") || message.includes("forbidden")) {
      return {
        code: ErrorCode.FORBIDDEN,
        message: "Forbidden",
        statusCode: 403,
        timestamp: new Date().toISOString(),
        requestId,
        originalError: error,
      };
    }

    if (message.includes("404") || message.includes("not found")) {
      return {
        code: ErrorCode.NOT_FOUND,
        message: "Not found",
        statusCode: 404,
        timestamp: new Date().toISOString(),
        requestId,
        originalError: error,
      };
    }

    if (message.includes("500") || message.includes("server error")) {
      return {
        code: ErrorCode.SERVER_ERROR,
        message: "Server error",
        statusCode: 500,
        timestamp: new Date().toISOString(),
        requestId,
        originalError: error,
      };
    }

    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message,
      timestamp: new Date().toISOString(),
      requestId,
      originalError: error,
    };
  }

  /**
   * 判断是否可以重试
   */
  static canRetry(error: AppError): boolean {
    // 网络错误可以重试
    if (error.code === ErrorCode.NETWORK_ERROR) {
      return true;
    }

    // 超时错误可以重试
    if (error.code === ErrorCode.TIMEOUT) {
      return true;
    }

    // 连接丢失可以重试
    if (error.code === ErrorCode.CONNECTION_LOST) {
      return true;
    }

    // 服务器错误可以重试
    if (error.code === ErrorCode.SERVER_ERROR) {
      return true;
    }

    // 检查自定义重试策略
    const strategy = this.retryStrategies.get(error.code);
    if (strategy) {
      return strategy(error);
    }

    return false;
  }

  /**
   * 注册重试策略
   */
  static registerRetryStrategy(
    errorCode: ErrorCode,
    strategy: (error: AppError) => boolean
  ): void {
    this.retryStrategies.set(errorCode, strategy);
  }

  /**
   * 获取用户友好的错误消息
   */
  static getUserMessage(error: AppError): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.NETWORK_ERROR]: "Network connection failed. Please check your internet connection.",
      [ErrorCode.TIMEOUT]: "Request timeout. Please try again.",
      [ErrorCode.CONNECTION_LOST]: "Connection lost. Reconnecting...",
      [ErrorCode.UNAUTHORIZED]: "You are not authorized. Please log in again.",
      [ErrorCode.FORBIDDEN]: "You do not have permission to perform this action.",
      [ErrorCode.TOKEN_EXPIRED]: "Your session has expired. Please log in again.",
      [ErrorCode.VALIDATION_ERROR]: "Invalid input. Please check your data.",
      [ErrorCode.INVALID_INPUT]: "Invalid input format.",
      [ErrorCode.SERVER_ERROR]: "Server error. Please try again later.",
      [ErrorCode.NOT_FOUND]: "Resource not found.",
      [ErrorCode.CONFLICT]: "Operation conflict. Please try again.",
      [ErrorCode.INSUFFICIENT_BALANCE]: "Insufficient balance. Please add funds.",
      [ErrorCode.ITEM_NOT_FOUND]: "Item not found.",
      [ErrorCode.OPERATION_FAILED]: "Operation failed. Please try again.",
      [ErrorCode.UNKNOWN_ERROR]: "An unknown error occurred. Please try again.",
      [ErrorCode.MAINTENANCE]: "Server is under maintenance. Please try again later.",
    };

    return messages[error.code] || error.message;
  }

  /**
   * 清除所有监听器
   */
  static clearListeners(): void {
    this.errorListeners = [];
  }
}

/**
 * 创建应用错误
 */
export function createError(
  code: ErrorCode,
  message: string,
  options?: {
    statusCode?: number;
    details?: Record<string, any>;
    originalError?: Error;
    requestId?: string;
  }
): ApplicationError {
  return new ApplicationError(code, message, options);
}

/**
 * 处理 API 响应错误
 */
export function handleApiError(response: any, requestId?: string): AppError {
  if (response?.error) {
    return {
      code: (response.error.code as ErrorCode) || ErrorCode.SERVER_ERROR,
      message: response.error.message || "API error",
      statusCode: response.statusCode,
      details: response.error.details,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: "Unknown API error",
    timestamp: new Date().toISOString(),
    requestId,
  };
}

/**
 * 重试执行函数
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
    shouldRetry?: (error: AppError) => boolean;
  }
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const delay = options?.delay ?? 1000;
  const backoff = options?.backoff ?? 2;
  const shouldRetry = options?.shouldRetry ?? ((error) => ErrorHandler.canRetry(error));

  let lastError: AppError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = ErrorHandler.handle(error);

      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        throw lastError;
      }

      const waitTime = delay * Math.pow(backoff, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError || new Error("Retry failed");
}
