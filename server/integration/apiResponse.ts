/**
 * 统一的 API 响应包装器
 * 确保所有 API 返回一致的格式
 */

import { randomUUID } from "crypto";

/**
 * 生成唯一的请求 ID
 */
function generateRequestId(): string {
  return randomUUID();
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  error?: ApiError;
  timestamp: string;
  requestId: string;
}

export interface ApiError {
  type: string;
  details?: any;
  stack?: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * 成功响应
 */
export function successResponse<T>(
  data: T,
  message: string = "Success",
  requestId: string = generateRequestId()
): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

/**
 * 分页成功响应
 */
export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  message: string = "Success",
  requestId: string = generateRequestId()
): ApiResponse<PaginatedData<T>> {
  return successResponse(
    {
      items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    },
    message,
    requestId
  );
}

/**
 * 错误响应
 */
export function errorResponse(
  code: number,
  message: string,
  errorType: string,
  details?: any,
  requestId: string = generateRequestId()
): ApiResponse {
  return {
    code,
    message,
    error: {
      type: errorType,
      details,
    },
    timestamp: new Date().toISOString(),
    requestId,
  };
}

/**
 * 验证错误响应
 */
export function validationErrorResponse(
  details: any,
  requestId: string = generateRequestId()
): ApiResponse {
  return errorResponse(
    422,
    "Validation failed",
    "VALIDATION_ERROR",
    details,
    requestId
  );
}

/**
 * 认证错误响应
 */
export function authErrorResponse(
  message: string = "Unauthorized",
  requestId: string = generateRequestId()
): ApiResponse {
  return errorResponse(401, message, "AUTH_ERROR", undefined, requestId);
}

/**
 * 权限错误响应
 */
export function forbiddenErrorResponse(
  message: string = "Forbidden",
  requestId: string = generateRequestId()
): ApiResponse {
  return errorResponse(403, message, "FORBIDDEN", undefined, requestId);
}

/**
 * 资源不存在错误响应
 */
export function notFoundErrorResponse(
  resource: string = "Resource",
  requestId: string = generateRequestId()
): ApiResponse {
  return errorResponse(
    404,
    `${resource} not found`,
    "NOT_FOUND",
    { resource },
    requestId
  );
}

/**
 * 冲突错误响应
 */
export function conflictErrorResponse(
  message: string = "Resource conflict",
  details?: any,
  requestId: string = generateRequestId()
): ApiResponse {
  return errorResponse(409, message, "CONFLICT", details, requestId);
}

/**
 * 速率限制错误响应
 */
export function rateLimitErrorResponse(
  retryAfter: number,
  requestId: string = generateRequestId()
): ApiResponse {
  return errorResponse(
    429,
    "Too many requests",
    "RATE_LIMIT_EXCEEDED",
    { retryAfter },
    requestId
  );
}

/**
 * 服务器错误响应
 */
export function serverErrorResponse(
  message: string = "Internal server error",
  error?: any,
  requestId: string = generateRequestId()
): ApiResponse {
  return errorResponse(
    500,
    message,
    "SERVER_ERROR",
    {
      message: error?.message,
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
    },
    requestId
  );
}

/**
 * HTTP 状态码映射
 */
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * 错误代码定义
 */
export const ERROR_CODES = {
  // 认证相关 (1000-1999)
  AUTH_REQUIRED: 1001,
  AUTH_EXPIRED: 1002,
  AUTH_INVALID: 1003,

  // 授权相关 (2000-2999)
  PERMISSION_DENIED: 2001,
  OPERATION_DENIED: 2002,

  // 数据验证相关 (3000-3999)
  VALIDATION_FAILED: 3001,
  INVALID_FORMAT: 3002,

  // 业务逻辑相关 (4000-4999)
  RESOURCE_NOT_FOUND: 4001,
  RESOURCE_EXISTS: 4002,
  OPERATION_CONFLICT: 4003,
  INSUFFICIENT_BALANCE: 4004,
  INVALID_OPERATION: 4005,

  // 系统相关 (5000-5999)
  DATABASE_ERROR: 5001,
  SERVICE_UNAVAILABLE: 5002,
  EXTERNAL_SERVICE_ERROR: 5003,
} as const;

/**
 * 错误类型定义
 */
export const ERROR_TYPES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  SERVER_ERROR: "SERVER_ERROR",
  BUSINESS_ERROR: "BUSINESS_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
} as const;

/**
 * 请求上下文
 */
export interface RequestContext {
  requestId: string;
  userId?: string;
  timestamp: Date;
  method: string;
  path: string;
  ip?: string;
}

/**
 * 创建请求上下文
 */
export function createRequestContext(
  method: string,
  path: string,
  userId?: string,
  ip?: string
): RequestContext {
  return {
    requestId: generateRequestId(),
    userId,
    timestamp: new Date(),
    method,
    path,
    ip,
  };
}
