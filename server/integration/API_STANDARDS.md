# API 集成标准文档

## 1. API 响应标准格式

### 1.1 成功响应格式
```typescript
{
  code: 0,                           // 状态码 (0 = 成功)
  message: "Success",                // 消息
  data: {                            // 实际数据
    // 根据具体 API 返回不同数据
  },
  timestamp: "2024-01-01T00:00:00Z", // 时间戳
  requestId: "uuid"                  // 请求 ID (用于追踪)
}
```

### 1.2 错误响应格式
```typescript
{
  code: 400,                         // HTTP 状态码
  message: "Error message",          // 错误消息
  error: {
    type: "VALIDATION_ERROR",        // 错误类型
    details: {                       // 详细信息
      field: "email",
      reason: "Invalid email format"
    }
  },
  timestamp: "2024-01-01T00:00:00Z",
  requestId: "uuid"
}
```

### 1.3 分页响应格式
```typescript
{
  code: 0,
  message: "Success",
  data: {
    items: [...],                    // 数据数组
    total: 100,                      // 总数
    page: 1,                         // 当前页
    pageSize: 20,                    // 每页数量
    hasMore: true                    // 是否有更多
  }
}
```

## 2. HTTP 状态码规范

| 状态码 | 含义 | 场景 |
|--------|------|------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 204 | No Content | 请求成功但无返回内容 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未授权/需要登录 |
| 403 | Forbidden | 禁止访问/权限不足 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如重复创建） |
| 422 | Unprocessable Entity | 数据验证失败 |
| 429 | Too Many Requests | 请求过于频繁 |
| 500 | Internal Server Error | 服务器错误 |
| 503 | Service Unavailable | 服务不可用 |

## 3. 错误代码规范

### 3.1 错误代码分类
```
1000-1999: 认证相关
2000-2999: 授权相关
3000-3999: 数据验证相关
4000-4999: 业务逻辑相关
5000-5999: 系统相关
```

### 3.2 常见错误代码
```
1001: 用户未登录
1002: 登录过期
1003: 无效的认证令牌
2001: 权限不足
2002: 操作被拒绝
3001: 参数验证失败
3002: 数据格式错误
4001: 资源不存在
4002: 资源已存在
4003: 操作冲突
5001: 数据库错误
5002: 服务不可用
```

## 4. 请求头规范

### 4.1 必需请求头
```
Content-Type: application/json
Authorization: Bearer <token>
X-Request-ID: <uuid>
X-Client-Version: 1.0.0
```

### 4.2 可选请求头
```
X-Trace-ID: <uuid>              // 链路追踪
X-User-Agent: <user-agent>      // 用户代理
Accept-Language: zh-CN          // 语言偏好
```

## 5. 数据验证规范

### 5.1 输入验证
```typescript
// 使用 Zod 进行验证
const createFriendSchema = z.object({
  friendId: z.string().uuid("Invalid friend ID"),
  message: z.string().min(1).max(500).optional(),
});

// 验证失败时返回详细错误
{
  code: 422,
  message: "Validation failed",
  error: {
    type: "VALIDATION_ERROR",
    details: [
      {
        field: "friendId",
        message: "Invalid friend ID"
      }
    ]
  }
}
```

### 5.2 业务规则验证
```typescript
// 检查业务规则
if (player.balance < amount) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Insufficient balance",
    cause: {
      type: "INSUFFICIENT_BALANCE",
      required: amount,
      available: player.balance
    }
  });
}
```

## 6. 认证和授权规范

### 6.1 认证流程
```
1. 用户登录 → 获取 JWT token
2. 前端存储 token
3. 每次请求在 Authorization 头中发送 token
4. 后端验证 token 的有效性
5. 如果 token 过期，前端刷新 token
```

### 6.2 权限检查
```typescript
// 使用 protectedProcedure 进行权限检查
export const updateProfile = protectedProcedure
  .input(updateProfileSchema)
  .mutation(async ({ ctx, input }) => {
    // ctx.user 已通过认证
    // 检查是否有权限修改该资源
    if (input.userId !== ctx.user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot modify other user's profile"
      });
    }
    // 执行操作
  });
```

## 7. 速率限制规范

### 7.1 限制规则
```
- 登录: 5 次/分钟
- API 调用: 100 次/分钟
- 文件上传: 10 次/分钟
- 支付操作: 1 次/秒
```

