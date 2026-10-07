# 真机性能数据上传与 Slack 通知脚本

本 README 说明 `scripts/upload_real_device_performance.py` 的配置与使用方式。该脚本用于将经过人工审阅的 iOS/Android 真机性能 JSON 上传到受控 GitHub 分支，并触发 `real-device-performance.yml` 工作流。脚本还支持可选的 Slack Incoming Webhook 通知，用于报告校验失败、GitHub Actions 触发成功或执行异常。

> **重要边界：** 上传脚本不会生成真实设备证据，也不会把 `ci-software` 样例伪装成 `ios-real` 或 `android-real`。只有真实设备采集并通过字段、阈值和敏感信息校验的报告，才可以进入正式上传流程。

## 1. 工作流程概览

脚本执行时先读取一个或多个 JSON 文件，验证项目现有性能 schema、`source` 标签、FPS/P95/掉帧率阈值和敏感字段。校验通过后，脚本从指定 base branch 创建一个随机隔离分支，将 JSON 文件写入 `performance-data/`，然后调用 GitHub Actions `workflow_dispatch` 触发 `real-device-performance.yml`。上传成功后，脚本可选地向 Slack 发送一条只含安全摘要的通知。

```text
iOS/Android 真机采集
        │
        ▼
JSON 人工审阅与脱敏
        │
        ▼
本地 --dry-run 校验
        │
        ├── 失败：阻断，不创建 GitHub 分支
        │
        ▼
--upload 创建隔离分支并写入 JSON
        │
        ▼
workflow_dispatch 触发 GitHub Actions
        │
        ▼
可选 Slack：TRIGGER ACCEPTED / FAILED
```

## 2. 文件位置

| 路径 | 用途 |
| --- | --- |
| `scripts/upload_real_device_performance.py` | 上传、校验、分支创建和 workflow dispatch 主脚本 |
| `scripts/analyze_real_device_performance.py` | 复用的 schema、阈值与统计逻辑 |
| `scripts/test_upload_real_device_performance.py` | 上传、Slack、脱敏和 API 编排测试 |
| `.github/workflows/real-device-performance.yml` | GitHub Actions 性能分析 workflow |
| `testing/fixtures/performance/ci-sample.json` | 脱敏 `ci-software` 流程样例，不是真机证据 |
| `docs/CI_PERFORMANCE_REPORT_WORKFLOW_2026-09-06.md` | CI 报告和上传流程补充说明 |
| `performance-data/` | 本地原始性能数据目录，已加入 `.gitignore`，不会自动提交 |

## 3. 环境要求

脚本使用 Python 标准库和项目已有的性能分析模块，不需要额外安装 Python 包。建议使用 Python 3.11 或更新版本，并从仓库根目录执行命令：

```bash
cd /home/ubuntu/ice_snow_city_agent
python3 --version
```

脚本不会自动读取普通的 `GITHUB_TOKEN` 或 `GH_TOKEN`。真实上传必须显式设置 `ISC_GITHUB_TOKEN`，这是为了避免开发机或自动化环境中意外注入的令牌触发远端写操作。Slack 通知同样默认关闭，只有显式传入 `--notify-slack` 且设置 `SLACK_WEBHOOK_URL` 才会发送请求。

## 4. 输入 JSON 要求

输入可以是单个 JSON 文件，也可以是包含多个 JSON 文件的目录；`--input` 可以重复使用。每份报告应至少包含项目性能报告使用的 `schemaVersion`、`source`、设备信息和 `samples` 字段。正式真机上传的 `source` 必须为 `ios-real` 或 `android-real`。

每个 sample 的关键字段包括 `mode`、`quality`、`engineFps`、`averageFrameMs`、`p95FrameMs`、`droppedFrameRatio`、`frames` 和 `durationMs`。脚本会复用现有分析器的阈值，目前主要门槛为 snow FPS 不低于 45、P95 帧时间不高于 33.34ms、掉帧比例不高于 5%。如果报告缺少真实设备证据、字段格式错误或 sample 超过阈值，上传会 fail-closed。

建议在上传前删除或不要采集以下字段：设备序列号、UDID、邮箱、Cookie、Session、Authorization、Token、私钥、Bearer 值和任何个人信息。脚本还会递归扫描键名和字符串值；检测到敏感字段时，即使性能指标通过，也会拒绝上传。

## 5. GitHub 权限配置

实际上传需要一个只用于该任务的 GitHub fine-grained token。令牌应限制在目标仓库，并至少具备以下权限：

| 权限 | 用途 |
| --- | --- |
| `Contents: Read and write` | 读取 base branch、创建隔离分支、写入性能 JSON |
| `Actions: Read and write` | 触发 `workflow_dispatch` |

