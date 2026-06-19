# Ice Snow City - 日志聚合配置

## 1. 日志聚合架构

```
应用日志 → Logstash → Elasticsearch ← Kibana（可视化）
系统日志 ↗              ↓
审计日志 ↗         告警和通知
```

## 2. 日志类型和来源

| 日志类型 | 来源 | 格式 | 保留期 | 用途 |
|--------|------|------|--------|------|
| 应用日志 | Node.js 应用 | JSON | 30 天 | 应用调试和监控 |
| 系统日志 | 操作系统 | Syslog | 7 天 | 系统监控 |
| 审计日志 | 审计服务 | JSON | 90 天 | 合规和安全审计 |
| 数据库日志 | MySQL | 日志文件 | 7 天 | 数据库监控 |
| 网络日志 | 网络设备 | Syslog | 7 天 | 网络监控 |
| 安全日志 | 防火墙、IDS | Syslog | 30 天 | 安全监控 |

## 3. ELK Stack 配置

### 3.1 Elasticsearch 配置

```yaml
# elasticsearch.yml
cluster.name: ice-snow-city
node.name: node-1
node.roles: [master, data]

# 内存配置
bootstrap.memory_lock: true
ES_JAVA_OPTS: "-Xms4g -Xmx4g"

# 网络配置
network.host: 0.0.0.0
http.port: 9200

# 索引配置
index.number_of_shards: 5
index.number_of_replicas: 1

# 日志保留
index.lifecycle.name: logs-policy
index.lifecycle.rollover_alias: logs-write
```

### 3.2 Logstash 配置

```ruby
# logstash.conf
input {
  # 应用日志
  file {
    path => "/var/log/app/*.log"
    start_position => "beginning"
    codec => json
    tags => ["app"]
  }
  
  # 系统日志
  syslog {
    port => 514
    tags => ["system"]
  }
  
  # 审计日志
  file {
    path => "/var/log/audit/*.log"
    start_position => "beginning"
    codec => json
    tags => ["audit"]
  }
}

filter {
  # 解析日志
  if [type] == "json" {
    json {
      source => "message"
    }
  }
  
  # 添加时间戳
  date {
    match => ["timestamp", "ISO8601"]
    target => "@timestamp"
  }
  
  # 添加主机信息
  mutate {
    add_field => { "host" => "%{hostname}" }
  }
}

output {
  # 输出到 Elasticsearch
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "logs-%{+YYYY.MM.dd}"
  }
  
  # 也输出到文件作为备份
  file {
    path => "/var/log/logstash/%{+YYYY-MM-dd}.log"
  }
}
```

### 3.3 Kibana 配置

```yaml
# kibana.yml
server.port: 5601
server.host: "0.0.0.0"
elasticsearch.hosts: ["http://localhost:9200"]

# 索引模式
kibana.defaultAppId: "discover"
```

## 4. 日志索引策略

### 4.1 索引命名规范

```
logs-{应用名}-{日志类型}-{日期}
logs-ice-snow-city-app-2026.06.19
logs-ice-snow-city-audit-2026.06.19
logs-ice-snow-city-system-2026.06.19
```

### 4.2 索引生命周期管理（ILM）

| 阶段 | 时间 | 操作 |
|------|------|------|
| Hot | 0-7 天 | 写入和查询 |
| Warm | 7-30 天 | 只读，优化存储 |
| Cold | 30-90 天 | 归档，极少查询 |
| Delete | 90+ 天 | 删除 |

## 5. 日志查询和分析

### 5.1 常见查询

#### 查询错误日志
```
level: "ERROR" AND timestamp: [now-1h TO now]
```

#### 查询特定用户的操作
```
user_id: "user123" AND action: "*" AND timestamp: [now-1d TO now]
```

#### 查询数据库慢查询
```
type: "database" AND duration: [1000 TO *] AND timestamp: [now-1h TO now]
```

