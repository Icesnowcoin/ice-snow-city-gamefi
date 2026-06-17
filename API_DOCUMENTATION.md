# Ice Snow City Admin Agent - API 文档

## 概述

Ice Snow City Admin Agent 提供了一套完整的 tRPC API，用于管理区块链合约、监控系统状态和执行管理操作。

## 认证

所有 API 调用都需要通过 Manus OAuth 进行认证。认证信息通过 HTTP Cookie 自动传递。

### Owner-Only 操作

某些操作仅限 Owner 用户执行，通过 `OWNER_OPEN_ID` 环境变量进行验证。

## API 端点

### 密钥管理 (Secret Key)

#### `secretKey.generate`
生成新的密钥。

**权限**: Owner-only  
**参数**: 无  
**返回值**:
```typescript
{
  keyHash: string;        // Keccak256 哈希
  createdAt: Date;
}
```

**示例**:
```typescript
const result = await trpc.secretKey.generate.mutate();
```

#### `secretKey.getActive`
获取当前活跃的密钥哈希。

**权限**: Owner-only  
**参数**: 无  
**返回值**:
```typescript
{
  keyHash: string;
  createdAt: Date;
} | null
```

#### `secretKey.setCustom`
设置自定义密钥。

**权限**: Owner-only  
**参数**:
```typescript
{
  customKey: string;      // 自定义密钥
}
```
**返回值**:
```typescript
{
  keyHash: string;
  createdAt: Date;
}
```

### 合约参数 (Contract Parameters)

#### `contractParams.list`
列出所有合约参数。

**权限**: Owner-only  
**参数**: 无  
**返回值**:
```typescript
Array<{
  id: number;
  paramName: string;
  paramValue: string;
  description?: string;
  updatedAt: Date;
  updatedBy?: string;
}>
```

#### `contractParams.update`
更新合约参数。

**权限**: Owner-only  
**参数**:
```typescript
{
  paramName: string;
  paramValue: string;
  description?: string;
}
```
**返回值**:
```typescript
{
  id: number;
  paramName: string;
  paramValue: string;
  updatedAt: Date;
}
```

### 合约事件 (Contract Events)

#### `contractEvents.list`
列出合约事件。

**权限**: Owner-only  
**参数**:
```typescript
{
  limit?: number;         // 默认 100
  offset?: number;        // 默认 0
  eventName?: string;     // 可选过滤
  status?: string;        // 可选过滤
}
```
**返回值**:
```typescript
Array<{
  id: number;
  eventName: string;
  txHash?: string;
  blockNumber?: number;
  fromAddress?: string;
  toAddress?: string;
  amount?: string;
  params?: string;
  status: "success" | "failed" | "pending";
  createdAt: Date;
}>
```

### 代理操作 (Agent Operations)

#### `agent.payUtilityFee`
执行支付公用事业费操作。

**权限**: Owner-only  
**参数**:
```typescript
{
  player: string;         // 玩家地址
  amount: string;         // 金额
  secretKey: string;      // 密钥（用于验证）
}
```
**返回值**:
```typescript
{
  txHash: string;
  status: "success" | "failed" | "pending";
  message: string;
}
```

#### `agent.processLuxuryGiftRebate`
处理奢侈礼物返利。

**权限**: Owner-only  
**参数**:
```typescript
{
  recipient: string;      // 接收者地址
  giftValue: string;      // 礼物价值
  secretKey: string;      // 密钥
}
```
**返回值**:
```typescript
{
  txHash: string;
  rebateAmount: string;
  status: "success" | "failed" | "pending";
  message: string;
}
```

#### `agent.mintLand`
铸造土地 NFT。

**权限**: Owner-only  
**参数**:
```typescript
{
  to: string;             // 接收者地址
  x: number;              // X 坐标
  y: number;              // Y 坐标
  landType: number;       // 土地类型
  secretKey: string;      // 密钥
}
```
**返回值**:
```typescript
{
  txHash: string;
  tokenId: string;
  status: "success" | "failed" | "pending";
  message: string;
}
```

#### `agent.mintHouse`
在土地上铸造房屋 NFT。

**权限**: Owner-only  
**参数**:
```typescript
{
  to: string;             // 接收者地址
  landTokenId: string;    // 土地 Token ID
  houseType: number;      // 房屋类型
  decorationHash: string; // 装饰哈希
  secretKey: string;      // 密钥
}
```
**返回值**:
```typescript
{
  txHash: string;
  tokenId: string;
  status: "success" | "failed" | "pending";
  message: string;
}
```

