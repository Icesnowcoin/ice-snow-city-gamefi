# 社交系统测试 - GitHub Issues 任务列表

## 使用说明

本文档包含所有测试用例转换为 GitHub Issues 格式的任务列表。可直接复制到 GitHub Issues 中创建。

每个 Issue 包含以下信息：
- **标题**: 清晰的测试用例名称
- **描述**: 测试步骤和预期结果
- **标签**: 优先级、测试类型、模块
- **里程碑**: 测试阶段
- **分配**: 测试人员

---

## Issue 模板

```markdown
## [测试用例 ID] 测试用例名称

**优先级**: P0/P1/P2  
**模块**: ChatManager/FriendsManager/TeamManager/UI/Events/ErrorHandling/Boundary  
**类型**: Unit/Integration/UI/Performance/Compatibility  
**阶段**: Week 1/Week 2/Week 3/Week 4  

### 测试步骤

1. 
2. 
3. 

### 预期结果

✅ 

### 测试数据

- 

### 相关文件

- 

### 检查清单

- [ ] 环境准备
- [ ] 测试执行
- [ ] 结果验证
- [ ] 缺陷报告 (如有)
- [ ] 文档更新

### 备注

```

---

## ChatManager 测试 Issues

### Issue 1: TC-1.1 创建频道

```markdown
## TC-1.1 创建频道

**优先级**: P0 (关键)  
**模块**: ChatManager  
**类型**: Unit Test  
**阶段**: Week 1  
**标签**: `test-chatmanager`, `priority-p0`, `unit-test`

### 测试步骤

1. 初始化 ChatManager
2. 调用 `createChannel('private', 'Test Channel')`
3. 验证返回的 Channel 对象包含正确的 id、type、name

### 预期结果

✅ 频道创建成功，返回有效的 Channel 对象，包含：
- 唯一的 channelId
- 正确的 channelType ('private')
- 正确的 channelName ('Test Channel')
- 创建时间戳

### 测试数据

- channelType: 'private'
- channelName: 'Test Channel'

### 相关文件

- `client/src/game/social/ChatManager.ts`
- `client/src/game/social/ChatManager.test.ts`

### 检查清单

- [ ] 环境准备 (Node.js, 依赖安装)
- [ ] 运行单元测试
- [ ] 验证测试通过
- [ ] 检查代码覆盖率 (≥ 80%)
- [ ] 记录测试结果

### 备注

这是 ChatManager 的基础功能测试，必须通过才能进行后续测试。
```

---

### Issue 2: TC-1.2 发送消息

```markdown
## TC-1.2 发送消息

**优先级**: P0 (关键)  
**模块**: ChatManager  
**类型**: Unit Test  
**阶段**: Week 1  
**标签**: `test-chatmanager`, `priority-p0`, `unit-test`

### 测试步骤

1. 创建一个频道
2. 调用 `sendMessage(channelId, 'Hello World', userId)`
3. 验证消息被添加到频道消息列表
4. 验证消息对象包含正确的内容、发送者、时间戳

### 预期结果

✅ 消息发送成功，返回 Message 对象，包含：
- 唯一的 messageId
- 正确的消息内容 ('Hello World')
- 正确的发送者 ID
- 有效的时间戳
- 消息状态 ('sent')

### 测试数据

- channelId: 有效的频道 ID
- content: 'Hello World'
- userId: 有效的用户 ID

### 相关文件

- `client/src/game/social/ChatManager.ts`
- `client/src/game/social/ChatManager.test.ts`

### 检查清单

- [ ] 环境准备
- [ ] 运行单元测试
- [ ] 验证消息内容
- [ ] 验证时间戳准确性
- [ ] 记录测试结果

### 备注

确保消息对象的所有字段都被正确初始化。
```

---

### Issue 3: TC-1.3 订阅频道消息

```markdown
## TC-1.3 订阅频道消息

**优先级**: P0 (关键)  
**模块**: ChatManager  
**类型**: Unit Test  
**阶段**: Week 1  
**标签**: `test-chatmanager`, `priority-p0`, `unit-test`, `event-driven`

### 测试步骤

1. 创建一个频道
2. 调用 `subscribeToChannel(channelId, callback)`
3. 发送新消息到该频道
4. 验证 callback 被触发
5. 验证 callback 接收到正确的消息对象

### 预期结果

✅ 订阅成功，新消息时立即调用 callback，callback 接收到完整的 Message 对象

### 测试数据

- channelId: 有效的频道 ID
- callback: 事件处理函数

### 相关文件

- `client/src/game/social/ChatManager.ts`
- `client/src/game/social/ChatManager.test.ts`

### 检查清单

- [ ] 环境准备
- [ ] 运行单元测试
- [ ] 验证 callback 触发
- [ ] 验证消息数据完整性
- [ ] 测试取消订阅功能
- [ ] 记录测试结果

### 备注

这是事件驱动系统的核心测试，确保实时消息传递正常工作。
```

