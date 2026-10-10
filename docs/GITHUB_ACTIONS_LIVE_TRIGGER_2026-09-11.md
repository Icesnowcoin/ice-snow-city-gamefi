# GitHub Actions 真实性能样例触发验证

**作者：Manus AI**  
**日期：2026-09-11**

## 验证结论

通过安全输入卡配置的 `ISC_GITHUB_TOKEN` 已通过 GitHub `/user` 轻量认证测试，并具备目标仓库写入与 GitHub Actions API 访问能力。验证过程中没有输出、记录或提交 Token 值。

| 项目 | 结果 |
|---|---|
| Token 认证 | 通过 |
| 目标仓库权限 | `admin`、`maintain`、`push` 可用 |
| Actions 状态 | 已启用，`allowed_actions=all` |
| 触发方式 | 隔离分支真实 `push` |
| 成功 run | [34590240973](https://github.com/Icesnowcoin/ice-snow-city-gamefi/actions/runs/34590240973) |
| 运行结论 | `success` |
| Artifact | Markdown、CSV、PNG、validation JSON，共 4 项 |
| 输入证据等级 | `ci-software`，不等同于真实 iOS/Android 设备证据 |
| Slack | 用户明确选择不使用；未配置 `SLACK_WEBHOOK_URL`，未发送或验证通知 |

## 真实运行过程

首次 run `34589982614` 在 `actions/setup-python` 的 pip cache 阶段失败，原因是仓库没有 `requirements.txt` 或 `pyproject.toml`。本地修复增加了 `scripts/requirements-performance.txt`，并在 workflow 中将 `cache-dependency-path` 显式指向该文件。随后提交触发 run `34590240973`，下列步骤全部成功：Python 环境、依赖安装、分析器单元测试、性能报告分析、artifact 上传和 Job Summary 发布。

## Artifact 核验

成功 run 的 artifact 已实际下载并核验，包含：

| 文件 | 用途 |
|---|---|
| `performance-report.md` | 可读性能报告 |
| `performance-summary.csv` | 样本明细与统计 |
| `performance-summary.png` | 可视化图表 |
| `validation.json` | 阈值与样本验证证据 |

`validation.json` 的状态为 `pass`，输入共 3 个 JSON、6 个样本，所有来源均为 `ci-software`。阈值为 snow FPS ≥ 45、P95 帧时间 ≤ 33.34ms、掉帧比例 ≤ 5%。该结果只证明 CI 流程、解析器、阈值和 artifact 链路可用，不能解除真机性能发布门禁。

## 清理与安全边界

验证完成后，三个 `perf-data-manual/*` 临时分支均已删除。GitHub Actions run 和 artifact 作为不可变审计证据保留。用户于 2026-09-11 明确选择不使用 Slack，因此不配置 `SLACK_WEBHOOK_URL`、不执行通知请求，也不将 Slack 送达列为当前交付范围。GitHub Actions 的成功结论不依赖 Slack。
