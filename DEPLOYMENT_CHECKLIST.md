# 部署检查清单 (Deployment Checklist)

**项目**: Ice Snow City Backend Agent  
**版本**: 1.0.0  
**最后更新**: 2026-08-01

---

## 📋 部署前检查 (Pre-Deployment Checks)

### 代码质量检查

- [ ] 所有代码已提交到 Git
- [ ] 代码已通过代码审查
- [ ] 没有 console.log 或调试代码
- [ ] 没有注释掉的代码
- [ ] 没有 TODO 或 FIXME 标记
- [ ] 所有类型检查通过 (`pnpm tsc --noEmit`)
- [ ] 所有 linting 检查通过 (`pnpm lint`)

### 测试检查

- [ ] 所有单元测试通过 (`pnpm test`)
- [ ] 所有集成测试通过
- [ ] 代码覆盖率 >= 80%
- [ ] 没有跳过的测试 (skip)
- [ ] 没有只运行的测试 (only)
- [ ] 性能测试通过
- [ ] 负载测试通过

### 依赖检查

- [ ] 运行 `pnpm audit` 没有高风险漏洞
- [ ] 所有依赖已更新到最新版本
- [ ] 没有过期的依赖
- [ ] 没有未使用的依赖
- [ ] 依赖版本已锁定 (pnpm-lock.yaml)

### 安全检查

- [ ] 没有硬编码的密钥或密码
- [ ] 没有敏感信息在代码中
- [ ] 所有 API 密钥已从环境变量读取
- [ ] CORS 已正确配置
- [ ] HTTPS 已启用
- [ ] 安全响应头已配置
- [ ] 速率限制已启用
- [ ] 输入验证已实现
- [ ] SQL 注入防护已实现
- [ ] XSS 防护已实现
- [ ] CSRF 防护已实现

### 环境配置检查

- [ ] `.env.local` 已配置 (不提交到 Git)
- [ ] 所有必需的环境变量已设置
- [ ] 数据库连接字符串已验证
- [ ] Redis 连接字符串已验证
- [ ] API 密钥已验证
- [ ] 日志级别已设置为 `info`
- [ ] 调试模式已禁用 (`DEBUG=false`)

### 数据库检查

- [ ] 数据库已创建
- [ ] 所有迁移已执行
- [ ] 数据库备份已创建
- [ ] 数据库连接已测试
- [ ] 数据库用户权限已配置
- [ ] 数据库索引已创建
- [ ] 数据库连接池已配置

### 构建检查

- [ ] 前端构建成功 (`pnpm build`)
- [ ] 后端构建成功
- [ ] 没有构建警告
- [ ] 构建产物大小合理
- [ ] 构建产物已测试

---

## 🚀 部署步骤 (Deployment Steps)

### 1. 准备阶段 (Preparation)

```bash
# 1.1 检查代码状态
git status

# 1.2 拉取最新代码
git pull origin main

# 1.3 安装依赖
pnpm install

# 1.4 运行所有检查
pnpm lint
pnpm tsc --noEmit
pnpm test

# 1.5 构建项目
pnpm build
```

### 2. 备份阶段 (Backup)

```bash
# 2.1 备份数据库
mysqldump -u user -p database > backup-$(date +%Y%m%d-%H%M%S).sql

# 2.2 备份应用文件
tar -czf app-backup-$(date +%Y%m%d-%H%M%S).tar.gz /app

# 2.3 验证备份
ls -lh backup-*.sql app-backup-*.tar.gz
```

### 3. 部署阶段 (Deployment)

```bash
# 3.1 停止当前应用
pm2 stop ice_snow_city_agent

# 3.2 部署新代码
cd /app
git pull origin main
pnpm install
pnpm build

# 3.3 执行数据库迁移
pnpm run migrate

# 3.4 启动应用
pm2 start ice_snow_city_agent

# 3.5 验证应用状态
pm2 status
```

### 4. 验证阶段 (Verification)

```bash
# 4.1 检查应用日志
pm2 logs ice_snow_city_agent

# 4.2 检查健康状态
curl http://localhost:3000/health

# 4.3 运行烟雾测试
pnpm run test:smoke

# 4.4 检查监控指标
# 访问 Grafana 仪表板
```

### 5. 回滚阶段 (Rollback) - 如果出现问题