---

### Issue 4: TC-1.4 获取消息历史

```markdown
## TC-1.4 获取消息历史

**优先级**: P1 (重要)  
**模块**: ChatManager  
**类型**: Unit Test  
**阶段**: Week 1  
**标签**: `test-chatmanager`, `priority-p1`, `unit-test`

### 测试步骤

1. 创建频道并发送 10 条消息
2. 调用 `getMessages(channelId, 5)`
3. 验证返回最新的 5 条消息
4. 验证消息顺序正确 (最新的在前)

### 预期结果

✅ 返回正确数量的消息，按时间倒序排列

### 测试数据

- 消息数量: 10
- 查询限制: 5

### 相关文件

- `client/src/game/social/ChatManager.ts`
- `client/src/game/social/ChatManager.test.ts`

### 检查清单

- [ ] 环境准备
- [ ] 运行单元测试
- [ ] 验证消息数量
- [ ] 验证消息顺序
- [ ] 测试不同的 limit 值
- [ ] 记录测试结果

### 备注

确保消息按时间倒序排列，最新的消息在列表前面。
```

---

### Issue 5: TC-1.5 标记消息已读

```markdown
## TC-1.5 标记消息已读

**优先级**: P2 (一般)  
**模块**: ChatManager  
**类型**: Unit Test  
**阶段**: Week 1  
**标签**: `test-chatmanager`, `priority-p2`, `unit-test`

### 测试步骤

1. 发送消息
2. 调用 `markMessageAsRead(messageId, userId)`
3. 验证消息状态变为已读
4. 验证消息的 readBy 列表包含该用户

### 预期结果

✅ 消息标记为已读，readBy 列表更新

### 测试数据

- messageId: 有效的消息 ID
- userId: 有效的用户 ID

### 相关文件

- `client/src/game/social/ChatManager.ts`
- `client/src/game/social/ChatManager.test.ts`

### 检查清单

- [ ] 环境准备
- [ ] 运行单元测试
- [ ] 验证消息状态
- [ ] 验证 readBy 列表
- [ ] 测试多个用户标记
- [ ] 记录测试结果
```

---

### Issue 6: TC-1.6 获取未读消息数

```markdown
## TC-1.6 获取未读消息数

**优先级**: P2 (一般)  
**模块**: ChatManager  
**类型**: Unit Test  
**阶段**: Week 1  
**标签**: `test-chatmanager`, `priority-p2`, `unit-test`

### 测试步骤

1. 发送 3 条消息
2. 标记 1 条消息为已读
3. 调用 `getUnreadCount(channelId, userId)`
4. 验证返回正确的未读数 (2)

### 预期结果

✅ 返回正确的未读消息数

### 测试数据

- 消息总数: 3
- 已读消息: 1
- 预期未读数: 2

### 相关文件

- `client/src/game/social/ChatManager.ts`
- `client/src/game/social/ChatManager.test.ts`

### 检查清单

- [ ] 环境准备
- [ ] 运行单元测试
- [ ] 验证未读数计算
- [ ] 测试标记后的变化
- [ ] 记录测试结果
```

---

## FriendsManager 测试 Issues

### Issue 7: TC-2.1 添加好友

```markdown
## TC-2.1 添加好友

**优先级**: P0 (关键)  
**模块**: FriendsManager  
**类型**: Unit Test  
**阶段**: Week 1  
**标签**: `test-friendsmanager`, `priority-p0`, `unit-test`

### 测试步骤

1. 初始化 FriendsManager
2. 调用 `addFriend(userId, friendId)`
3. 验证返回的 Friend 对象
4. 验证好友被添加到好友列表

### 预期结果

✅ 好友添加成功，返回 Friend 对象，包含：
- 好友 ID
- 好友名称
- 在线状态
- 添加时间

### 测试数据

- userId: 有效的用户 ID
- friendId: 有效的朋友 ID (不同于 userId)

### 相关文件

- `client/src/game/social/FriendsManager.ts`
- `client/src/game/social/FriendsManager.test.ts`

### 检查清单

- [ ] 环境准备
- [ ] 运行单元测试
- [ ] 验证好友对象
- [ ] 验证好友列表更新
- [ ] 测试重复添加 (应报错)
- [ ] 记录测试结果

### 备注

确保不能添加自己为好友，不能重复添加同一个好友。
```