### 财库 (Treasury)

#### `treasury.getBalance`
获取财库余额。

**权限**: Owner-only  
**参数**: 无  
**返回值**:
```typescript
{
  balance: string;        // ISC 余额
  currency: string;       // "ISC"
}
```

#### `treasury.getTransactionHistory`
获取财库交易历史。

**权限**: Owner-only  
**参数**:
```typescript
{
  limit?: number;         // 默认 100
  offset?: number;        // 默认 0
}
```
**返回值**:
```typescript
Array<{
  txId: number;
  txType: string;
  amount: string;
  fromAddress: string;
  toAddress: string;
  timestamp: Date;
}>
```

### 质押 (Staking)

#### `staking.getPoolInfo`
获取质押池信息。

**权限**: Owner-only  
**参数**:
```typescript
{
  poolId: number;
}
```
**返回值**:
```typescript
{
  poolId: number;
  totalStaked: string;
  currentAPY: string;
  rewardPerBlock: string;
}
```

#### `staking.getUserRewards`
获取用户奖励。

**权限**: Owner-only  
**参数**:
```typescript
{
  user: string;           // 用户地址
  poolId: number;
}
```
**返回值**:
```typescript
{
  user: string;
  poolId: number;
  rewards: string;
}
```

### 审计日志 (Audit Logs)

#### `audit.queryLogs`
查询审计日志。

**权限**: Owner-only  
**参数**:
```typescript
{
  action?: string;
  resource?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}
```
**返回值**:
```typescript
Array<{
  id: number;
  action: string;
  resource: string;
  userId: string;
  userEmail?: string;
  status: "success" | "failed";
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}>
```

#### `audit.generateReport`
生成审计报告。

**权限**: Owner-only  
**参数**:
```typescript
{
  startDate: Date;
  endDate: Date;
  format?: "json" | "csv";
}
```
**返回值**:
```typescript
{
  report: string;         // JSON 或 CSV 格式的报告
  format: string;
  generatedAt: Date;
}
```

### 系统 (System)

#### `system.notifyOwner`
向 Owner 发送通知。

**权限**: Owner-only  
**参数**:
```typescript
{
  title: string;
  content: string;
}
```
**返回值**:
```typescript
{
  success: boolean;
  message: string;
}
```

#### `auth.me`
获取当前用户信息。

**权限**: 已认证用户  
**参数**: 无  
**返回值**:
```typescript
{
  id: number;
  openId: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: Date;
} | null
```

#### `auth.logout`
登出当前用户。

**权限**: 已认证用户  
**参数**: 无  
**返回值**:
```typescript
{
  success: boolean;
}
```

## 错误处理

所有 API 调用可能返回以下错误：

- `UNAUTHORIZED` - 用户未认证
- `FORBIDDEN` - 用户无权访问此资源
- `BAD_REQUEST` - 请求参数无效
- `NOT_FOUND` - 资源不存在
- `INTERNAL_SERVER_ERROR` - 服务器内部错误

**错误响应格式**:
```typescript
{
  code: string;           // 错误代码
  message: string;        // 错误信息
  cause?: unknown;        // 原始错误
}
```

## 使用示例

### React 组件中使用

```typescript
import { trpc } from "@/lib/trpc";

export function SecretKeyManager() {
  const generateMutation = trpc.secretKey.generate.useMutation();
  const getActiveMutation = trpc.secretKey.getActive.useQuery();

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync();
      console.log("New key generated:", result.keyHash);
    } catch (error) {
      console.error("Failed to generate key:", error);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate}>Generate New Key</button>
      {getActiveMutation.data && (
        <p>Active Key: {getActiveMutation.data.keyHash}</p>
      )}
    </div>
  );
}
```

### 直接 HTTP 调用

```bash
# 生成新密钥
curl -X POST http://localhost:3000/api/trpc/secretKey.generate \
  -H "Content-Type: application/json" \
  -d '{}'

# 获取活跃密钥
curl http://localhost:3000/api/trpc/secretKey.getActive
```

## 限制和配额

- 每个用户每分钟最多 100 个 API 请求
- 单个请求超时时间为 30 秒
- 最大请求体大小为 50MB

## 版本历史

### v1.0.0 (2026-06-17)
- 初始版本
- 支持所有核心功能

---

**最后更新**: 2026-06-17  
**API 版本**: 1.0.0