将令牌只临时放入当前终端环境，不要写入 `.env`、README、shell 脚本、性能 JSON、Git commit 或 Slack 消息：

```bash
export ISC_GITHUB_TOKEN='在受控终端中临时设置'
```

执行结束后立即清除：

```bash
unset ISC_GITHUB_TOKEN
```

如果组织策略不允许 Actions 写权限，可以不使用脚本的 dispatch 能力，而是让脚本只生成受控分支，再通过 Pull Request 的 `pull_request` 触发 workflow。当前脚本的默认设计是直接触发 workflow，因此需要 `Actions: Read and write`。

## 6. Slack Webhook 配置

Slack 通知是可选功能。请在 Slack 中创建只用于性能流水线的 Incoming Webhook，并将完整 HTTPS Webhook URL 作为秘密配置到受控环境中。当前项目没有提供真实 Webhook，因此默认测试只使用 mock，不会向 Slack 发送消息。

本地使用时：

```bash
export SLACK_WEBHOOK_URL='在受控终端中临时设置，不要写入文件或 shell 历史'
```

如需使用不同的环境变量名，可以通过 `--slack-webhook-env` 指定：

```bash
export ISC_PERF_SLACK_WEBHOOK='https://hooks.slack.com/services/...'
```

脚本调用时添加：

```bash
--notify-slack --slack-webhook-env ISC_PERF_SLACK_WEBHOOK
```

Slack 消息只包含状态、仓库名、workflow 名称、隔离分支名、文件数量或经过截断/脱敏的错误摘要，不包含原始 JSON、设备标识、GitHub 令牌或 Webhook URL。Slack 网络故障会产生 warning，但不会把已完成的 GitHub 上传错误地改写为失败。

## 7. 推荐的 dry-run 流程

任何真实上传前都应先运行 dry-run。dry-run 只读取本地文件，不创建 GitHub 分支、不写 GitHub Contents、不触发 Actions。对于正式门禁，不要加 `--allow-software`：

```bash
python3 scripts/upload_real_device_performance.py \
  --input ./ios-captures \
  --input ./android-captures \
  --repo Icesnowcoin/ice-snow-city-gamefi \
  --base-branch main \
  --remote-dir performance-data \
  --workflow real-device-performance.yml \
  --dry-run
```

如果命令返回成功，输出会包含 `status: dry-run-valid`、文件数量、sample 数量和来源集合。出现任何 schema、来源、敏感字段或阈值问题时，命令返回非零退出码并输出阻断原因。

流程演练可以对仓库中的脱敏样例运行，但必须显式承认它不是正式真机证据：

```bash
python3 scripts/upload_real_device_performance.py \
  --input testing/fixtures/performance \
  --repo Icesnowcoin/ice-snow-city-gamefi \
  --dry-run \
  --allow-software
```

## 8. 正式上传并触发 GitHub Actions

确认 dry-run 通过、人工审阅 JSON 且 `source` 为 `ios-real` 或 `android-real` 后，再执行上传：

```bash
export ISC_GITHUB_TOKEN='在受控终端中临时设置'
export SLACK_WEBHOOK_URL='在受控终端中临时设置'

python3 scripts/upload_real_device_performance.py \
  --input ./ios-captures \
  --input ./android-captures \
  --repo Icesnowcoin/ice-snow-city-gamefi \
  --base-branch main \
  --remote-dir performance-data \
  --workflow real-device-performance.yml \
  --upload \
  --notify-slack

unset ISC_GITHUB_TOKEN
unset SLACK_WEBHOOK_URL
```

脚本会创建形如 `perf-data/main-<random>` 的隔离分支。输出 JSON 会返回 `branch`、`baseSha`、上传文件列表和 workflow 名称。不要手动复用旧的性能分支；每次采样建议使用新的隔离分支，便于追踪设备、构建版本和采样批次。

## 9. Slack 通知语义

| 场景 | 状态 | 是否创建远端分支 | Slack 行为 |
| --- | --- | --- | --- |
| dry-run 校验通过 | `DRY-RUN VALIDATED` | 否 | 仅在显式启用通知时发送 |
| 真实上传与 dispatch 请求完成 | `TRIGGER ACCEPTED` | 是 | 发送分支名和文件数量 |
| schema、来源、敏感字段或阈值失败 | `FAILED` | 否 | 发送截断后的阻断摘要 |
| GitHub API 失败 | `FAILED` | 可能已创建分支 | 发送脱敏错误摘要 |
| 缺少 GitHub 令牌 | `FAILED` | 否 | 发送失败摘要；未配置 Slack 时仅打印错误 |
| 缺少 Slack Webhook 且指定 `--notify-slack` | 本地 fail-closed | 不进入上传 | 不发送，因为没有合法 Webhook |
| Slack 自身网络错误 | 主流程保持原状态 | 不改变 | 打印 warning，不覆盖上传结果 |