---

### Issue 8: TC-2.2 移除好友

```markdown
## TC-2.2 移除好友

**优先级**: P0 (关键)  
**模块**: FriendsManager  
**类型**: Unit Test  
**阶段**: Week 1  
**标签**: `test-friendsmanager`, `priority-p0`, `unit-test`

### 测试步骤

1. 添加好友
2. 调用 `removeFriend(userId, friendId)`
3. 验证好友从列表中移除
4. 验证 getFriendsList 不再包含该好友

### 预期结果

✅ 好友移除成功，好友列表更新

### 测试数据

- userId: 有效的用户 ID
- friendId: 已添加的好友 ID

### 相关文件

- `client/src/game/social/FriendsManager.ts`
- `client/src/game/social/FriendsManager.test.ts`

### 检查清单

- [ ] 环境准备
- [ ] 运行单元测试
- [ ] 验证好友移除
- [ ] 验证列表更新
- [ ] 测试移除不存在的好友 (应报错)
- [ ] 记录测试结果
```

---

## TeamManager 测试 Issues

### Issue 9: TC-3.1 创建队伍

```markdown
## TC-3.1 创建队伍

**优先级**: P0 (关键)  
**模块**: TeamManager  
**类型**: Unit Test  
**阶段**: Week 1  
**标签**: `test-teammanager`, `priority-p0`, `unit-test`

### 测试步骤

1. 初始化 TeamManager
2. 调用 `createTeam('Dragon Slayers', leaderId)`
3. 验证返回的 Team 对象
4. 验证队长已自动加入队伍

### 预期结果

✅ 队伍创建成功，返回 Team 对象，包含：
- 队伍 ID
- 队伍名称
- 队长 ID
- 成员列表 (包含队长)
- 创建时间

### 测试数据

- teamName: 'Dragon Slayers'
- leaderId: 有效的用户 ID

### 相关文件

- `client/src/game/social/TeamManager.ts`
- `client/src/game/social/TeamManager.test.ts`

### 检查清单

- [ ] 环境准备
- [ ] 运行单元测试
- [ ] 验证队伍对象
- [ ] 验证队长自动加入
- [ ] 验证成员数量 (应为 1)
- [ ] 记录测试结果
```

---

## React 组件测试 Issues

### Issue 10: TC-4.1 ChatPanel 渲染

```markdown
## TC-4.1 ChatPanel 渲染

**优先级**: P0 (关键)  
**模块**: ChatPanel (React Component)  
**类型**: UI Test  
**阶段**: Week 2  
**标签**: `test-ui`, `priority-p0`, `ui-test`, `chatpanel`

### 测试步骤

1. 使用 React Testing Library 渲染 ChatPanel 组件
2. 验证所有频道标签显示
3. 验证消息列表显示
4. 验证消息输入框显示

### 预期结果

✅ 组件正确渲染，所有元素可见

### 测试数据

- channels: 5 个频道 (private, public, team, guild, community)
- messages: 10 条消息

### 相关文件

- `client/src/components/social/ChatPanel.tsx`
- `client/src/components/social/ChatPanel.test.tsx`

### 检查清单

- [ ] 环境准备 (React Testing Library 安装)
- [ ] 运行 UI 测试
- [ ] 验证所有元素渲染
- [ ] 验证样式应用
- [ ] 检查可访问性 (a11y)
- [ ] 记录测试结果

### 备注

使用 screen.getByRole, screen.getByText 等查询方法。
```

---

### Issue 11: TC-4.2 频道切换

```markdown
## TC-4.2 频道切换

**优先级**: P0 (关键)  
**模块**: ChatPanel (React Component)  
**类型**: UI Test  
**阶段**: Week 2  
**标签**: `test-ui`, `priority-p0`, `ui-test`, `chatpanel`

### 测试步骤

1. 渲染 ChatPanel
2. 点击不同的频道标签
3. 验证消息列表更新
4. 验证当前频道标签高亮

### 预期结果

✅ 频道切换成功，消息列表和 UI 状态更新

### 测试数据

- 初始频道: 'private'
- 切换到: 'public'

### 相关文件

- `client/src/components/social/ChatPanel.tsx`
- `client/src/components/social/ChatPanel.test.tsx`

### 检查清单

- [ ] 环境准备
- [ ] 运行 UI 测试
- [ ] 验证点击事件
- [ ] 验证消息列表更新
- [ ] 验证样式变化 (高亮)
- [ ] 记录测试结果
```

