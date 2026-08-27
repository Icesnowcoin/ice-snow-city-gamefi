# 前端 API 集成指南 - Phase 2

## 概述

本文档详细说明前端如何修改代码来适配新的标准 API 响应格式。

---

## 1. 标准 API 响应格式回顾

### 1.1 成功响应
```json
{
  "code": 0,
  "message": "Success",
  "data": { /* 实际数据 */ },
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "uuid-123"
}
```

### 1.2 错误响应
```json
{
  "code": 400,
  "message": "Error message",
  "error": {
    "type": "VALIDATION_ERROR",
    "details": { /* 详细信息 */ }
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "uuid-123"
}
```

### 1.3 分页响应
```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "uuid-123"
}
```

---

## 2. 创建统一的 API 客户端

### 2.1 创建 API 响应类型定义

**文件：`client/src/lib/api/types.ts`**

```typescript
/**
 * API 响应类型定义
 */

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
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * 错误代码常量
 */
export const ERROR_CODES = {
  // 认证相关
  AUTH_REQUIRED: 1001,
  AUTH_EXPIRED: 1002,
  AUTH_INVALID: 1003,

  // 授权相关
  PERMISSION_DENIED: 2001,
  OPERATION_DENIED: 2002,

  // 数据验证相关
  VALIDATION_FAILED: 3001,
  INVALID_FORMAT: 3002,

  // 业务逻辑相关
  RESOURCE_NOT_FOUND: 4001,
  RESOURCE_EXISTS: 4002,
  OPERATION_CONFLICT: 4003,
  INSUFFICIENT_BALANCE: 4004,

  // 系统相关
  DATABASE_ERROR: 5001,
  SERVICE_UNAVAILABLE: 5002,
} as const;

/**
 * HTTP 状态码常量
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
```

### 2.2 创建 API 客户端

**文件：`client/src/lib/api/client.ts`**

```typescript
/**
 * 统一的 API 客户端
 */

import { ApiResponse, PaginatedData, ERROR_CODES } from "./types";

/**
 * API 客户端配置
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
}

/**
 * API 请求选项
 */
export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  retries?: number;
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    public code: number,
    public errorType: string,
    message: string,
    public details?: any,
    public requestId?: string
  ) {
    super(message);
    this.name = "ApiError";
  }

  /**
   * 是否是认证错误
   */
  isAuthError(): boolean {
    return [
      ERROR_CODES.AUTH_REQUIRED,
      ERROR_CODES.AUTH_EXPIRED,
      ERROR_CODES.AUTH_INVALID,
    ].includes(this.code);
  }

  /**
   * 是否是权限错误
   */
  isPermissionError(): boolean {
    return [ERROR_CODES.PERMISSION_DENIED, ERROR_CODES.OPERATION_DENIED].includes(
      this.code
    );
  }

  /**
   * 是否是验证错误
   */
  isValidationError(): boolean {
    return [ERROR_CODES.VALIDATION_FAILED, ERROR_CODES.INVALID_FORMAT].includes(
      this.code
    );
  }

  /**
   * 是否是业务错误
   */
  isBusinessError(): boolean {
    return this.code >= 4000 && this.code < 5000;
  }

  /**
   * 是否是服务器错误
   */
  isServerError(): boolean {
    return this.code >= 5000;
  }
}

/**
 * API 客户端
 */
export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
  }

  /**
   * 发送 GET 请求
   */
  async get<T = any>(
    url: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>("GET", url, undefined, options);
  }

  /**
   * 发送 POST 请求
   */
  async post<T = any>(
    url: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>("POST", url, data, options);
  }

  /**
   * 发送 PUT 请求
   */
  async put<T = any>(
    url: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>("PUT", url, data, options);
  }

  /**
   * 发送 DELETE 请求
   */
  async delete<T = any>(
    url: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>("DELETE", url, undefined, options);
  }

  /**
   * 发送请求（带重试）
   */
  private async request<T = any>(
    method: string,
    url: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    let lastError: Error | null = null;
    const retries = options?.retries ?? this.retries;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await this.fetchWithTimeout(
          method,
          url,
          data,
          options
        );

        // 检查响应格式
        if (!response.code) {
          throw new Error("Invalid API response format");
        }

        // 检查是否成功
        if (response.code !== 0) {
          throw new ApiError(
            response.code,
            response.error?.type || "UNKNOWN_ERROR",
            response.message,
            response.error?.details,
            response.requestId
          );
        }

        return response.data as T;
      } catch (error) {
        lastError = error as Error;

        // 如果是认证错误，不重试
        if (error instanceof ApiError && error.isAuthError()) {
          throw error;
        }

        // 如果是最后一次重试，抛出错误
        if (i === retries - 1) {
          throw error;
        }

        // 等待后重试（指数退避）
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, i))
        );
      }
    }

    throw lastError || new Error("Request failed after retries");
  }

  /**
   * 带超时的 fetch
   */
  private async fetchWithTimeout(
    method: string,
    url: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<ApiResponse> {
    const timeout = options?.timeout ?? this.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      const responseData: ApiResponse = await response.json();

      // 检查 HTTP 状态码
      if (!response.ok) {
        throw new ApiError(
          response.status,
          responseData.error?.type || "HTTP_ERROR",
          responseData.message || response.statusText,
          responseData.error?.details,
          responseData.requestId
        );
      }

      return responseData;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 获取分页数据
   */
  async getPaginated<T = any>(
    url: string,
    page: number = 1,
    pageSize: number = 20,
    options?: ApiRequestOptions
  ): Promise<PaginatedData<T>> {
    const params = {
      page,
      pageSize,
      ...options?.params,
    };

    const queryString = new URLSearchParams(params).toString();
    const fullUrl = `${url}?${queryString}`;

    return this.get<PaginatedData<T>>(fullUrl, options);
  }
}

/**
 * 创建全局 API 客户端实例
 */
export const apiClient = new ApiClient({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000/api",
  timeout: 30000,
  retries: 3,
});
```

