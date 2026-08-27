# GitHub Issues 批量创建脚本

## 概述

`create_github_issues.py` 是一个 Python 脚本，用于自动化批量创建社交系统测试的 GitHub Issues。

## 功能

✅ 批量创建 GitHub Issues  
✅ 自动创建里程碑 (Milestones)  
✅ 添加标签 (Labels)  
✅ 支持模拟运行 (Dry Run)  
✅ 生成创建结果报告  
✅ 保存结果到 JSON 文件  

## 安装

### 1. 安装依赖

```bash
pip install PyGithub python-dotenv
```

### 2. 获取 GitHub Token

1. 访问 [GitHub Settings - Personal Access Tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 选择以下权限:
   - `repo` (完整的仓库访问)
   - `workflow` (工作流访问)
4. 复制生成的 Token

## 使用方法

### 方法 1: 使用命令行参数

```bash
python create_github_issues.py \
  --token YOUR_GITHUB_TOKEN \
  --owner USERNAME \
  --repo REPO_NAME
```

### 方法 2: 使用环境变量

```bash
export GITHUB_TOKEN=YOUR_GITHUB_TOKEN
python create_github_issues.py --owner USERNAME --repo REPO_NAME
```

### 方法 3: 使用 .env 文件

创建 `.env` 文件:
```
GITHUB_TOKEN=YOUR_GITHUB_TOKEN
```

然后运行:
```bash
python create_github_issues.py --owner USERNAME --repo REPO_NAME
```

## 选项

| 选项 | 说明 | 必需 |
|------|------|------|
| `--token TOKEN` | GitHub Personal Access Token | ❌ (可用环境变量) |
| `--owner OWNER` | GitHub 用户名或组织名 | ✅ |
| `--repo REPO` | GitHub 仓库名 | ✅ |
| `--dry-run` | 模拟运行，不实际创建 | ❌ |
| `--output FILE` | 保存结果到 JSON 文件 | ❌ |

## 示例

### 示例 1: 模拟运行

```bash
python create_github_issues.py \
  --owner myusername \
  --repo ice-snow-city \
  --dry-run
```

输出:
```
🔍 模拟运行模式 (不会实际创建 Issues)

将创建 10 个 Issues:

  • TC-1.1 创建频道
    标签: test-chatmanager, priority-p0, unit-test
    里程碑: Week 1

  • TC-1.2 发送消息
    标签: test-chatmanager, priority-p0, unit-test
    里程碑: Week 1

  ...
```

### 示例 2: 实际创建并保存结果

```bash
export GITHUB_TOKEN=[REDACTED_GITHUB_TOKEN]
python create_github_issues.py \
  --owner myusername \
  --repo ice-snow-city \
  --output results.json
```

输出:
```
✅ 已连接到仓库: myusername/ice-snow-city
[1/10] ✅ 已创建 Issue #1: TC-1.1 创建频道
[2/10] ✅ 已创建 Issue #2: TC-1.2 发送消息
...

============================================================
📊 创建摘要
============================================================
总数: 10
✅ 成功: 10
❌ 失败: 0

✅ 已创建的 Issues:
  #1: TC-1.1 创建频道
    https://github.com/myusername/ice-snow-city/issues/1
  #2: TC-1.2 发送消息
    https://github.com/myusername/ice-snow-city/issues/2
  ...

💾 结果已保存到: results.json
```

## 脚本结构

### GitHubIssueCreator 类

主要方法:

- `connect()`: 连接到 GitHub 仓库
- `get_or_create_milestone(milestone_name)`: 获取或创建里程碑
- `create_issue(issue)`: 创建单个 Issue
- `create_issues_batch(issues)`: 批量创建 Issues
- `get_summary()`: 获取创建摘要
- `print_summary()`: 打印摘要

### IssueTemplate 数据类

Issue 模板字段:

- `title`: Issue 标题
- `body`: Issue 描述 (Markdown 格式)
- `labels`: 标签列表
- `milestone`: 里程碑 (可选)
- `assignee`: 分配给 (可选)

## 创建的 Issues

脚本默认创建以下 Issues:

| ID | 标题 | 优先级 | 阶段 |
|----|------|--------|------|
| TC-1.1 | 创建频道 | P0 | Week 1 |
| TC-1.2 | 发送消息 | P0 | Week 1 |
| TC-1.3 | 订阅频道消息 | P0 | Week 1 |
| TC-2.1 | 添加好友 | P0 | Week 1 |
| TC-3.1 | 创建队伍 | P0 | Week 1 |
| TC-4.1 | ChatPanel 渲染 | P0 | Week 2 |
| TC-4.2 | 频道切换 | P0 | Week 2 |
| PT-1 | 消息发送延迟 | P1 | Week 3 |
| 浏览器兼容性 - Chrome | Chrome 120+ | P1 | Week 3 |
| 响应式设计 - 移动端 | 移动端 (< 600px) | P1 | Week 3 |
| 完整功能回归测试 | 回归测试 | P0 | Week 4 |

## 自定义 Issues

要修改或添加 Issues，编辑 `get_test_issues()` 函数:

```python
def get_test_issues() -> List[IssueTemplate]:
    """获取所有测试 Issues"""
    return [
        IssueTemplate(
            title="你的 Issue 标题",
            body="Issue 描述 (Markdown 格式)",
            labels=["标签1", "标签2"],
            milestone="Week 1"
        ),
        # 添加更多 Issues...
    ]
```

## 故障排除

### 错误: 缺少依赖

```
❌ 缺少依赖。请运行: pip install PyGithub python-dotenv
```

**解决方案**: 运行 `pip install PyGithub python-dotenv`

### 错误: 未提供 GitHub Token

```
❌ 错误: 未提供 GitHub Token
   请使用 --token 参数或设置 GITHUB_TOKEN 环境变量
```

**解决方案**: 
- 使用 `--token` 参数，或
- 设置 `GITHUB_TOKEN` 环境变量，或
- 创建 `.env` 文件

### 错误: 连接失败

```
❌ 连接失败: 404 Not Found
```

**解决方案**: 
- 检查用户名和仓库名是否正确
- 检查 Token 是否有效
- 检查 Token 是否有 `repo` 权限

### 错误: 权限不足

```
❌ 创建失败: 403 Forbidden
```

**解决方案**: 
- 确保 Token 有 `repo` 和 `workflow` 权限
- 确保你对仓库有写入权限

## 输出示例

### results.json

```json
{
  "total": 10,
  "created": 10,
  "failed": 0,
  "created_issues": [
    {
      "number": 1,
      "title": "TC-1.1 创建频道",
      "url": "https://github.com/username/repo/issues/1"
    },
    {
      "number": 2,
      "title": "TC-1.2 发送消息",
      "url": "https://github.com/username/repo/issues/2"
    }
  ],
  "failed_issues": []
}
```

## 最佳实践

1. **先进行模拟运行**: 使用 `--dry-run` 选项先检查将创建的 Issues
2. **保存结果**: 使用 `--output` 选项保存创建结果
3. **检查权限**: 确保 Token 有必要的权限
4. **备份 Token**: 不要在代码中硬编码 Token，使用环境变量
5. **定期更新**: 根据需要更新 Issues 内容

## 常见问题

### Q: 如何修改已创建的 Issues？

A: 脚本只负责创建 Issues。修改 Issues 需要在 GitHub 网页界面手动操作，或使用 GitHub API。

### Q: 如何删除已创建的 Issues？

A: 在 GitHub 网页界面关闭 Issues，或使用 GitHub API 删除。

### Q: 如何为 Issues 添加更多标签？

A: 编辑 `get_test_issues()` 函数中的 `labels` 列表。

### Q: 如何为 Issues 分配给特定用户？

A: 在 `IssueTemplate` 中设置 `assignee` 字段。

## 许可证

MIT License

## 联系方式

如有问题，请提交 GitHub Issue 或联系项目维护者。