#### 查询 API 错误
```
type: "api" AND status_code: [400 TO 599] AND timestamp: [now-1h TO now]
```

### 5.2 日志仪表板

#### 应用监控仪表板
- 错误率趋势
- 请求延迟分布
- 用户活跃度
- API 调用量

#### 审计日志仪表板
- 用户操作统计
- 敏感操作告警
- 访问控制违规
- 数据修改记录

#### 系统监控仪表板
- CPU 和内存使用率
- 磁盘 I/O
- 网络流量
- 进程状态

## 6. 日志告警规则

### 6.1 应用日志告警

```json
{
  "name": "High Error Rate",
  "condition": "error_count > 100 in 5m",
  "severity": "warning",
  "notification": ["email", "slack"]
}
```

```json
{
  "name": "Critical Error",
  "condition": "level: CRITICAL",
  "severity": "critical",
  "notification": ["email", "slack", "sms", "pagerduty"]
}
```

### 6.2 审计日志告警

```json
{
  "name": "Unauthorized Access Attempt",
  "condition": "action: \"unauthorized_access\"",
  "severity": "critical",
  "notification": ["email", "slack", "sms"]
}
```

```json
{
  "name": "Sensitive Data Access",
  "condition": "action: \"access_sensitive_data\" AND user_role: \"user\"",
  "severity": "warning",
  "notification": ["email", "slack"]
}
```

## 7. 日志安全和隐私

### 7.1 敏感信息过滤

在 Logstash 中过滤敏感信息：

```ruby
filter {
  # 过滤密码
  mutate {
    gsub => ["message", "password=[^\s]+", "password=***"]
  }
  
  # 过滤 API 密钥
  mutate {
    gsub => ["message", "api_key=[^\s]+", "api_key=***"]
  }
  
  # 过滤个人信息
  mutate {
    gsub => ["message", "\d{3}-\d{2}-\d{4}", "SSN=***"]
  }
}
```

### 7.2 日志访问控制

- **管理员**：可以访问所有日志
- **运维人员**：可以访问应用日志和系统日志
- **开发人员**：只能访问应用日志中与自己相关的部分
- **审计人员**：只能访问审计日志

### 7.3 日志加密

- 传输加密：使用 TLS 加密日志传输
- 存储加密：使用 Elasticsearch 的加密功能

## 8. 日志存储和成本

| 组件 | 成本 | 说明 |
|------|------|------|
| Elasticsearch | $0-$1,000/月 | 开源或付费云服务 |
| Logstash | $0-$500/月 | 开源或付费 |
| Kibana | $0-$500/月 | 开源或付费 |
| 存储成本 | $100-$500/月 | 根据日志量计算 |
| 总成本 | $100-$2,500/月 | 月度成本 |

## 9. 日志最佳实践

1. **结构化日志**：使用 JSON 格式的结构化日志
2. **统一日志格式**：所有应用使用统一的日志格式
3. **日志级别**：正确使用 DEBUG、INFO、WARNING、ERROR、CRITICAL
4. **性能监控**：监控日志系统的性能
5. **定期审查**：定期审查日志保留策略
6. **备份**：定期备份日志数据
7. **合规性**：确保日志符合法规要求

## 10. 日志系统监控

### 10.1 监控指标

| 指标 | 阈值 | 告警级别 |
|------|------|--------|
| Elasticsearch 堆内存使用率 | > 80% | 警告 |
| Elasticsearch 磁盘使用率 | > 85% | 警告 |
| Logstash 处理延迟 | > 5s | 警告 |
| 日志丢失率 | > 0.1% | 严重 |
| 查询响应时间 | > 5s | 警告 |

### 10.2 监控仪表板

- Elasticsearch 集群状态
- Logstash 处理性能
- 日志摄入速率
- 存储使用趋势

---

**最后更新**：2026-06-18
**版本**：1.0.0
**状态**：生产就绪
