# GitHub Actions 性能报告工作流

仓库新增 `.github/workflows/real-device-performance.yml`。该工作流在每次 `push`、每个 `pull_request`、每周定时任务以及手动 `workflow_dispatch` 时运行。它使用 Python 3.11，安装 `matplotlib`，先运行 `scripts/test_analyze_real_device_performance.py`，再执行性能 JSON 分析器。

## 输入约定

工作流扫描 `performance-data/` 和 `testing/fixtures/performance/` 下的 JSON 文件。仓库内的 `testing/fixtures/performance/ci-sample.json` 是脱敏的 `ci-software` 样例，只用于验证解析流程和阈值逻辑；它不能提升真实设备门禁，也不能被报告解释为 iOS 或 Android 实机数据。

当真实设备采样完成后，应把经过脱敏和审阅的报告放入受控的 `performance-data/` 路径，使用 `source: "ios-real"` 或 `source: "android-real"`，并提供真实设备要求的 `device` 与 `validation` 字段。缺少型号、浏览器、渲染器、validated 状态或 `realDeviceEvidenceRequired: false` 时，分析器会 fail-closed。不要把真实设备的隐私截图、序列号、账户信息或调试凭据提交到仓库。

## 阈值与失败行为

默认门禁与项目真机指南保持一致：snow 平均 FPS 至少 45，P95 帧时间不超过 33.34ms，掉帧比例不超过 5%。`--fail-on-blocked` 会在输入 schema、真实设备证据或阈值失败时返回非零状态，使 GitHub Actions job 失败。缺失真实设备输入本身不会被样例伪装成真实证据；真实设备仍保持 `pending-device`，直到真实报告完成审阅。

## 报告产物

每次运行都会上传名为 `performance-report-<commit-sha>` 的 artifact，保留 14 天，内容包括 `performance-summary.csv`、`performance-report.md`、`performance-summary.png` 和 `validation.json`。Markdown 摘要同时写入 GitHub Actions 的 Step Summary，便于在提交或 PR 页面查看。

本地等价命令如下：

```bash
PYTHONPATH=scripts python3 -m unittest scripts/test_analyze_real_device_performance.py -v
python3 scripts/analyze_real_device_performance.py \
  --input performance-data \
  --input testing/fixtures/performance \
  --output ci-performance-report \
  --fail-on-blocked
```

如果 `performance-data/` 不存在，样例目录仍可使 CI 验证脚本和输出流程运行；一旦提交了真实设备报告，分析器会同时处理样例和真实报告，并在结果中分别标记来源。建议在 PR 中审查 `validation.json` 的 `source`、`status` 和 `issues`，不要只看 PNG。

## 真机数据上传与触发

新增 `scripts/upload_real_device_performance.py` 用于上传经过审阅的 iOS/Android JSON，并触发 `real-device-performance.yml`。脚本默认不执行远端写操作，必须明确选择 `--dry-run` 或 `--upload`。上传模式只读取显式指定的 `ISC_GITHUB_TOKEN`（可用 `--token-env` 改名），不会自动使用环境中可能存在的 `GH_TOKEN` 或其他隐式令牌，从而避免本地测试误触发 GitHub API。

建议先执行以下 dry-run：

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

确认报告来源为 `ios-real` 或 `android-real`、没有敏感字段且阈值通过后，再显式设置专用令牌并上传：

```bash
export ISC_GITHUB_TOKEN='在受控终端中临时设置，不要写入文件或 shell 历史'
python3 scripts/upload_real_device_performance.py \
  --input ./ios-captures \
  --input ./android-captures \
  --repo Icesnowcoin/ice-snow-city-gamefi \
  --upload
unset ISC_GITHUB_TOKEN
```

令牌至少需要目标仓库的 **Contents: write** 和 **Actions: write** 权限；如果组织策略不允许 workflow dispatch，应改为创建 PR 后由现有 `pull_request` 触发。脚本会从 `main` 创建隔离的 `perf-data/<base>-<random>` 分支，将文件名规范化后写入 `performance-data/`，再以该分支触发 workflow。它拒绝 `ci-software`，除非显式使用 `--allow-software`；该选项只适用于流程演练，不能用于真实设备发布门禁。

脚本会拒绝序列号、UDID、邮箱、cookie、session、token、私钥、Bearer 值等敏感字段或值，也会拒绝缺少真实设备证据、FPS/P95/掉帧超阈值的报告。上传前建议先使用 dry-run，并对生成的 JSON 进行人工脱敏审阅。

## Slack 通知

上传脚本支持可选 Slack 通知。通知默认关闭；启用时使用 `--notify-slack`，并通过显式环境变量 `SLACK_WEBHOOK_URL` 提供 Incoming Webhook。Webhook 不会写入 JSON、Git 历史、命令输出或 Slack 消息。若未配置 Webhook，脚本会在执行前 fail-closed，而不会静默地假装已发送通知。

```bash
export SLACK_WEBHOOK_URL='在受控终端中临时设置，不要提交或写入脚本'
python3 scripts/upload_real_device_performance.py \
  --input ./ios-captures \
  --repo Icesnowcoin/ice-snow-city-gamefi \
  --upload \
  --notify-slack
unset SLACK_WEBHOOK_URL
```

成功触发后会发送 `TRIGGER ACCEPTED`，校验失败、GitHub API 失败或令牌缺失会发送 `FAILED`。通知正文只包含仓库名、workflow、隔离分支和经过截断/脱敏的错误摘要，不包含原始设备 JSON、设备序列号、UDID、令牌或 Webhook URL。Slack 网络故障不会覆盖主要上传结果；脚本会把通知异常记录为 warning，并保留上传主流程的返回状态。当前测试使用 mock webhook，不会向真实 Slack 发消息。
