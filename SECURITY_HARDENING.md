# 安全加固指南 (Security Hardening Guide)

**项目**: Ice Snow City Backend Agent  
**最后更新**: 2026-08-01  
**版本**: 1.0.0

## 目录 (Table of Contents)

1. [概述](#概述)
2. [环境安全](#环境安全)
3. [应用程序安全](#应用程序安全)
4. [数据库安全](#数据库安全)
5. [API 安全](#api-安全)
6. [部署安全](#部署安全)
7. [监控和日志](#监控和日志)
8. [事件响应](#事件响应)

---

## 概述

本指南提供了 Ice Snow City 项目的安全加固建议，涵盖从开发到生产部署的各个阶段。

### 安全原则

- **最小权限原则**: 只授予必要的权限
- **纵深防御**: 多层安全防护
- **安全默认**: 默认配置应该是安全的
- **定期审计**: 定期检查和更新安全配置

---

## 环境安全

### 1. 环境变量管理

**✅ 推荐做法**:

```bash
# 使用 .env.local (不提交到 Git)
DATABASE_URL=mysql://user:password@localhost:3306/ice_snow_city
REDIS_URL=redis://localhost:6379
JWT_SECRET=<strong-random-secret-32-chars>
ENCRYPTION_KEY=<strong-random-key-32-chars>
```

**❌ 不推荐做法**:

```bash
# 不要在代码中硬编码密钥
const SECRET = "my-secret-key";

# 不要在 Git 中提交 .env 文件
git add .env  # ❌ 错误

# 不要使用弱密钥
JWT_SECRET=password123  # ❌ 弱
```

### 2. 密钥轮换

```bash
# 定期生成新密钥 (建议每 90 天)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 更新环境变量
export JWT_SECRET=<new-secret>
export ENCRYPTION_KEY=<new-key>

# 重启应用
pm2 restart ice_snow_city_agent
```

### 3. 依赖安全

```bash
# 定期审计依赖
pnpm audit

# 自动修复可修复的漏洞
pnpm audit --fix

# 检查过期的依赖
pnpm outdated

# 更新依赖
pnpm update
```

---

## 应用程序安全

### 1. 输入验证

**✅ 推荐做法**:

```typescript
// 使用 Zod 进行输入验证
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(20),
});

// 在 tRPC 路由中使用
export const userRouter = router({
  create: publicProcedure
    .input(userSchema)
    .mutation(async ({ input }) => {
      // input 已验证
      return db.user.create(input);
    }),
});
```

### 2. SQL 注入防护

**✅ 推荐做法**:

```typescript
// 使用参数化查询 (Drizzle ORM)
import { eq } from "drizzle-orm";

const user = await db.user.findFirst({
  where: eq(db.user.email, email),
});
```

**❌ 不推荐做法**:

```typescript
// 字符串拼接 (容易被 SQL 注入)
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

### 3. XSS 防护

**✅ 推荐做法**:

```typescript
// React 自动转义用户输入
const UserProfile = ({ username }) => {
  return <div>{username}</div>; // 自动转义
};

// 使用 DOMPurify 清理 HTML
import DOMPurify from "dompurify";
const clean = DOMPurify.sanitize(userContent);
```

### 4. CSRF 防护

**✅ 推荐做法**:

```typescript
// tRPC 自动处理 CSRF 防护
// 使用 SameSite Cookie
response.setHeader(
  "Set-Cookie",
  "sessionId=...; SameSite=Strict; HttpOnly; Secure"
);
```

### 5. 认证和授权

**✅ 推荐做法**:

```typescript
// 使用 protectedProcedure 进行认证检查
export const protectedProcedure = baseProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// 使用角色检查进行授权
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});
```

---

## 数据库安全

### 1. 连接安全

**✅ 推荐做法**:

```env
# 使用 SSL/TLS 连接
DATABASE_URL=mysql://user:password@host:3306/db?ssl=true&sslMode=require
REDIS_URL=redis://:password@host:6379?tls=true
```

### 2. 访问控制

```sql
-- 创建只读用户
CREATE USER 'app_read'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT ON ice_snow_city.* TO 'app_read'@'localhost';

-- 创建读写用户
CREATE USER 'app_write'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ice_snow_city.* TO 'app_write'@'localhost';

-- 创建管理员用户
CREATE USER 'app_admin'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON ice_snow_city.* TO 'app_admin'@'localhost';
```

### 3. 数据加密

**✅ 推荐做法**:

```typescript
// 加密敏感数据
import crypto from "crypto";

const encryptSensitiveData = (data: string, key: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

const decryptSensitiveData = (encrypted: string, key: string) => {
  const [iv, data] = encrypted.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key),
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
```

### 4. 备份和恢复

```bash
# 定期备份数据库
mysqldump -u user -p database > backup-$(date +%Y%m%d).sql

# 测试恢复
mysql -u user -p database < backup-20260801.sql

# 加密备份
gpg --symmetric backup-20260801.sql

# 存储在安全位置
aws s3 cp backup-20260801.sql.gpg s3://backup-bucket/
```

---

## API 安全

### 1. 速率限制

**✅ 推荐做法**:

```typescript
import rateLimit from "express-rate-limit";

// 全局限制
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 分钟
  max: 1000, // 1000 请求
  message: "Too many requests, please try again later",
});

// IP 限制
const ipLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.ip,
});

// 用户限制
const userLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  keyGenerator: (req) => req.user?.id || req.ip,
});

app.use(globalLimiter);
app.use("/api/", ipLimiter);
app.use("/api/auth/", userLimiter);
```

### 2. CORS 配置

**✅ 推荐做法**:

```typescript
import cors from "cors";

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["https://example.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 3600,
};

app.use(cors(corsOptions));
```

### 3. 安全响应头

**✅ 推荐做法**:

```typescript
import helmet from "helmet";

app.use(helmet());

// 自定义配置
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  })
);

