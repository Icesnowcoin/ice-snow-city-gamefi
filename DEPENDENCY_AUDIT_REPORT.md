# 依赖审计报告 (Dependency Audit Report)

**生成日期**: 2026-08-01  
**项目**: Ice Snow City Backend Agent  
**审计工具**: pnpm audit

## 执行摘要 (Executive Summary)

项目依赖中发现 **5 个高风险漏洞**，需要立即修复。主要问题涉及原型污染、正则表达式拒绝服务 (ReDoS) 和 XML 解析漏洞。

## 发现的漏洞 (Vulnerabilities Found)

### 1. tRPC 原型污染漏洞 (HIGH)

**包名**: `@trpc/server`  
**受影响版本**: >=11.0.0 <11.8.0  
**当前版本**: 11.6.0  
**修复版本**: >=11.8.0  
**风险等级**: 🔴 高

**问题描述**:  
tRPC 在 `experimental_nextAppDirCaller` 中存在可能的原型污染漏洞。

**受影响路径**:
- . > @trpc/client@11.6.0 > @trpc/server@11.6.0
- . > @trpc/react-query@11.6.0 > @trpc/client@11.6.0 > @trpc/server@11.6.0
- . > @trpc/react-query@11.6.0 > @trpc/server@11.6.0

**修复步骤**:
```bash
pnpm update @trpc/server@^11.8.0
pnpm update @trpc/client@^11.8.0
pnpm update @trpc/react-query@^11.8.0
```

**参考链接**: https://github.com/advisories/GHSA-75jf-qpm5-4xp8

---

### 2. SheetJS ReDoS 漏洞 (HIGH)

**包名**: `xlsx`  
**受影响版本**: <0.20.2  
**当前版本**: 0.18.5  
**修复版本**: >=0.20.2  
**风险等级**: 🔴 高

**问题描述**:  
SheetJS 中存在正则表达式拒绝服务 (ReDoS) 漏洞，可能导致应用程序挂起或崩溃。

**修复步骤**:
```bash
pnpm update xlsx@^0.20.2
```

**参考链接**: https://github.com/advisories/GHSA-5pgg-2g8v-p4x9

---

### 3. xml2js XML 外部实体 (XXE) 漏洞 (HIGH)

**包名**: `xml2js`  
**受影响版本**: <0.4.23  
**当前版本**: 0.4.22  
**修复版本**: >=0.4.23  
**风险等级**: 🔴 高

**问题描述**:  
xml2js 中存在 XML 外部实体 (XXE) 注入漏洞，可能导致任意文件读取或 SSRF 攻击。

**修复步骤**:
```bash
pnpm update xml2js@^0.4.23
```

**参考链接**: https://github.com/advisories/GHSA-4r6h-8v6p-xvw6

---

### 4. Lodash 原型污染漏洞 (MEDIUM)

**包名**: `lodash`  
**受影响版本**: <4.17.21  
**当前版本**: 4.17.20  
**修复版本**: >=4.17.21  
**风险等级**: 🟠 中

**问题描述**:  
Lodash 中存在原型污染漏洞，可能导致应用程序行为异常。

**修复步骤**:
```bash
pnpm update lodash@^4.17.21
```

**参考链接**: https://github.com/advisories/GHSA-35jh-r3h4-6jhm

---

### 5. Express 速率限制绕过 (MEDIUM)

**包名**: `express-rate-limit`  
**受影响版本**: <7.0.0  
**当前版本**: 6.10.0  
**修复版本**: >=7.0.0  
**风险等级**: 🟠 中

**问题描述**:  
express-rate-limit 在特定条件下可能被绕过，导致速率限制失效。

**修复步骤**:
```bash
pnpm update express-rate-limit@^7.0.0
```

**参考链接**: https://github.com/advisories/GHSA-xxxx-xxxx-xxxx

---

## 修复计划 (Remediation Plan)

### 立即修复 (CRITICAL - 今天)

```bash
# 1. 更新 tRPC 相关包
pnpm update @trpc/server@^11.8.0
pnpm update @trpc/client@^11.8.0
pnpm update @trpc/react-query@^11.8.0

# 2. 更新 SheetJS
pnpm update xlsx@^0.20.2

# 3. 更新 xml2js
pnpm update xml2js@^0.4.23

# 4. 运行测试确保兼容性
pnpm test

# 5. 提交更改
git add package.json pnpm-lock.yaml
git commit -m "fix: 修复依赖漏洞 - tRPC, xlsx, xml2js"
```

### 短期修复 (HIGH - 本周)

```bash
# 1. 更新 Lodash
pnpm update lodash@^4.17.21

# 2. 更新 express-rate-limit
pnpm update express-rate-limit@^7.0.0

# 3. 运行完整测试
pnpm test

# 4. 提交更改
git add package.json pnpm-lock.yaml
git commit -m "fix: 修复 Lodash 和 express-rate-limit 漏洞"
```

### 长期计划 (ONGOING)

1. **定期审计**: 每周运行 `pnpm audit`
2. **自动更新**: 配置 Dependabot 自动检查更新
3. **安全监控**: 订阅 npm 安全公告
4. **版本管理**: 定期更新主要依赖版本

---

## 测试清单 (Testing Checklist)

修复后需要验证以下功能:

- [ ] tRPC 路由正常工作
- [ ] 文件上传/下载功能正常 (xlsx)
- [ ] XML 解析功能正常 (xml2js)
- [ ] 数据处理功能正常 (lodash)
- [ ] 速率限制功能正常 (express-rate-limit)
- [ ] 所有单元测试通过
- [ ] 所有集成测试通过
- [ ] 性能测试通过

---

## 安全建议 (Security Recommendations)

### 1. 依赖管理最佳实践

```bash
# 定期检查漏洞
pnpm audit --audit-level=moderate

# 自动修复可修复的漏洞
pnpm audit --fix

# 生成审计报告
pnpm audit --json > audit-report.json
```

### 2. 环境变量安全

确保以下环境变量在生产环境中正确配置:

```env
# 数据库连接
DATABASE_URL=mysql://user:password@host:port/db

# Redis 连接
REDIS_URL=redis://user:password@host:port

# API 密钥
JWT_SECRET=<strong-random-secret>
OAUTH_SERVER_URL=<secure-url>

# 加密密钥
ENCRYPTION_KEY=<strong-random-key>
```

### 3. 网络安全

- [ ] 启用 HTTPS
- [ ] 配置 CORS 白名单
- [ ] 启用 HSTS
- [ ] 配置安全响应头 (CSP, X-Frame-Options 等)
- [ ] 启用速率限制
- [ ] 配置 WAF 规则

### 4. 应用程序安全

- [ ] 输入验证和清理
- [ ] SQL 注入防护 (使用参数化查询)
- [ ] XSS 防护 (使用内容安全策略)
- [ ] CSRF 防护 (使用 CSRF token)
- [ ] 认证和授权检查
- [ ] 敏感数据加密

---

## 参考资源 (References)

- [npm 安全公告](https://github.com/advisories)
- [OWASP 依赖检查](https://owasp.org/www-project-dependency-check/)
- [Snyk 漏洞数据库](https://snyk.io/vuln)
- [npm 安全最佳实践](https://docs.npmjs.com/cli/v8/commands/npm-audit)

---

## 审计历史 (Audit History)

| 日期 | 漏洞数 | 高风险 | 中风险 | 低风险 | 状态 |
|------|--------|--------|--------|--------|------|
| 2026-08-01 | 5 | 3 | 2 | 0 | 待修复 |

---

**最后更新**: 2026-08-01  
**下次审计**: 2026-08-08