---

### Issue 12: TC-4.3 发送消息

```markdown
## TC-4.3 发送消息

**优先级**: P0 (关键)  
**模块**: ChatPanel (React Component)  
**类型**: UI Test  
**阶段**: Week 2  
**标签**: `test-ui`, `priority-p0`, `ui-test`, `chatpanel`

### 测试步骤

1. 渲染 ChatPanel
2. 在输入框输入消息 'Hello'
3. 按 Enter 发送
4. 验证消息出现在列表中
5. 验证输入框被清空

### 预期结果

✅ 消息发送成功，消息出现在列表中，输入框清空

### 测试数据

- 消息内容: 'Hello'

### 相关文件

- `client/src/components/social/ChatPanel.tsx`
- `client/src/components/social/ChatPanel.test.tsx`

### 检查清单

- [ ] 环境准备
- [ ] 运行 UI 测试
- [ ] 验证输入事件
- [ ] 验证 Enter 键处理
- [ ] 验证消息显示
- [ ] 验证输入框清空
- [ ] 记录测试结果
```

---

## 性能测试 Issues

### Issue 13: PT-1 消息发送延迟

```markdown
## PT-1 消息发送延迟

**优先级**: P1 (重要)  
**模块**: ChatManager, ChatPanel  
**类型**: Performance Test  
**阶段**: Week 3  
**标签**: `test-performance`, `priority-p1`, `performance-test`

### 测试步骤

1. 打开 Chrome DevTools Performance
2. 发送 100 条消息
3. 测量每条消息从发送到显示的延迟
4. 计算平均值和 P95 百分位数

### 预期结果

✅ 平均延迟 < 100ms，P95 < 200ms

### 测试数据

- 消息数量: 100
- 目标平均延迟: < 100ms
- 目标 P95 延迟: < 200ms

### 相关文件

- `client/src/components/social/ChatPanel.tsx`
- `client/src/game/social/ChatManager.ts`

### 检查清单

- [ ] 环境准备 (Chrome DevTools)
- [ ] 运行性能测试
- [ ] 记录延迟数据
- [ ] 生成性能报告
- [ ] 分析瓶颈
- [ ] 优化建议

### 备注

使用 Performance API 或 Chrome DevTools 测量延迟。
```

---

### Issue 14: PT-2 内存使用

```markdown
## PT-2 内存使用

**优先级**: P1 (重要)  
**模块**: ChatManager, ChatPanel  
**类型**: Performance Test  
**阶段**: Week 3  
**标签**: `test-performance`, `priority-p1`, `performance-test`

### 测试步骤

1. 打开 Chrome DevTools Memory
2. 加载 1000 条消息
3. 测量内存占用
4. 执行垃圾回收
5. 再次测量内存

### 预期结果

✅ 内存使用 < 50MB

### 测试数据

- 消息数量: 1000
- 目标内存: < 50MB

### 相关文件

- `client/src/components/social/ChatPanel.tsx`
- `client/src/game/social/ChatManager.ts`

### 检查清单

- [ ] 环境准备 (Chrome DevTools)
- [ ] 运行内存测试
- [ ] 记录内存数据
- [ ] 执行垃圾回收
- [ ] 生成内存报告
- [ ] 优化建议

### 备注

检查是否存在内存泄漏。
```

---

## 兼容性测试 Issues

### Issue 15: 浏览器兼容性 - Chrome

```markdown
## 浏览器兼容性 - Chrome 120+

**优先级**: P1 (重要)  
**模块**: 所有模块  
**类型**: Compatibility Test  
**阶段**: Week 3  
**标签**: `test-compatibility`, `priority-p1`, `browser-chrome`

### 测试步骤

1. 在 Chrome 120+ 中打开应用
2. 执行所有核心功能测试
3. 验证 UI 显示正确
4. 验证交互正常

### 预期结果

✅ 所有功能正常，UI 显示正确

### 测试环境

- 浏览器: Chrome 120+
- 操作系统: Windows/macOS/Linux

### 相关文件

- 所有组件和管理器

### 检查清单

- [ ] 环境准备
- [ ] 功能测试
- [ ] UI 验证
- [ ] 交互测试
- [ ] 记录结果

### 备注

Chrome 是主要支持的浏览器。
```