## 10. 常见错误排查

### `--upload requires explicit ISC_GITHUB_TOKEN`

脚本没有发现明确的 GitHub 令牌。请确认使用了 `export ISC_GITHUB_TOKEN=...`，且没有把令牌写在命令行参数或提交中。若只想检查数据，请改用 `--dry-run`。

### `only ios-real/android-real reports may be uploaded by default`

输入报告的 `source` 不是正式真机来源。`ci-software` 和 `ci-gpu` 只能用于流程演练，并且必须显式加 `--allow-software`；它们不能用于真实设备发布门禁。

### `performance threshold blocked`

至少一个 sample 的 FPS、P95 帧时间或掉帧率没有达到阈值。请先检查设备是否过热、是否开启录屏、浏览器 DevTools 是否保持连接，以及 baseline/snow 两组是否在相同场景和质量档位下采集。不要通过修改 JSON 手工抬高指标。

### `sensitive field/value detected`

脚本检测到设备标识、认证信息或私密凭据。删除该字段后重新从安全的导出源生成报告；不要只改字段名来绕过扫描。

### `--notify-slack requires explicit SLACK_WEBHOOK_URL`

使用了 `--notify-slack`，但没有配置 Webhook。可以配置专用环境变量，或移除 `--notify-slack`。脚本不会自动使用其他环境中的 Slack 或 GitHub 令牌。

### GitHub API 返回 403

检查 token 是否具备目标仓库的 `Contents: Read and write` 与 `Actions: Read and write` 权限，目标仓库是否允许 workflow dispatch，以及当前用户是否有权创建分支。不要把更高权限的个人全局 token 直接用于生产采样。

### Slack 没有收到消息

首先确认脚本确实带有 `--notify-slack`，并检查 `SLACK_WEBHOOK_URL` 是否在同一终端会话中存在。然后用 dry-run 检查主流程；脚本只会发送安全摘要。若 Slack 返回网络或 HTTP 错误，主流程会在 stderr 输出 warning，不会重试或泄露 Webhook 内容。

## 11. 本地测试与验证

在不访问真实 GitHub 或 Slack 的情况下运行全部相关测试：

```bash
cd /home/ubuntu/ice_snow_city_agent
PYTHONPATH=scripts python3 -m unittest \
  scripts/test_analyze_real_device_performance.py \
  scripts/test_upload_real_device_performance.py -v

pnpm exec vitest run client/src/lib/slackNotificationConfig.test.ts
python3 -m py_compile \
  scripts/upload_real_device_performance.py \
  scripts/test_upload_real_device_performance.py
git diff --check
```

当前测试使用 mock API 和 mock webhook，不会发送真实通知。对真实数据执行时，建议先做 dry-run，再由一名不同于采集者的成员完成人工脱敏复核。

## 12. 退出码与审计建议

退出码 `0` 表示 dry-run 校验成功或真实上传与 dispatch 请求完成。退出码 `2` 表示参数冲突、输入为空、schema/来源/敏感字段/阈值阻断、缺少令牌或 GitHub API 错误。每次正式上传应保留脚本标准输出、workflow run URL、设备型号、系统版本、浏览器版本、构建 SHA、采样时间段和最终 artifact，但不要保留令牌、Webhook URL、UDID 或原始个人信息。

上传脚本只负责安全地提交报告和触发 workflow；真实设备性能门禁仍由 GitHub Actions 报告、人工复核和项目外部发布责任矩阵共同决定。成功触发不等于资产、真机 FPS 或主网发布门禁已经通过。

## References

[1]: https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event "GitHub REST API: Create a workflow dispatch event"

[2]: https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents "GitHub REST API: Create or update file contents"

[3]: https://api.slack.com/messaging/webhooks "Slack: Incoming Webhooks"

## 13. 可直接运行的示例 JSON

仓库提供 `testing/fixtures/performance/readme-dry-run-sample.json` 作为本地演练输入。它是脱敏的 `ci-software` 样例，指标用于验证 schema、阈值和报告流程，不能作为 iOS/Android 真机发布证据。运行：

```bash
python3 scripts/upload_real_device_performance.py \
  --input testing/fixtures/performance/readme-dry-run-sample.json \
  --repo Icesnowcoin/ice-snow-city-gamefi \
  --dry-run \
  --allow-software
```

如需同时生成可视化分析报告：

```bash
python3 scripts/analyze_real_device_performance.py \
  --input testing/fixtures/performance/readme-dry-run-sample.json \
  --output /tmp/isc-readme-performance-report
```