```bash
# 5.1 停止应用
pm2 stop ice_snow_city_agent

# 5.2 恢复备份
tar -xzf app-backup-<timestamp>.tar.gz -C /

# 5.3 恢复数据库
mysql -u user -p database < backup-<timestamp>.sql

# 5.4 启动应用
pm2 start ice_snow_city_agent

# 5.5 验证恢复
curl http://localhost:3000/health
```

---

## 📊 部署后检查 (Post-Deployment Checks)

### 功能验证

- [ ] 用户可以登录
- [ ] 用户可以创建钱包
- [ ] 用户可以进行交易
- [ ] 用户可以分享海报
- [ ] 用户可以查看统计数据
- [ ] 所有 API 端点正常工作
- [ ] 所有前端页面正常加载

### 性能验证

- [ ] 页面加载时间 < 3 秒
- [ ] API 响应时间 < 500ms (P95)
- [ ] 数据库查询时间 < 100ms (P95)
- [ ] CPU 使用率 < 80%
- [ ] 内存使用率 < 80%
- [ ] 磁盘使用率 < 80%

### 安全验证

- [ ] HTTPS 正常工作
- [ ] 安全响应头已发送
- [ ] CORS 正确限制
- [ ] 速率限制正常工作
- [ ] 认证和授权正常工作
- [ ] 没有安全告警

### 监控验证

- [ ] 日志正常记录
- [ ] 监控指标正常收集
- [ ] 告警规则正常工作
- [ ] 没有错误日志
- [ ] 没有警告日志

---

## 🔄 部署后维护 (Post-Deployment Maintenance)

### 每日检查

- [ ] 检查应用日志
- [ ] 检查监控告警
- [ ] 检查系统资源使用
- [ ] 检查用户反馈

### 每周检查

- [ ] 检查依赖更新
- [ ] 运行安全审计
- [ ] 检查备份完整性
- [ ] 检查性能指标

### 每月检查

- [ ] 更新依赖
- [ ] 进行安全审计
- [ ] 进行性能优化
- [ ] 更新文档

---

## 🚨 故障排查 (Troubleshooting)

### 应用无法启动

```bash
# 1. 检查日志
pm2 logs ice_snow_city_agent --err

# 2. 检查环境变量
env | grep DATABASE_URL

# 3. 检查数据库连接
mysql -u user -p -e "SELECT 1"

# 4. 检查端口占用
lsof -i :3000

# 5. 手动启动应用查看错误
node server/_core/index.ts
```

### 数据库连接失败

```bash
# 1. 检查数据库服务
systemctl status mysql

# 2. 检查数据库连接
mysql -u user -p -h host database

# 3. 检查防火墙规则
sudo ufw status

# 4. 检查 DNS 解析
nslookup database-host
```

### 高内存使用

```bash
# 1. 检查内存使用
free -h

# 2. 检查进程内存
ps aux | grep node

# 3. 检查内存泄漏
node --inspect server/_core/index.ts

# 4. 重启应用
pm2 restart ice_snow_city_agent
```

### 高 CPU 使用

```bash
# 1. 检查 CPU 使用
top

# 2. 检查进程 CPU
ps aux | grep node

# 3. 检查性能瓶颈
node --prof server/_core/index.ts

# 4. 分析性能数据
node --prof-process isolate-*.log > profile.txt
```

---

## 📞 应急联系方式 (Emergency Contacts)

| 角色 | 名称 | 电话 | 邮箱 |
|------|------|------|------|
| 技术负责人 | - | - | - |
| 数据库管理员 | - | - | - |
| 安全负责人 | - | - | - |
| 运维负责人 | - | - | - |

---

## 📝 部署记录 (Deployment Log)

| 日期 | 版本 | 部署人 | 状态 | 备注 |
|------|------|--------|------|------|
| 2026-08-01 | 1.0.0 | - | - | - |

---

## ✅ 检查清单完成

- [ ] 所有检查项已完成
- [ ] 所有测试已通过
- [ ] 所有备份已创建
- [ ] 所有验证已完成
- [ ] 可以进行部署

**部署日期**: ___________  
**部署人**: ___________  
**审批人**: ___________

---

**最后更新**: 2026-08-01  
**下次审查**: 2026-09-01
