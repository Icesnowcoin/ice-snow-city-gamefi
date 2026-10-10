# 住宅系统设计文档

## 1. 系统概述

住宅系统是 Ice Snow City 游戏的核心经济系统之一，允许玩家购买、出租和管理各类住宅物业。该系统包括三种主要住宅类型：公寓、别墅和酒店。

### 1.1 系统目标

- 提供玩家房地产投资和管理的机制
- 创造稳定的被动收入来源
- 促进玩家之间的交易和互动
- 支持游戏内经济的循环

### 1.2 核心特性

- **多种住宅类型**：公寓、别墅、酒店
- **动态定价**：基于位置、等级、设施的价格计算
- **租赁管理**：出租、续租、终止租赁
- **维护系统**：定期维护以保持物业价值
- **升级系统**：升级物业以提高收入和容量
- **税收系统**：政府税收和维护费用

## 2. 数据模型

### 2.1 住宅物业表 (residential_properties)

```sql
CREATE TABLE residential_properties (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  owner_id INT NOT NULL,
  property_type ENUM('apartment', 'villa', 'hotel') NOT NULL,
  location_x INT NOT NULL,
  location_y INT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  purchase_price BIGINT NOT NULL,
  current_value BIGINT NOT NULL,
  capacity INT NOT NULL,
  occupancy INT NOT NULL DEFAULT 0,
  monthly_revenue BIGINT NOT NULL,
  maintenance_cost BIGINT NOT NULL,
  last_maintenance TIMESTAMP,
  condition_percentage INT NOT NULL DEFAULT 100,
  status ENUM('active', 'maintenance', 'abandoned') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  INDEX idx_owner (owner_id),
  INDEX idx_location (location_x, location_y),
  INDEX idx_status (status)
);
```

### 2.2 租赁记录表 (rental_records)

```sql
CREATE TABLE rental_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  property_id BIGINT NOT NULL,
  tenant_id INT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  monthly_rent BIGINT NOT NULL,
  total_paid BIGINT NOT NULL DEFAULT 0,
  status ENUM('active', 'completed', 'terminated') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES residential_properties(id),
  FOREIGN KEY (tenant_id) REFERENCES users(id),
  INDEX idx_property (property_id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_status (status)
);
```

### 2.3 维护记录表 (maintenance_records)

```sql
CREATE TABLE maintenance_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  property_id BIGINT NOT NULL,
  maintenance_type ENUM('routine', 'repair', 'upgrade') NOT NULL,
  cost BIGINT NOT NULL,
  condition_restored INT NOT NULL,
  completion_date TIMESTAMP,
  status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES residential_properties(id),
  INDEX idx_property (property_id),
  INDEX idx_status (status)
);
```

## 3. 业务逻辑

### 3.1 住宅类型配置

| 类型 | 基础价格 | 容量 | 月收入 | 维护费用 | 升级成本倍数 |
|------|---------|------|--------|---------|------------|
| 公寓 | 50,000 ISC | 10 | 2,000 ISC | 500 ISC | 1.0x |
| 别墅 | 150,000 ISC | 4 | 8,000 ISC | 2,000 ISC | 1.5x |
| 酒店 | 500,000 ISC | 50 | 25,000 ISC | 5,000 ISC | 2.0x |

### 3.2 收入计算

```
月收入 = 基础收入 × 等级倍数 × 入住率 × 条件系数
等级倍数 = 1 + (等级 - 1) × 0.2
条件系数 = 当前状况 / 100
入住率 = 当前入住 / 容量
```

### 3.3 维护系统

- **定期维护**：每月自动扣除维护费用
- **状况衰减**：每月衰减 2-5%（基于使用率）
- **紧急维修**：状况低于 50% 时，收入降低 50%
- **完全维修**：恢复状况到 100%

### 3.4 升级系统

- **等级上限**：20 级
- **升级成本**：基础价格 × 等级 × 类型倍数
- **升级效果**：
  - 容量增加 20%
  - 月收入增加 20%
  - 维护费用增加 15%

### 3.5 租赁系统

- **租赁期限**：1 个月至 12 个月
- **租金计算**：月收入 × 租赁期限 × 0.7（房东获得 70%）
- **自动续租**：支持自动续租功能
- **提前终止**：扣除 10% 的租金作为违约金

## 4. 系统流程

### 4.1 购买流程

1. 玩家浏览可用物业
2. 选择物业并查看详情
3. 确认购买
4. 扣除 ISC 并转移所有权
5. 物业进入"活跃"状态

### 4.2 出租流程

1. 房东设置租金和租期
2. 租客查看并申请租赁
3. 房东确认申请
4. 租金支付并生成租赁记录
5. 租客入住

### 4.3 维护流程

1. 系统定期检查物业状况
2. 如需维护，自动扣除维护费用
3. 更新物业状况
4. 记录维护历史

## 5. 前端设计

### 5.1 页面结构

- **物业列表页**：显示所有可购买的物业
- **我的物业页**：显示已拥有的物业
- **物业详情页**：显示物业详细信息和管理选项
- **租赁管理页**：管理租赁记录和租客
- **维护记录页**：查看维护历史

### 5.2 关键功能

- 物业搜索和筛选
- 实时收入计算
- 维护提醒
- 租赁申请管理
- 升级预览

## 6. 测试策略

### 6.1 单元测试

- 收入计算逻辑
- 维护系统逻辑
- 升级系统逻辑
- 租赁系统逻辑
- 税收计算逻辑

### 6.2 集成测试

- 完整的购买流程
- 完整的出租流程
- 完整的维护流程
- 多玩家交互场景

### 6.3 性能测试

- 大量物业查询性能
- 批量维护操作性能
- 并发租赁操作性能

## 7. 安全考虑

- 所有交易需要验证玩家余额
- 防止重复购买同一物业
- 防止非法修改物业状态
- 审计所有重要交易

## 8. 未来扩展

- 物业交易市场
- 物业保险系统
- 社区设施共享
- 物业评级系统
- 房地产投资基金
