# Ice Snow City Admin Agent - 生产部署与运维手册

## 概述

本手册提供 Ice Snow City 管理员后台系统的完整部署、配置和运维指南。该系统是一个生产级的智能合约管理控制台，采用了企业级的安全加固。

---

## 1. 系统架构

### 技术栈

| 层级 | 技术 | 版本 |
|-----|------|------|
| 前端 | React + Tailwind CSS + shadcn/ui | 19 + 4 |
| 后端 | Express + tRPC + Drizzle ORM | 4 + 11 |
| 数据库 | MySQL / TiDB | 8.0+ |
| 认证 | Manus OAuth | - |
| 测试 | Vitest | 2.1+ |
| 国际化 | i18n | - |

### 核心模块

1. **密令管理** — 使用 keccak256 哈希存储，支持生成和自定义密令
2. **合约参数配置** — 管理 utilityFeeRate、luxuryGiftRebateRate、stakingPoolId
3. **交互日志** — 记录所有链上事件（UtilityFeePaid、LuxuryGiftRebateProcessed 等）
4. **Agent 操作控制台** — 支持 payUtilityFee、processLuxuryGiftRebate、mintLand、mintHouse
5. **国库监控** — 实时 ISC 余额与交易历史
6. **银行系统状态** — APY、待领取收益、质押总量

---

## 2. 环境变量配置

### 必需环境变量

```bash
# 数据库
DATABASE_URL=mysql://user:password@host:3306/ice_snow_city

# OAuth 认证
VITE_APP_ID=your_app_id
VITE_OAUTH_PORTAL_URL=https://api.manus.im
OAUTH_SERVER_URL=https://api.manus.im
VITE_OWNER_OPEN_ID=owner_open_id_from_manus_oauth

# JWT 会话
JWT_SECRET=your_jwt_secret_key_min_32_chars

# 项目信息
OWNER_NAME=Your Name
OWNER_OPEN_ID=owner_open_id_from_manus_oauth
VITE_APP_TITLE=Ice Snow City Admin
VITE_APP_LOGO=https://your-logo-url.png

# 内置 API
BUILT_IN_FORGE_API_URL=https://api.manus.im/v1
BUILT_IN_FORGE_API_KEY=your_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/v1
VITE_FRONTEND_FORGE_API_KEY=your_frontend_api_key

# 分析
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

### 环境变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_OWNER_OPEN_ID` | 项目 Owner 的 Manus OAuth ID，用于严格的 Owner-only 访问控制 | `user_123abc` |
| `JWT_SECRET` | 会话 Cookie 签名密钥，至少 32 字符 | `your_secret_key_min_32_chars_long` |
| `DATABASE_URL` | MySQL 连接字符串 | `mysql://root:pass@localhost:3306/db` |

---

## 3. 数据库初始化

### 创建数据库

```sql
CREATE DATABASE ice_snow_city CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 执行迁移

```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 执行迁移（通过 Manus webdev_execute_sql 工具）
# 或使用 Drizzle 迁移工具
pnpm drizzle-kit migrate
```

### 初始化默认数据

```sql
-- 插入默认合约参数
INSERT INTO contract_params (paramName, paramValue, createdBy) VALUES
('utilityFeeRate', '100', 'system'),
('luxuryGiftRebateRate', '3000', 'system'),
('stakingPoolId', '1', 'system');
```

---

## 4. 部署步骤

### 本地开发环境

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入实际的环境变量

# 3. 运行开发服务器
pnpm dev

# 4. 运行测试
pnpm test

# 5. 构建生产版本
pnpm build

# 6. 启动生产服务器
pnpm start
```

### 生产环境部署

#### 使用 Manus 内置托管

1. 在 Manus 管理界面创建新项目
2. 配置所有必需的环境变量
3. 点击 "Publish" 按钮进行部署
4. 系统将自动构建、测试和部署到 Cloud Run

#### 使用外部托管（如 Railway、Render）

```bash
# 1. 构建 Docker 镜像
docker build -t ice-snow-city-admin .

# 2. 推送到镜像仓库
docker push your-registry/ice-snow-city-admin:latest

# 3. 部署到容器平台
# 配置环境变量和数据库连接
# 启动容器
```

---

## 5. 安全配置

### 密令管理

**生成新密令：**

```typescript
// 在管理员后台点击 "生成新密令"
// 系统将生成一个随机密令并计算其 keccak256 哈希
// 返回的原始密令仅显示一次，请妥善保管
```

**密令验证流程：**

1. 用户在 Agent 操作控制台输入密令
2. 后端使用 `verifySecretKey()` 进行常数时间验证
3. 验证通过后执行合约操作
4. 所有操作记录在 `contract_events` 表中

### Owner 访问控制

系统使用严格的 Owner-only 访问控制：

