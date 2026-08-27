#!/usr/bin/env python3
"""
批量创建 GitHub Issues 脚本

用途: 自动化创建社交系统测试的 GitHub Issues
依赖: PyGithub, python-dotenv

安装:
    pip install PyGithub python-dotenv

使用:
    python create_github_issues.py --token YOUR_GITHUB_TOKEN --owner USERNAME --repo REPO_NAME
    或
    export GITHUB_TOKEN=YOUR_TOKEN
    python create_github_issues.py --owner USERNAME --repo REPO_NAME
"""

import argparse
import json
import os
import sys
from typing import Dict, List, Optional
from dataclasses import dataclass
from pathlib import Path

try:
    from github import Github, GithubException
    from dotenv import load_dotenv
except ImportError:
    print("❌ 缺少依赖。请运行: pip install PyGithub python-dotenv")
    sys.exit(1)


@dataclass
class IssueTemplate:
    """GitHub Issue 模板"""
    title: str
    body: str
    labels: List[str]
    milestone: Optional[str] = None
    assignee: Optional[str] = None


class GitHubIssueCreator:
    """GitHub Issues 批量创建器"""

    def __init__(self, token: str, owner: str, repo: str):
        """初始化 GitHub 连接"""
        self.github = Github(token)
        self.owner = owner
        self.repo = repo
        self.repository = None
        self.milestones = {}
        self.created_issues = []
        self.failed_issues = []

    def connect(self) -> bool:
        """连接到 GitHub 仓库"""
        try:
            self.repository = self.github.get_user(self.owner).get_repo(self.repo)
            print(f"✅ 已连接到仓库: {self.owner}/{self.repo}")
            return True
        except GithubException as e:
            print(f"❌ 连接失败: {e}")
            return False

    def get_or_create_milestone(self, milestone_name: str) -> Optional[str]:
        """获取或创建里程碑"""
        if milestone_name in self.milestones:
            return self.milestones[milestone_name]

        try:
            # 查找现有里程碑
            for milestone in self.repository.get_milestones(state="open"):
                if milestone.title == milestone_name:
                    self.milestones[milestone_name] = milestone.number
                    return milestone.number

            # 创建新里程碑
            new_milestone = self.repository.create_milestone(
                title=milestone_name,
                description=f"社交系统测试 - {milestone_name}",
                state="open"
            )
            self.milestones[milestone_name] = new_milestone.number
            print(f"✅ 已创建里程碑: {milestone_name}")
            return new_milestone.number
        except GithubException as e:
            print(f"⚠️  里程碑创建失败: {e}")
            return None

    def create_issue(self, issue: IssueTemplate) -> bool:
        """创建单个 Issue"""
        try:
            milestone_number = None
            if issue.milestone:
                milestone_number = self.get_or_create_milestone(issue.milestone)

            github_issue = self.repository.create_issue(
                title=issue.title,
                body=issue.body,
                labels=issue.labels,
                milestone=milestone_number,
                assignee=issue.assignee
            )

            self.created_issues.append({
                "number": github_issue.number,
                "title": issue.title,
                "url": github_issue.html_url
            })

            print(f"✅ 已创建 Issue #{github_issue.number}: {issue.title}")
            return True
        except GithubException as e:
            self.failed_issues.append({
                "title": issue.title,
                "error": str(e)
            })
            print(f"❌ 创建失败: {issue.title} - {e}")
            return False

    def create_issues_batch(self, issues: List[IssueTemplate]) -> Dict:
        """批量创建 Issues"""
        print(f"\n📋 开始创建 {len(issues)} 个 Issues...\n")

        for i, issue in enumerate(issues, 1):
            print(f"[{i}/{len(issues)}]", end=" ")
            self.create_issue(issue)

        return self.get_summary()

    def get_summary(self) -> Dict:
        """获取创建摘要"""
        return {
            "total": len(self.created_issues) + len(self.failed_issues),
            "created": len(self.created_issues),
            "failed": len(self.failed_issues),
            "created_issues": self.created_issues,
            "failed_issues": self.failed_issues
        }

    def print_summary(self):
        """打印摘要"""
        summary = self.get_summary()
        print("\n" + "="*60)
        print("📊 创建摘要")
        print("="*60)
        print(f"总数: {summary['total']}")
        print(f"✅ 成功: {summary['created']}")
        print(f"❌ 失败: {summary['failed']}")

        if summary['created_issues']:
            print("\n✅ 已创建的 Issues:")
            for issue in summary['created_issues']:
                print(f"  #{issue['number']}: {issue['title']}")
                print(f"    {issue['url']}")

        if summary['failed_issues']:
            print("\n❌ 失败的 Issues:")
            for issue in summary['failed_issues']:
                print(f"  {issue['title']}")
                print(f"    错误: {issue['error']}")

        print("="*60)