### 2.3 创建错误处理工具

**文件：`client/src/lib/api/errorHandler.ts`**

```typescript
/**
 * API 错误处理工具
 */

import { ApiError } from "./client";
import { useToast } from "@/components/ui/use-toast";

/**
 * 错误消息映射
 */
const ERROR_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: "请登录后继续",
  AUTH_EXPIRED: "登录已过期，请重新登录",
  AUTH_INVALID: "认证信息无效",
  PERMISSION_DENIED: "您没有权限执行此操作",
  OPERATION_DENIED: "操作被拒绝",
  VALIDATION_FAILED: "数据验证失败",
  INVALID_FORMAT: "数据格式错误",
  RESOURCE_NOT_FOUND: "资源不存在",
  RESOURCE_EXISTS: "资源已存在",
  OPERATION_CONFLICT: "操作冲突",
  INSUFFICIENT_BALANCE: "余额不足",
  DATABASE_ERROR: "数据库错误",
  SERVICE_UNAVAILABLE: "服务暂时不可用",
};

/**
 * 处理 API 错误
 */
export function handleApiError(error: unknown): void {
  const { toast } = useToast();

  if (error instanceof ApiError) {
    // 获取错误消息
    const message =
      ERROR_MESSAGES[error.errorType] || error.message || "请求失败";

    // 根据错误类型显示不同的 toast
    if (error.isAuthError()) {
      toast({
        title: "认证错误",
        description: message,
        variant: "destructive",
      });
      // 可以在这里触发登录重定向
      // window.location.href = "/login";
    } else if (error.isPermissionError()) {
      toast({
        title: "权限错误",
        description: message,
        variant: "destructive",
      });
    } else if (error.isValidationError()) {
      toast({
        title: "验证错误",
        description: message,
        variant: "destructive",
      });
    } else if (error.isServerError()) {
      toast({
        title: "服务器错误",
        description: message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "错误",
        description: message,
        variant: "destructive",
      });
    }

    console.error("API Error:", {
      code: error.code,
      type: error.errorType,
      message: error.message,
      details: error.details,
      requestId: error.requestId,
    });
  } else if (error instanceof Error) {
    toast({
      title: "错误",
      description: error.message,
      variant: "destructive",
    });
  } else {
    toast({
      title: "错误",
      description: "发生未知错误",
      variant: "destructive",
    });
  }
}

/**
 * 获取用户友好的错误消息
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return ERROR_MESSAGES[error.errorType] || error.message;
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return "发生未知错误";
  }
}

/**
 * 是否应该重试
 */
export function shouldRetry(error: unknown): boolean {
  if (error instanceof ApiError) {
    // 认证错误不重试
    if (error.isAuthError()) return false;
    // 权限错误不重试
    if (error.isPermissionError()) return false;
    // 验证错误不重试
    if (error.isValidationError()) return false;
    // 其他错误可以重试
    return true;
  }
  return false;
}
```

