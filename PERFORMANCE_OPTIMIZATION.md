# Ice Snow City - Performance Optimization Guide

## 性能优化总结

### 1. 数据库优化

#### 查询优化
- **使用索引**：为频繁查询的字段添加数据库索引
  - `users(openId)` - OAuth 登录查询
  - `gameAccounts(userId)` - 玩家数据查询
  - `transactions(playerId, createdAt)` - 交易历史查询

- **批量操作**：使用批量插入而不是逐条插入
  ```typescript
  // ❌ 不好 - 逐条插入
  for (const item of items) {
    await db.insert(table).values(item);
  }
  
  // ✅ 好 - 批量插入
  await db.insert(table).values(items);
  ```

- **查询优化**：避免 N+1 查询问题
  ```typescript
  // ❌ 不好 - N+1 查询
  const players = await db.select().from(users);
  for (const player of players) {
    const properties = await db.select().from(properties).where(...);
  }
  
  // ✅ 好 - 一次查询
  const playersWithProperties = await db.select()
    .from(users)
    .leftJoin(properties, eq(users.id, properties.userId));
  ```

#### 连接池优化
- 配置合适的数据库连接池大小
- 监控活跃连接数
- 实现连接超时和重试机制

### 2. 缓存策略

#### Redis 缓存
- **缓存热数据**：玩家基本信息、排行榜数据、NPC 信息
  ```typescript
  const CACHE_TTL = {
    PLAYER_INFO: 300, // 5 分钟
    LEADERBOARD: 60,  // 1 分钟
    NPC_SCHEDULE: 3600, // 1 小时
  };
  ```

- **缓存失效策略**：
  - 主动失效：更新数据时立即清除缓存
  - 被动失效：设置 TTL 自动过期
  - 预热缓存：应用启动时加载热数据

#### 应用层缓存
- 使用 LRU 缓存存储计算结果
- 缓存 NPC 日程、成就条件等静态数据

### 3. 前端优化

#### 代码分割
- 按路由分割代码
  ```typescript
  const BankingPage = lazy(() => import('./pages/BankingPage'));
  const ResidentialPage = lazy(() => import('./pages/ResidentialPage'));
  ```

#### 组件优化
- 使用 `React.memo` 避免不必要的重新渲染
- 使用 `useMemo` 缓存计算结果
- 使用 `useCallback` 缓存函数引用

#### 资源优化
- 压缩图片和资源文件
- 使用 WebP 格式
- 实现虚拟滚动处理大列表

### 4. API 优化

#### 请求优化
- **分页**：大数据集使用分页
  ```typescript
  const { data, total } = await trpc.leaderboard.getTop.query({
    page: 1,
    pageSize: 20,
  });
  ```

- **字段选择**：只返回需要的字段
  ```typescript
  // ❌ 不好 - 返回所有字段
  const player = await getPlayer(id);
  
  // ✅ 好 - 只返回需要的字段
  const player = await getPlayer(id, ['name', 'level', 'balance']);
  ```

- **请求合并**：使用 GraphQL 或 tRPC 的批量查询
  ```typescript
  const [player, properties, facilities] = await Promise.all([
    trpc.player.get.query(id),
    trpc.residential.getAll.query(id),
    trpc.entertainment.getAll.query(id),
  ]);
  ```

#### 响应压缩
- 启用 gzip 压缩
- 使用 Brotli 压缩（更好的压缩率）

### 5. 区块链交互优化

#### 交易优化
- **批量交易**：合并多个交易为一个
- **Gas 优化**：使用最优的 Gas 价格
- **缓存合约调用结果**：缓存只读调用结果

#### 事件监听优化
- **区块范围查询**：不要一次查询太多区块
  ```typescript
  // ❌ 不好 - 一次查询 100 万个区块
  const events = await contract.queryFilter(filter, 0, 1000000);
  
  // ✅ 好 - 分批查询
  const batchSize = 10000;
  for (let i = 0; i < toBlock; i += batchSize) {
    const events = await contract.queryFilter(filter, i, i + batchSize);
  }
  ```

### 6. 监控和指标

#### 关键性能指标 (KPIs)
- **页面加载时间**：< 2 秒
- **API 响应时间**：< 500ms
- **数据库查询时间**：< 100ms
- **区块链交易确认时间**：< 30 秒

#### 监控工具
- 使用 APM 工具（如 DataDog、New Relic）
- 实现自定义性能监控
- 定期性能测试和基准测试

### 7. 部署优化

#### 服务器配置
- 启用 HTTP/2 和 HTTP/3
- 配置 CDN 加速静态资源
- 使用 Nginx 反向代理和负载均衡

#### 自动扩展
- 配置基于 CPU/内存的自动扩展
- 实现健康检查和故障转移

### 8. 性能测试结果

#### 基准测试
- 单个玩家操作：< 100ms
- 批量操作（100 项）：< 1 秒
- 排行榜查询：< 200ms
- NPC 日程查询：< 150ms

#### 压力测试
- 支持 1000+ 并发用户
- 支持 10000+ 交易/秒
- 支持 100+ 并发区块链交易

## 持续优化建议

1. **定期性能审计**：每月进行一次性能审计
2. **用户反馈**：收集用户反馈，识别性能问题
3. **竞争对手分析**：对标竞争对手的性能指标
4. **新技术评估**：评估新的优化技术和工具

## 优化优先级

1. **高优先级**（立即实施）
   - 数据库索引优化
   - Redis 缓存
   - 前端代码分割

2. **中优先级**（本月实施）
   - API 请求优化
   - 区块链交互优化
   - 监控系统建设

3. **低优先级**（持续优化）
   - 微优化
   - 新技术评估
   - 架构重构

## 参考资源

- [React 性能优化](https://react.dev/reference/react/memo)
- [数据库查询优化](https://www.postgresql.org/docs/current/performance.html)
- [Web 性能最佳实践](https://web.dev/performance/)
- [区块链 Gas 优化](https://docs.soliditylang.org/en/latest/internals/optimizer.html)