---

### Issue 16: 浏览器兼容性 - Firefox

```markdown
## 浏览器兼容性 - Firefox 121+

**优先级**: P1 (重要)  
**模块**: 所有模块  
**类型**: Compatibility Test  
**阶段**: Week 3  
**标签**: `test-compatibility`, `priority-p1`, `browser-firefox`

### 测试步骤

1. 在 Firefox 121+ 中打开应用
2. 执行所有核心功能测试
3. 验证 UI 显示正确
4. 验证交互正常

### 预期结果

✅ 所有功能正常，UI 显示正确

### 测试环境

- 浏览器: Firefox 121+
- 操作系统: Windows/macOS/Linux

### 相关文件

- 所有组件和管理器

### 检查清单

- [ ] 环境准备
- [ ] 功能测试
- [ ] UI 验证
- [ ] 交互测试
- [ ] 记录结果
```

---

### Issue 17: 响应式设计 - 移动端

```markdown
## 响应式设计 - 移动端 (< 600px)

**优先级**: P1 (重要)  
**模块**: UI 组件  
**类型**: Compatibility Test  
**阶段**: Week 3  
**标签**: `test-compatibility`, `priority-p1`, `responsive-mobile`

### 测试步骤

1. 使用 Chrome DevTools 设置移动视口 (375x667)
2. 测试所有页面和交互
3. 验证布局正确
4. 验证文本可读性
5. 验证按钮可点击

### 预期结果

✅ 移动端显示正确，所有功能可用

### 测试数据

- 视口: 375x667 (iPhone SE)

### 相关文件

- 所有 React 组件

### 检查清单

- [ ] 环境准备 (Chrome DevTools)
- [ ] 布局测试
- [ ] 可读性测试
- [ ] 交互测试
- [ ] 记录结果
```

---

### Issue 18: 响应式设计 - 平板

```markdown
## 响应式设计 - 平板 (600px - 1024px)

**优先级**: P1 (重要)  
**模块**: UI 组件  
**类型**: Compatibility Test  
**阶段**: Week 3  
**标签**: `test-compatibility`, `priority-p1`, `responsive-tablet`

### 测试步骤

1. 使用 Chrome DevTools 设置平板视口 (1024x768)
2. 测试所有页面和交互
3. 验证布局正确
4. 验证文本可读性
5. 验证按钮可点击

### 预期结果

✅ 平板端显示正确，所有功能可用

### 测试数据

- 视口: 1024x768 (iPad)

### 相关文件

- 所有 React 组件

### 检查清单

- [ ] 环境准备
- [ ] 布局测试
- [ ] 可读性测试
- [ ] 交互测试
- [ ] 记录结果
```

---

### Issue 19: 响应式设计 - 桌面

```markdown
## 响应式设计 - 桌面 (> 1024px)

**优先级**: P1 (重要)  
**模块**: UI 组件  
**类型**: Compatibility Test  
**阶段**: Week 3  
**标签**: `test-compatibility`, `priority-p1`, `responsive-desktop`

### 测试步骤

1. 在桌面浏览器中打开应用 (1920x1080)
2. 测试所有页面和交互
3. 验证布局正确
4. 验证文本可读性
5. 验证所有功能可用

### 预期结果

✅ 桌面端显示正确，所有功能可用

### 测试数据

- 视口: 1920x1080 (Full HD)

### 相关文件

- 所有 React 组件

### 检查清单

- [ ] 环境准备
- [ ] 布局测试
- [ ] 可读性测试
- [ ] 交互测试
- [ ] 记录结果
```

---

## 错误处理测试 Issues

### Issue 20: TC-6.1 频道不存在

```markdown
## TC-6.1 频道不存在错误处理

**优先级**: P1 (重要)  
**模块**: ChatManager  
**类型**: Unit Test  
**阶段**: Week 1  
**标签**: `test-error-handling`, `priority-p1`, `unit-test`

### 测试步骤

1. 调用 `sendMessage('invalid-channel-id', 'Hello', userId)`
2. 验证抛出 CHANNEL_NOT_FOUND 错误
3. 验证错误消息清晰

### 预期结果

✅ 错误被正确处理，抛出 CHANNEL_NOT_FOUND 异常

### 测试数据

- channelId: 'invalid-channel-id'

### 相关文件

- `client/src/game/social/ChatManager.ts`
- `client/src/game/social/ChatManager.test.ts`

### 检查清单

- [ ] 环境准备
- [ ] 运行测试
- [ ] 验证错误类型
- [ ] 验证错误消息
- [ ] 记录结果
```

