# ICE Snow City 游戏 - Docker 部署指南

## 📋 目录

1. [快速开始](#快速开始)
2. [系统要求](#系统要求)
3. [环境配置](#环境配置)
4. [部署步骤](#部署步骤)
5. [常见问题](#常见问题)
6. [监控和维护](#监控和维护)

---

## 🚀 快速开始

### 最快部署（3 分钟）

```bash
# 1. 克隆项目
git clone <repository-url>
cd ice_snow_city_agent

# 2. 复制环境变量
cp .env.example .env

# 3. 编辑 .env 文件，填入必要的配置
nano .env

# 4. 启动所有服务
docker-compose up -d

# 5. 查看日志
docker-compose logs -f app
```

---

## 📦 系统要求

### 硬件要求

| 资源 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 2 核 | 4 核 |
| 内存 | 2 GB | 8 GB |
| 存储 | 10 GB | 50 GB |
| 网络 | 1 Mbps | 10 Mbps |

### 软件要求

- Docker >= 20.10
- Docker Compose >= 2.0
- Linux/macOS/Windows (WSL2)

### 安装 Docker

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**macOS:**
```bash
brew install docker docker-compose
```

**Windows:**
下载 [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

## ⚙️ 环境配置

### 1. 复制环境变量文件

```bash
cp .env.example .env
```

### 2. 编辑 .env 文件

**关键配置项：**

```env
# 数据库
DATABASE_URL=mysql://app:password@db:3306/ice_snow_city
DB_PASSWORD=your-secure-password

# JWT 密钥（生成新的）
JWT_SECRET=$(openssl rand -base64 32)

# OAuth 配置
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im

# 区块链
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-e05a7b27c556f32c853457c1aebce4.prylabs.net:8545
ICESNOWCOIN_CONTRACT_ADDRESS=0x...
```

### 3. 生成安全密钥

```bash
# 生成 JWT 密钥
openssl rand -base64 32

# 生成 HMAC 密钥
openssl rand -hex 32
```

---

## 🔧 部署步骤

### 方式 1：使用 Docker Compose（推荐）

#### 步骤 1: 构建镜像

```bash
docker-compose build
```

#### 步骤 2: 启动服务

```bash
# 后台启动
docker-compose up -d

# 前台启动（查看日志）
docker-compose up
```

#### 步骤 3: 初始化数据库

```bash
# 运行数据库迁移
docker-compose exec app pnpm run db:migrate

# 创建初始数据
docker-compose exec app pnpm run db:seed
```

#### 步骤 4: 验证部署

```bash
# 检查服务状态
docker-compose ps

# 查看应用日志
docker-compose logs app

# 测试 API
curl http://localhost:3000/health
```

### 方式 2：手动 Docker 部署

#### 步骤 1: 构建镜像

```bash
docker build -t ice-snow-city:latest .
```

#### 步骤 2: 启动 MySQL

```bash
docker run -d \
  --name ice-snow-city-db \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=ice_snow_city \
  -p 3306:3306 \
  mysql:8.0-alpine
```

#### 步骤 3: 启动 Redis

```bash
docker run -d \
  --name ice-snow-city-redis \
  -p 6379:6379 \
  redis:7-alpine
```

#### 步骤 4: 启动应用

```bash
docker run -d \
  --name ice-snow-city-app \
  -p 3000:3000 \
  --link ice-snow-city-db \
  --link ice-snow-city-redis \
  -e DATABASE_URL=mysql://root:root@ice-snow-city-db:3306/ice_snow_city \
  -e REDIS_URL=redis://ice-snow-city-redis:6379 \
  ice-snow-city:latest
```

---

## 📊 服务架构

```
┌─────────────────────────────────────────┐
│         Nginx 反向代理 (80/443)         │
└────────────────┬────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
    ┌────▼─────┐    ┌────▼──────┐
    │ 前端应用  │    │ 后端 API   │
    │ (React)  │    │ (Express)  │
    └────┬─────┘    └────┬───────┘
         │                │
         └────────┬───────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼──────┐    ┌────▼──────┐
    │  MySQL DB │    │   Redis   │
    │           │    │  Cache    │
    └───────────┘    └───────────┘
```

---

## 🔍 常见问题

### Q: 如何查看应用日志？

```bash
# 查看所有服务日志
docker-compose logs

# 只查看应用日志
docker-compose logs app

# 实时查看日志
docker-compose logs -f app

# 查看最后 100 行日志
docker-compose logs --tail=100 app
```

### Q: 如何重启服务？

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart app

# 停止并重新启动
docker-compose down
docker-compose up -d
```

### Q: 数据库连接失败？

```bash
# 检查数据库服务状态
docker-compose ps db

# 查看数据库日志
docker-compose logs db

# 测试数据库连接
docker-compose exec app mysql -h db -u app -p
```

### Q: 如何备份数据库？

```bash
# 导出数据库
docker-compose exec db mysqldump -u root -p ice_snow_city > backup.sql

# 导入数据库
docker-compose exec -T db mysql -u root -p ice_snow_city < backup.sql
```

### Q: 如何更新应用？

```bash
# 停止应用
docker-compose down

# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose build

# 启动应用
docker-compose up -d
```

---

## 📈 监控和维护

### 健康检查

```bash
# 检查应用健康状态
curl http://localhost:3000/health

# 检查数据库连接
docker-compose exec app curl http://localhost:3000/health/db

# 检查缓存连接
docker-compose exec app curl http://localhost:3000/health/cache
```

### 性能监控

```bash
# 查看容器资源使用情况
docker stats

# 查看特定容器的资源使用
docker stats ice-snow-city-app
```

### 日志管理

```bash
# 查看容器日志大小
docker exec ice-snow-city-app du -sh /app/logs

# 清理旧日志
docker exec ice-snow-city-app find /app/logs -type f -mtime +30 -delete
```

### 备份策略

**每日备份：**
```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份数据库
docker-compose exec -T db mysqldump -u root -p ice_snow_city > $BACKUP_DIR/db_$DATE.sql

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz ./uploads

# 删除 30 天前的备份
find $BACKUP_DIR -type f -mtime +30 -delete
```

---

## 🔐 安全建议

1. **更改默认密码**
   ```bash
   # 更改数据库密码
   docker-compose exec db mysql -u root -p
   ALTER USER 'app'@'%' IDENTIFIED BY 'new-password';
   ```

2. **启用 HTTPS**
   ```bash
   # 生成自签名证书
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

3. **配置防火墙**
   ```bash
   # 只允许特定 IP 访问
   ufw allow from 192.168.1.0/24 to any port 3000
   ```

4. **定期更新**
   ```bash
   # 更新基础镜像
   docker pull node:22-alpine
   docker pull mysql:8.0-alpine
   docker pull redis:7-alpine
   ```

---

## 📞 支持

如有问题，请联系：
- GitHub Issues: https://github.com/your-repo/issues
- Email: support@example.com
- Discord: https://discord.gg/your-server