---

## 3. 修改现有前端代码

### 3.1 修改好友系统（FriendsListContainer.tsx）

**原代码（使用本地状态）：**
```typescript
const handleAddFriend = async (playerId: string) => {
  // 直接修改本地状态
  setFriends([...friends, newFriend]);
  toast.success("好友添加成功");
};
```

**新代码（调用后端 API）：**
```typescript
import { apiClient, ApiError } from "@/lib/api/client";
import { handleApiError } from "@/lib/api/errorHandler";

const handleAddFriend = async (playerId: string) => {
  try {
    // 显示加载状态
    setLoading(true);

    // 调用后端 API
    const response = await apiClient.post("/friends/add", {
      friendId: playerId,
      message: "我想加你为好友",
    });

    // 后端返回新好友信息
    setFriends([...friends, response]);

    // 显示成功提示
    toast({
      title: "成功",
      description: "好友添加成功",
    });
  } catch (error) {
    // 统一处理错误
    handleApiError(error);
  } finally {
    setLoading(false);
  }
};
```

### 3.2 修改私聊系统（PrivateChatContainer.tsx）

**原代码：**
```typescript
const handleSendMessage = async (content: string) => {
  // 直接添加到本地消息列表
  const message = {
    id: Date.now(),
    content,
    sender: currentUser,
    timestamp: Date.now(),
  };
  setMessages([...messages, message]);
};
```

**新代码：**
```typescript
const handleSendMessage = async (content: string) => {
  try {
    setLoading(true);

    // 调用后端 API 发送消息
    const response = await apiClient.post("/chat/send", {
      recipientId: selectedFriend.id,
      content,
      type: "text",
    });

    // 后端返回消息对象（包含 ID、时间戳等）
    setMessages([...messages, response]);

    // 清空输入框
    setMessageInput("");

    // 显示成功提示
    toast({
      title: "成功",
      description: "消息已发送",
    });
  } catch (error) {
    handleApiError(error);
  } finally {
    setLoading(false);
  }
};
```

### 3.3 修改装备系统（EquipmentPanel.tsx）

**原代码：**
```typescript
const handleEquipItem = (itemId: string) => {
  // 直接修改本地状态
  const equipment = { ...currentEquipment };
  equipment[slot] = itemId;
  setCurrentEquipment(equipment);
};
```

**新代码：**
```typescript
const handleEquipItem = async (itemId: string, slot: string) => {
  try {
    setLoading(true);

    // 调用后端 API 穿戴装备
    const response = await apiClient.post("/equipment/equip", {
      itemId,
      slot,
    });

    // 后端返回更新后的装备信息
    setCurrentEquipment(response.equipment);
    setPlayerStats(response.stats);

    toast({
      title: "成功",
      description: "装备已穿戴",
    });
  } catch (error) {
    handleApiError(error);
  } finally {
    setLoading(false);
  }
};
```

### 3.4 修改工会系统（GuildPanel.tsx）

**原代码：**
```typescript
const handleCreateGuild = (guildName: string) => {
  // 直接创建本地工会
  const guild = {
    id: Date.now(),
    name: guildName,
    members: [currentUser],
  };
  setGuild(guild);
};
```

**新代码：**
```typescript
const handleCreateGuild = async (guildName: string) => {
  try {
    setLoading(true);

    // 调用后端 API 创建工会
    const response = await apiClient.post("/guild/create", {
      name: guildName,
      description: "",
    });

    // 后端返回工会信息
    setGuild(response);

    toast({
      title: "成功",
      description: "工会创建成功",
    });
  } catch (error) {
    handleApiError(error);
  } finally {
    setLoading(false);
  }
};
```

---

## 4. 创建 React Hook 简化 API 调用

### 4.1 创建通用 useApi Hook

**文件：`client/src/hooks/useApi.ts`**