### 7.2 限制响应
```
HTTP 429 Too Many Requests
Retry-After: 60

{
  code: 429,
  message: "Too many requests",
  error: {
    type: "RATE_LIMIT_EXCEEDED",
    retryAfter: 60
  }
}
```

## 8. 缓存策略

### 8.1 缓存规则
```
- 用户信息: 5 分钟
- 排行榜: 1 小时
- 游戏配置: 24 小时
- 静态资源: 7 天
```

### 8.2 缓存头
```
Cache-Control: public, max-age=300
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT
```

## 9. 日志规范

### 9.1 日志级别
```
DEBUG: 调试信息
INFO: 一般信息
WARN: 警告信息
ERROR: 错误信息
FATAL: 致命错误
```

### 9.2 日志格式
```
[TIMESTAMP] [LEVEL] [MODULE] [REQUEST_ID] - MESSAGE
[2024-01-01T00:00:00Z] [INFO] [API] [uuid-123] - User login successful
```

### 9.3 敏感信息处理
```
- 不记录密码
- 不记录完整的 token
- 不记录完整的信用卡号
- 记录操作摘要而不是完整数据
```

## 10. 事务管理规范

### 10.1 事务隔离级别
```
READ_UNCOMMITTED: 最低隔离级别
READ_COMMITTED: 默认隔离级别
REPEATABLE_READ: 可重复读
SERIALIZABLE: 最高隔离级别
```

### 10.2 事务处理
```typescript
// 使用数据库事务处理多步骤操作
await db.transaction(async (trx) => {
  // 步骤 1: 扣除玩家余额
  await trx.update(players).set({ balance: sql`balance - ${amount}` });
  
  // 步骤 2: 增加商品库存
  await trx.update(items).set({ stock: sql`stock + 1` });
  
  // 步骤 3: 记录交易日志
  await trx.insert(transactions).values({...});
  
  // 如果任何步骤失败，整个事务回滚
});
```

## 11. 前后端集成检查清单

### 前端检查
- [ ] 所有 API 调用使用统一的 HTTP 客户端
- [ ] 所有错误都使用统一的错误处理
- [ ] 所有响应都检查 code 字段
- [ ] 所有操作都有加载状态
- [ ] 所有错误都有用户提示
- [ ] 所有敏感操作都有确认对话框
- [ ] 所有 token 都正确存储和发送
- [ ] 所有请求都包含 X-Request-ID

### 后端检查
- [ ] 所有 API 都返回标准格式
- [ ] 所有错误都返回正确的状态码
- [ ] 所有输入都经过验证
- [ ] 所有操作都有权限检查
- [ ] 所有操作都有审计日志
- [ ] 所有数据库操作都有事务管理
- [ ] 所有敏感操作都有速率限制
- [ ] 所有错误都有详细的错误信息

## 12. 性能指标

### 12.1 响应时间目标
```
- 简单查询: < 100ms
- 复杂查询: < 500ms
- 文件上传: < 2s
- 页面加载: < 3s
```

### 12.2 可用性目标
```
- 系统可用性: > 99.9%
- 平均响应时间: < 200ms
- 错误率: < 0.1%
```

## 13. 安全规范

### 13.1 数据加密
```
- 传输层: HTTPS/TLS 1.3
- 存储层: AES-256 加密敏感数据
- 密钥管理: 使用密钥管理服务
```

### 13.2 SQL 注入防护
```typescript
// ✅ 正确: 使用参数化查询
const user = await db.query.users.findFirst({
  where: eq(users.id, userId)
});

// ❌ 错误: 字符串拼接
const user = await db.query.users.findFirst({
  where: sql`id = ${userId}`  // 容易被注入
});
```

### 13.3 CORS 配置
```typescript
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};
```

## 14. 版本控制

### 14.1 API 版本
```
/api/v1/users
/api/v2/users
```

### 14.2 向后兼容性
```
- 新增字段: 添加到响应中
- 删除字段: 标记为废弃，提供迁移期
- 修改字段: 创建新版本 API
```

## 15. 监控和告警

### 15.1 监控指标
```
- 请求数/秒
- 平均响应时间
- 错误率
- 数据库连接数
- 内存使用率
- CPU 使用率
```

### 15.2 告警规则
```
- 错误率 > 1%: 警告
- 响应时间 > 1s: 警告
- 数据库连接 > 80%: 警告
- 内存使用 > 90%: 严重
```
