/**
 * 基础 API 客户端
 * 提供 HTTP 请求的基础功能
 */

import { ApiErrorResponse } from "./ice-snow-city-types";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";
const REQUEST_TIMEOUT = 30000; // 30 秒

interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = REQUEST_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.loadToken();
  }

  /**
   * 从 localStorage 加载 token
   */
  private loadToken(): void {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
    }
  }

  /**
   * 设置 token
   */
  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }

  /**
   * 获取 token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * 构建请求头
   */
  private buildHeaders(options?: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * 执行带重试的请求
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = 3
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 如果是最后一次重试或不是网络错误，则抛出
        if (i === retries - 1 || !(error instanceof TypeError)) {
          throw lastError;
        }

        // 指数退避
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }

    throw lastError || new Error("Request failed after retries");
  }

  /**
   * 处理响应
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    if (!response.ok) {
      let errorData: any = {};

      if (isJson) {
        errorData = await response.json();
      }

      // 处理 401 未认证
      if (response.status === 401) {
        this.setToken(null);
        // 可以在这里触发登出事件或重定向到登录页
      }

      throw new ApiErrorResponse(
        errorData.code || response.status,
        errorData.error?.type || "HTTP_ERROR",
        errorData.message || response.statusText,
        errorData.error?.details
      );
    }

    if (!isJson) {
      return undefined as T;
    }

    return response.json();
  }

  /**
   * GET 请求
   */
  async get<T = any>(
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.buildHeaders(options);

    const response = await this.fetchWithRetry(
      url,
      {
        method: "GET",
        headers,
      },
      options?.retries ?? 3
    );

    return this.handleResponse<T>(response);
  }

  /**
   * POST 请求
   */
  async post<T = any>(
    path: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.buildHeaders(options);

    const response = await this.fetchWithRetry(
      url,
      {
        method: "POST",
        headers,
        body: data ? JSON.stringify(data) : undefined,
      },
      options?.retries ?? 3
    );

    return this.handleResponse<T>(response);
  }

  /**
   * PUT 请求
   */
  async put<T = any>(
    path: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.buildHeaders(options);

    const response = await this.fetchWithRetry(
      url,
      {
        method: "PUT",
        headers,
        body: data ? JSON.stringify(data) : undefined,
      },
      options?.retries ?? 3
    );

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.buildHeaders(options);

    const response = await this.fetchWithRetry(
      url,
      {
        method: "DELETE",
        headers,
      },
      options?.retries ?? 3
    );

    return this.handleResponse<T>(response);
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(
    path: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.buildHeaders(options);

    const response = await this.fetchWithRetry(
      url,
      {
        method: "PATCH",
        headers,
        body: data ? JSON.stringify(data) : undefined,
      },
      options?.retries ?? 3
    );

    return this.handleResponse<T>(response);
  }
}

// 导出单例
export const apiClient = new ApiClient();