```typescript
/**
 * 通用 API Hook
 */

import { useState, useCallback } from "react";
import { apiClient, ApiError } from "@/lib/api/client";
import { handleApiError } from "@/lib/api/errorHandler";

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  autoFetch?: boolean;
}

/**
 * 使用 API 的 Hook
 */
export function useApi<T = any>(
  url: string,
  options?: UseApiOptions
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // 获取数据
  const fetch = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const data = await apiClient.get<T>(url);
      setState({ data, loading: false, error: null });
      options?.onSuccess?.(data);
      return data;
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(500, "UNKNOWN", String(error));
      setState({ data: null, loading: false, error: apiError });
      options?.onError?.(apiError);
      throw error;
    }
  }, [url, options]);

  // 自动获取
  React.useEffect(() => {
    if (options?.autoFetch) {
      fetch();
    }
  }, [fetch, options?.autoFetch]);

  return { ...state, fetch };
}

/**
 * 使用 API 变更的 Hook
 */
export function useApiMutation<T = any>(
  options?: UseApiOptions
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // 执行变更
  const mutate = useCallback(
    async (method: "POST" | "PUT" | "DELETE", url: string, data?: any) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        let result: T;
        if (method === "POST") {
          result = await apiClient.post<T>(url, data);
        } else if (method === "PUT") {
          result = await apiClient.put<T>(url, data);
        } else {
          result = await apiClient.delete<T>(url);
        }

        setState({ data: result, loading: false, error: null });
        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        const apiError = error instanceof ApiError ? error : new ApiError(500, "UNKNOWN", String(error));
        setState({ data: null, loading: false, error: apiError });
        options?.onError?.(apiError);
        throw error;
      }
    },
    [options]
  );

  return { ...state, mutate };
}
```

### 4.2 使用 Hook 简化代码

**简化后的好友添加代码：**
```typescript
import { useApiMutation } from "@/hooks/useApi";

export function FriendsList() {
  const { mutate: addFriend, loading } = useApiMutation({
    onSuccess: (data) => {
      setFriends([...friends, data]);
      toast.success("好友添加成功");
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  const handleAddFriend = async (friendId: string) => {
    await addFriend("POST", "/friends/add", { friendId });
  };

  return (
    <button onClick={() => handleAddFriend("user-123")} disabled={loading}>
      {loading ? "添加中..." : "添加好友"}
    </button>
  );
}
```

---

## 5. 处理特殊场景

### 5.1 处理分页数据

```typescript
import { useApi } from "@/hooks/useApi";

export function FriendsList() {
  const [page, setPage] = useState(1);
  const { data: paginatedData, fetch } = useApi(
    `/friends/list?page=${page}&pageSize=20`,
    { autoFetch: true }
  );

  const handleNextPage = () => {
    if (paginatedData?.hasMore) {
      setPage(page + 1);
    }
  };

  return (
    <div>
      {paginatedData?.items.map((friend) => (
        <div key={friend.id}>{friend.name}</div>
      ))}
      <button onClick={handleNextPage} disabled={!paginatedData?.hasMore}>
        下一页
      </button>
    </div>
  );
}
```

### 5.2 处理乐观更新

```typescript
export function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const { mutate: addFriend } = useApiMutation();

  const handleAddFriend = async (friendId: string) => {
    // 乐观更新：立即显示新好友
    const optimisticFriend: Friend = {
      id: friendId,
      name: "加载中...",
      status: "pending",
    };
    setFriends([...friends, optimisticFriend]);

    try {
      // 调用 API
      const result = await addFriend("POST", "/friends/add", { friendId });

      // 用真实数据替换乐观数据
      setFriends((prev) =>
        prev.map((f) => (f.id === friendId ? result : f))
      );

      toast.success("好友添加成功");
    } catch (error) {
      // 错误时回滚乐观更新
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      handleApiError(error);
    }
  };

  return (
    // ...
  );
}
```

### 5.3 处理实时通信（WebSocket）

```typescript
import { useEffect } from "react";

export function PrivateChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 连接 WebSocket
    wsRef.current = new WebSocket(
      `${process.env.REACT_APP_WS_URL}/chat/${selectedFriend.id}`
    );

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      handleApiError(error);
    };

    return () => {
      wsRef.current?.close();
    };
  }, [selectedFriend.id]);

  const handleSendMessage = async (content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          content,
          timestamp: Date.now(),
        })
      );
    }
  };

  return (
    // ...
  );
}
```

---

## 6. 环境变量配置