---

### Issue 21: TC-6.2 用户不存在

```markdown
## TC-6.2 用户不存在错误处理

**优先级**: P1 (重要)  
**模块**: FriendsManager  
**类型**: Unit Test  
**阶段**: Week 1  
**标签**: `test-error-handling`, `priority-p1`, `unit-test`

### 测试步骤

1. 调用 `addFriend('valid-user-id', 'invalid-friend-id')`
2. 验证抛出 USER_NOT_FOUND 错误
3. 验证错误消息清晰

### 预期结果

✅ 错误被正确处理，抛出 USER_NOT_FOUND 异常

### 测试数据

- userId: 'valid-user-id'
- friendId: 'invalid-friend-id'

### 相关文件

- `client/src/game/social/FriendsManager.ts`
- `client/src/game/social/FriendsManager.test.ts`

### 检查清单

- [ ] 环境准备
- [ ] 运行测试
- [ ] 验证错误类型
- [ ] 验证错误消息
- [ ] 记录结果
```

---

## 回归测试 Issues

### Issue 22: 完整功能回归测试

```markdown
## 完整功能回归测试

**优先级**: P0 (关键)  
**模块**: 所有模块  
**类型**: Regression Test  
**阶段**: Week 4  
**标签**: `test-regression`, `priority-p0`, `regression-test`

### 测试步骤

1. 执行所有 TC-1.x 到 TC-7.x 测试用例
2. 验证所有功能正常
3. 验证无新的缺陷引入
4. 生成测试报告

### 预期结果

✅ 所有测试通过，无新缺陷

### 相关文件

- 所有测试文件

### 检查清单

- [ ] 环境准备
- [ ] 执行所有测试
- [ ] 验证测试通过率 ≥ 95%
- [ ] 生成测试报告
- [ ] 记录结果

### 备注

这是最终的验收测试，确保所有功能正常。
```

---

## 标签定义

| 标签 | 描述 |
|------|------|
| `test-chatmanager` | ChatManager 相关测试 |
| `test-friendsmanager` | FriendsManager 相关测试 |
| `test-teammanager` | TeamManager 相关测试 |
| `test-ui` | UI 组件测试 |
| `test-performance` | 性能测试 |
| `test-compatibility` | 兼容性测试 |
| `test-error-handling` | 错误处理测试 |
| `test-regression` | 回归测试 |
| `priority-p0` | 优先级 P0 (关键) |
| `priority-p1` | 优先级 P1 (重要) |
| `priority-p2` | 优先级 P2 (一般) |
| `unit-test` | 单元测试 |
| `ui-test` | UI 测试 |
| `performance-test` | 性能测试 |
| `browser-chrome` | Chrome 浏览器 |
| `browser-firefox` | Firefox 浏览器 |
| `responsive-mobile` | 移动端响应式 |
| `responsive-tablet` | 平板响应式 |
| `responsive-desktop` | 桌面响应式 |
| `event-driven` | 事件驱动系统 |

---

## 里程碑定义

| 里程碑 | 描述 | 预期完成日期 |
|--------|------|-------------|
| Week 1 | 单元测试 (Manager 类、事件、错误处理) | 2026-08-10 |
| Week 2 | UI 测试 (组件、交互、边界条件) | 2026-08-17 |
| Week 3 | 性能和兼容性测试 | 2026-08-24 |
| Week 4 | 回归和验收测试 | 2026-08-31 |

---

## 导入到 GitHub

### 方法 1: 使用 GitHub CLI

```bash
# 创建 Issue
gh issue create --title "TC-1.1 创建频道" \
  --body "$(cat issue_template.md)" \
  --label "test-chatmanager,priority-p0,unit-test" \
  --milestone "Week 1"

# 批量创建 (使用脚本)
python create_github_issues.py
```

### 方法 2: 手动创建

1. 访问 GitHub 项目
2. 点击 "Issues" 标签
3. 点击 "New Issue"
4. 复制相应的 Issue 内容
5. 设置标签和里程碑
6. 提交

---

**文档版本**: 1.0  
**最后更新**: 2026-08-03  
**总 Issue 数**: 22+