def get_test_issues() -> List[IssueTemplate]:
    """获取所有测试 Issues"""
    return [
        # ChatManager 测试
        IssueTemplate(
            title="TC-1.1 创建频道",
            body="""**优先级**: P0 (关键)  
**模块**: ChatManager  
**类型**: Unit Test  
**阶段**: Week 1  

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
""",
            labels=["test-chatmanager", "priority-p0", "unit-test"],
            milestone="Week 1"
        ),

        IssueTemplate(
            title="TC-1.2 发送消息",
            body="""**优先级**: P0 (关键)  
**模块**: ChatManager  
**类型**: Unit Test  
**阶段**: Week 1  

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

### 检查清单

- [ ] 环境准备
- [ ] 运行单元测试
- [ ] 验证消息内容
- [ ] 验证时间戳准确性
- [ ] 记录测试结果
""",
            labels=["test-chatmanager", "priority-p0", "unit-test"],
            milestone="Week 1"
        ),

        IssueTemplate(
            title="TC-1.3 订阅频道消息",
            body="""**优先级**: P0 (关键)  
**模块**: ChatManager  
**类型**: Unit Test  
**阶段**: Week 1  

### 测试步骤

1. 创建一个频道
2. 调用 `subscribeToChannel(channelId, callback)`
3. 发送新消息到该频道
4. 验证 callback 被触发
5. 验证 callback 接收到正确的消息对象

### 预期结果

✅ 订阅成功，新消息时立即调用 callback，callback 接收到完整的 Message 对象

### 检查清单

- [ ] 环境准备
- [ ] 运行单元测试
- [ ] 验证 callback 触发
- [ ] 验证消息数据完整性
- [ ] 测试取消订阅功能
- [ ] 记录测试结果
""",
            labels=["test-chatmanager", "priority-p0", "unit-test", "event-driven"],
            milestone="Week 1"
        ),

        IssueTemplate(
            title="TC-2.1 添加好友",
            body="""**优先级**: P0 (关键)  
**模块**: FriendsManager  
**类型**: Unit Test  
**阶段**: Week 1  

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

### 检查清单

- [ ] 环境准备
- [ ] 运行单元测试
- [ ] 验证好友对象
- [ ] 验证好友列表更新
- [ ] 测试重复添加 (应报错)
- [ ] 记录测试结果
""",
            labels=["test-friendsmanager", "priority-p0", "unit-test"],
            milestone="Week 1"
        ),

        IssueTemplate(
            title="TC-3.1 创建队伍",
            body="""**优先级**: P0 (关键)  
**模块**: TeamManager  
**类型**: Unit Test  
**阶段**: Week 1  

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

### 检查清单

- [ ] 环境准备
- [ ] 运行单元测试
- [ ] 验证队伍对象
- [ ] 验证队长自动加入
- [ ] 验证成员数量 (应为 1)
- [ ] 记录测试结果
""",
            labels=["test-teammanager", "priority-p0", "unit-test"],
            milestone="Week 1"
        ),

        IssueTemplate(
            title="TC-4.1 ChatPanel 渲染",
            body="""**优先级**: P0 (关键)  
**模块**: ChatPanel (React Component)  
**类型**: UI Test  
**阶段**: Week 2  

### 测试步骤

1. 使用 React Testing Library 渲染 ChatPanel 组件
2. 验证所有频道标签显示
3. 验证消息列表显示
4. 验证消息输入框显示

### 预期结果

✅ 组件正确渲染，所有元素可见

### 检查清单

- [ ] 环境准备 (React Testing Library 安装)
- [ ] 运行 UI 测试
- [ ] 验证所有元素渲染
- [ ] 验证样式应用
- [ ] 检查可访问性 (a11y)
- [ ] 记录测试结果
""",
            labels=["test-ui", "priority-p0", "ui-test", "chatpanel"],
            milestone="Week 2"
        ),

        IssueTemplate(
            title="TC-4.2 频道切换",
            body="""**优先级**: P0 (关键)  
**模块**: ChatPanel (React Component)  
**类型**: UI Test  
**阶段**: Week 2  

### 测试步骤

1. 渲染 ChatPanel
2. 点击不同的频道标签
3. 验证消息列表更新
4. 验证当前频道标签高亮

### 预期结果

✅ 频道切换成功，消息列表和 UI 状态更新

### 检查清单

- [ ] 环境准备
- [ ] 运行 UI 测试
- [ ] 验证点击事件
- [ ] 验证消息列表更新
- [ ] 验证样式变化 (高亮)
- [ ] 记录测试结果
""",
            labels=["test-ui", "priority-p0", "ui-test", "chatpanel"],
            milestone="Week 2"
        ),

        IssueTemplate(
            title="PT-1 消息发送延迟",
            body="""**优先级**: P1 (重要)  
**模块**: ChatManager, ChatPanel  
**类型**: Performance Test  
**阶段**: Week 3  

### 测试步骤

1. 打开 Chrome DevTools Performance
2. 发送 100 条消息
3. 测量每条消息从发送到显示的延迟
4. 计算平均值和 P95 百分位数

### 预期结果

✅ 平均延迟 < 100ms，P95 < 200ms

### 检查清单

- [ ] 环境准备 (Chrome DevTools)
- [ ] 运行性能测试
- [ ] 记录延迟数据
- [ ] 生成性能报告
- [ ] 分析瓶颈
- [ ] 优化建议
""",
            labels=["test-performance", "priority-p1", "performance-test"],
            milestone="Week 3"
        ),

        IssueTemplate(
            title="浏览器兼容性 - Chrome 120+",
            body="""**优先级**: P1 (重要)  
**模块**: 所有模块  
**类型**: Compatibility Test  
**阶段**: Week 3  

### 测试步骤

1. 在 Chrome 120+ 中打开应用
2. 执行所有核心功能测试
3. 验证 UI 显示正确
4. 验证交互正常

### 预期结果

✅ 所有功能正常，UI 显示正确

### 检查清单

- [ ] 环境准备
- [ ] 功能测试
- [ ] UI 验证
- [ ] 交互测试
- [ ] 记录结果
""",
            labels=["test-compatibility", "priority-p1", "browser-chrome"],
            milestone="Week 3"
        ),

        IssueTemplate(
            title="响应式设计 - 移动端 (< 600px)",
            body="""**优先级**: P1 (重要)  
**模块**: UI 组件  
**类型**: Compatibility Test  
**阶段**: Week 3  

### 测试步骤

1. 使用 Chrome DevTools 设置移动视口 (375x667)
2. 测试所有页面和交互
3. 验证布局正确
4. 验证文本可读性
5. 验证按钮可点击

### 预期结果

✅ 移动端显示正确，所有功能可用

### 检查清单

- [ ] 环境准备 (Chrome DevTools)
- [ ] 布局测试
- [ ] 可读性测试
- [ ] 交互测试
- [ ] 记录结果
""",
            labels=["test-compatibility", "priority-p1", "responsive-mobile"],
            milestone="Week 3"
        ),

        IssueTemplate(
            title="完整功能回归测试",
            body="""**优先级**: P0 (关键)  
**模块**: 所有模块  
**类型**: Regression Test  
**阶段**: Week 4  

### 测试步骤

1. 执行所有 TC-1.x 到 TC-7.x 测试用例
2. 验证所有功能正常
3. 验证无新的缺陷引入
4. 生成测试报告

### 预期结果

✅ 所有测试通过，无新缺陷

### 检查清单

- [ ] 环境准备
- [ ] 执行所有测试
- [ ] 验证测试通过率 ≥ 95%
- [ ] 生成测试报告
- [ ] 记录结果
""",
            labels=["test-regression", "priority-p0", "regression-test"],
            milestone="Week 4"
        ),
    ]


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="批量创建 GitHub Issues 脚本",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python create_github_issues.py --token YOUR_TOKEN --owner USERNAME --repo REPO
  export GITHUB_TOKEN=YOUR_TOKEN
  python create_github_issues.py --owner USERNAME --repo REPO
        """
    )

    parser.add_argument(
        "--token",
        help="GitHub Personal Access Token (或设置 GITHUB_TOKEN 环境变量)"
    )
    parser.add_argument(
        "--owner",
        required=True,
        help="GitHub 用户名或组织名"
    )
    parser.add_argument(
        "--repo",
        required=True,
        help="GitHub 仓库名"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="模拟运行，不实际创建 Issues"
    )
    parser.add_argument(
        "--output",
        help="保存创建结果到 JSON 文件"
    )

    args = parser.parse_args()

    # 加载环境变量
    load_dotenv()

    # 获取 Token
    token = args.token or os.getenv("GITHUB_TOKEN")
    if not token:
        print("❌ 错误: 未提供 GitHub Token")
        print("   请使用 --token 参数或设置 GITHUB_TOKEN 环境变量")
        sys.exit(1)

    # 创建 Issues
    if args.dry_run:
        print("🔍 模拟运行模式 (不会实际创建 Issues)\n")
        issues = get_test_issues()
        print(f"将创建 {len(issues)} 个 Issues:\n")
        for issue in issues:
            print(f"  • {issue.title}")
            print(f"    标签: {', '.join(issue.labels)}")
            print(f"    里程碑: {issue.milestone}\n")
        return

    # 实际创建
    creator = GitHubIssueCreator(token, args.owner, args.repo)

    if not creator.connect():
        sys.exit(1)

    issues = get_test_issues()
    summary = creator.create_issues_batch(issues)

    creator.print_summary()

    # 保存结果
    if args.output:
        with open(args.output, "w") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        print(f"\n💾 结果已保存到: {args.output}")


if __name__ == "__main__":
    main()