```typescript
// 后端强制检查
if (ctx.user.openId !== ENV.ownerOpenId) {
  throw new TRPCError({ code: "FORBIDDEN" });
}

// 前端也进行检查
if (user?.openId !== VITE_OWNER_OPEN_ID) {
  // 显示权限不足页面
}
```

**确保 `VITE_OWNER_OPEN_ID` 与实际 Owner 的 Manus OAuth ID 一致。**

### 密钥存储最佳实践

1. **不要在代码中硬编码密钥** — 使用环境变量
2. **使用强密钥** — 至少 32 字符的随机字符串
3. **定期轮换** — 每月生成新密令
4. **安全传输** — 仅通过 HTTPS 传输
5. **审计日志** — 所有密令使用都会被记录

---

## 6. 监控与日志

### 日志位置

```
.manus-logs/
├── devserver.log          # 开发服务器日志
├── browserConsole.log     # 浏览器控制台日志
├── networkRequests.log    # HTTP 请求日志
└── sessionReplay.log      # 用户交互日志
```

### 关键指标监控

| 指标 | 说明 | 告警阈值 |
|------|------|---------|
| 密令验证失败率 | 密令验证失败次数 / 总次数 | > 10% |
| 合约操作延迟 | Agent 操作平均响应时间 | > 5s |
| 数据库连接数 | 活跃数据库连接数 | > 80% |
| API 错误率 | 5xx 错误 / 总请求数 | > 1% |

### 常见问题排查

**问题：密令验证失败**
- 检查密令是否正确输入
- 确认密令未过期（如有轮换策略）
- 查看 `secret_keys` 表中的 `isActive` 字段

**问题：合约操作超时**
- 检查网络连接
- 验证合约地址是否正确
- 查看 `contract_events` 表中的错误日志

**问题：权限不足**
- 确认 `VITE_OWNER_OPEN_ID` 配置正确
- 检查用户的 Manus OAuth ID
- 查看浏览器控制台的错误信息

---

## 7. 未来集成点

### 链上合约调用集成

当前系统预留了合约集成接口（`server/_core/contractIntegration.ts`）。未来集成步骤：

1. **安装 Web3.js 或 Ethers.js**
   ```bash
   pnpm add ethers
   ```

2. **实现合约调用**
   ```typescript
   // server/_core/contractIntegration.ts
   export async function callPayUtilityFee(params: PayUtilityFeeParams) {
     const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
     const signer = new ethers.Wallet(PRIVATE_KEY, provider);
     const contract = new ethers.Contract(ISC_MANAGER_ADDRESS, ABI, signer);
     
     const tx = await contract.payUtilityFee(
       params.playerAddress,
       params.amount,
       params.secretKeyHash
     );
     
     return {
       txHash: tx.hash,
       status: "pending"
     };
   }
   ```

3. **监控交易状态**
   ```typescript
   const receipt = await provider.waitForTransaction(txHash);
   // 更新 contract_events 表中的状态
   ```

### RPC 数据查询集成

1. **查询 CityTreasury 余额**
   ```typescript
   const balance = await contract.getBalance();
   ```

2. **查询 ISC Staking 状态**
   ```typescript
   const apy = await stakingContract.getCurrentAPY();
   const pendingRewards = await stakingContract.getPendingRewards(userAddress);
   ```

---

## 8. 性能优化

### 数据库查询优化

```sql
-- 为常用查询字段添加索引
CREATE INDEX idx_event_name ON contract_events(eventName);
CREATE INDEX idx_event_created_at ON contract_events(createdAt);
CREATE INDEX idx_tx_type ON treasury_transactions(txType);
```

### 缓存策略

```typescript
// 使用 Redis 缓存合约参数（可选）
const params = await redis.get('contract_params');
if (!params) {
  params = await db.getAllContractParams();
  await redis.set('contract_params', JSON.stringify(params), 'EX', 3600);
}
```

### 前端性能

- 使用 React Query 的缓存机制
- 实现虚拟列表用于大数据量展示
- 使用 Code Splitting 优化包大小

---

## 9. 备份与恢复

### 数据库备份

```bash
# 每日备份
mysqldump -u user -p database_name > backup_$(date +%Y%m%d).sql

# 恢复备份
mysql -u user -p database_name < backup_20260614.sql
```

### 配置备份

```bash
# 备份环境变量
cp .env.production .env.production.backup

# 备份数据库迁移文件
tar -czf drizzle_migrations_backup.tar.gz drizzle/migrations/
```

---

## 10. 支持与反馈

如遇到问题或需要技术支持，请：

1. 查看 `.manus-logs/` 中的日志文件
2. 检查本手册的 "常见问题排查" 部分
3. 提交 GitHub Issue（如使用 GitHub 托管）
4. 联系 Manus 技术支持团队

---

**最后更新：2026-06-14**
**版本：1.0.0**