**文件：`.env.local`**

```
# API 配置
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000

# 其他配置
REACT_APP_ENV=development
REACT_APP_LOG_LEVEL=debug
```

**文件：`.env.production`**

```
# 生产环境 API 配置
REACT_APP_API_URL=https://api.icesnowcity.com/api
REACT_APP_WS_URL=wss://api.icesnowcity.com

# 其他配置
REACT_APP_ENV=production
REACT_APP_LOG_LEVEL=error
```

---

## 7. 修改检查清单

### 前端代码修改清单

- [ ] 创建 `client/src/lib/api/types.ts` - API 类型定义
- [ ] 创建 `client/src/lib/api/client.ts` - API 客户端
- [ ] 创建 `client/src/lib/api/errorHandler.ts` - 错误处理
- [ ] 创建 `client/src/hooks/useApi.ts` - API Hook
- [ ] 修改 `FriendsListContainer.tsx` - 好友系统集成
- [ ] 修改 `PrivateChatContainer.tsx` - 私聊系统集成
- [ ] 修改 `EquipmentPanel.tsx` - 装备系统集成
- [ ] 修改 `GuildPanel.tsx` - 工会系统集成
- [ ] 修改 `AchievementPanel.tsx` - 成就系统集成
- [ ] 更新环境变量配置
- [ ] 测试所有 API 调用
- [ ] 测试错误处理流程
- [ ] 测试加载状态显示
- [ ] 测试乐观更新回滚

---

## 8. 测试策略

### 8.1 单元测试

```typescript
// client/src/lib/api/client.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ApiClient, ApiError } from "./client";

describe("ApiClient", () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient({
      baseURL: "http://localhost:3000/api",
    });
  });

  it("should successfully fetch data", async () => {
    const mockResponse = {
      code: 0,
      message: "Success",
      data: { id: 1, name: "Test" },
      timestamp: new Date().toISOString(),
      requestId: "uuid",
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const result = await client.get("/test");
    expect(result).toEqual({ id: 1, name: "Test" });
  });

  it("should handle API errors", async () => {
    const mockResponse = {
      code: 400,
      message: "Bad Request",
      error: {
        type: "VALIDATION_ERROR",
        details: { field: "email" },
      },
      timestamp: new Date().toISOString(),
      requestId: "uuid",
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockResponse),
      })
    );

    await expect(client.get("/test")).rejects.toThrow(ApiError);
  });
});
```

### 8.2 集成测试

```typescript
// client/src/components/FriendsList.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FriendsList } from "./FriendsList";

describe("FriendsList", () => {
  it("should add friend successfully", async () => {
    render(<FriendsList />);

    const addButton = screen.getByText("添加好友");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("好友添加成功")).toBeInTheDocument();
    });
  });

  it("should handle add friend error", async () => {
    // Mock API error
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            code: 3001,
            message: "Validation failed",
            error: { type: "VALIDATION_ERROR" },
          }),
      })
    );

    render(<FriendsList />);

    const addButton = screen.getByText("添加好友");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("数据验证失败")).toBeInTheDocument();
    });
  });
});
```

---

## 9. 性能优化建议

### 9.1 请求去重
```typescript
// 使用 useMemo 避免重复请求
const { data: friends } = useApi(
  `/friends/list?page=${page}`,
  { autoFetch: true }
);
```

### 9.2 缓存策略
```typescript
// 实现简单的缓存
const cache = new Map();

export function useApiWithCache<T>(url: string) {
  if (cache.has(url)) {
    return cache.get(url);
  }

  const result = useApi<T>(url);
  cache.set(url, result);
  return result;
}
```

### 9.3 请求合并
```typescript
// 合并多个请求
const [friends, guild, achievements] = await Promise.all([
  apiClient.get("/friends/list"),
  apiClient.get("/guild/info"),
  apiClient.get("/achievements"),
]);
```

---

## 10. 故障排查

### 常见问题

**Q: API 返回 401 错误**
A: 检查认证令牌是否过期，需要刷新令牌或重新登录

**Q: API 返回 422 错误**
A: 检查请求数据格式，查看 error.details 了解具体验证失败的字段

**Q: 请求超时**
A: 增加超时时间或检查网络连接

**Q: 乐观更新失败后数据不一致**
A: 在错误处理中调用 API 重新获取最新数据