app.use(
  helmet.hsts({
    maxAge: 31536000, // 1 年
    includeSubDomains: true,
    preload: true,
  })
);
```

### 4. API 版本控制

**✅ 推荐做法**:

```typescript
// 使用版本前缀
app.use("/api/v1/", v1Router);
app.use("/api/v2/", v2Router);

// 在 tRPC 中使用版本
export const v1Router = router({
  user: userRouter,
});
```

---

## 部署安全

### 1. 容器安全

**✅ 推荐做法** (Dockerfile):

```dockerfile
# 使用最小基础镜像
FROM node:20-alpine

# 不以 root 用户运行
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 复制文件
COPY --chown=nodejs:nodejs . .

# 安装依赖
RUN pnpm install --frozen-lockfile

# 切换用户
USER nodejs

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 启动应用
CMD ["pnpm", "start"]
```

### 2. 环境隔离

```bash
# 开发环境
NODE_ENV=development
DEBUG=true

# 测试环境
NODE_ENV=test
DEBUG=false

# 生产环境
NODE_ENV=production
DEBUG=false
```

### 3. 日志和监控

```typescript
// 配置日志
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// 不要记录敏感信息
logger.info("User login", { userId: user.id }); // ✅ 安全
logger.info("User login", { password: user.password }); // ❌ 不安全
```

---

## 监控和日志

### 1. 审计日志

```typescript
// 记录所有敏感操作
const auditLog = async (action: string, userId: string, details: any) => {
  await db.auditLog.create({
    action,
    userId,
    details,
    timestamp: new Date(),
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });
};
```

### 2. 安全监控

```bash
# 监控失败的登录尝试
SELECT COUNT(*) FROM audit_logs 
WHERE action = 'LOGIN_FAILED' 
AND timestamp > NOW() - INTERVAL 1 HOUR;

# 监控异常活动
SELECT * FROM audit_logs 
WHERE action IN ('DELETE_USER', 'MODIFY_PERMISSIONS') 
ORDER BY timestamp DESC;
```

---

## 事件响应

### 1. 安全事件处理流程

1. **检测**: 监控系统检测到异常
2. **隔离**: 隔离受影响的系统
3. **分析**: 分析事件原因
4. **修复**: 修复漏洞
5. **恢复**: 恢复系统
6. **总结**: 总结经验教训

### 2. 应急联系方式

- **安全团队**: security@example.com
- **管理员**: admin@example.com
- **值班人员**: oncall@example.com

---

## 安全检查清单 (Security Checklist)

### 开发阶段

- [ ] 使用强密码和密钥
- [ ] 启用输入验证
- [ ] 使用参数化查询
- [ ] 启用 HTTPS
- [ ] 配置 CORS
- [ ] 添加速率限制
- [ ] 实现认证和授权
- [ ] 记录审计日志

### 部署前

- [ ] 运行 `pnpm audit`
- [ ] 运行所有测试
- [ ] 进行代码审查
- [ ] 进行安全审计
- [ ] 配置监控和告警
- [ ] 准备应急计划
- [ ] 备份数据库
- [ ] 测试恢复过程

### 部署后

- [ ] 监控系统日志
- [ ] 监控性能指标
- [ ] 监控安全告警
- [ ] 定期更新依赖
- [ ] 定期进行安全审计
- [ ] 定期进行备份

---

## 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js 安全最佳实践](https://nodejs.org/en/docs/guides/security/)
- [Express 安全最佳实践](https://expressjs.com/en/advanced/best-practice-security.html)
- [npm 安全最佳实践](https://docs.npmjs.com/cli/v8/commands/npm-audit)

---

**最后更新**: 2026-08-01  
**下次审查**: 2026-09-01
