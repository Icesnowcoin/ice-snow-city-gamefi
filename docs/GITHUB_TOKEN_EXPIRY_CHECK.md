# GitHub Token 到期与权限检查

`scripts/check_github_token_expiry.py` 用于定期检查 GitHub Fine-grained personal access token 的登记到期日期，并通过 GitHub 的只读 API 验证当前 Token 是否仍能访问账户、目标仓库和 Actions 工作流列表。

> GitHub 不应被假定会通过普通 API 返回任意个人 Token 的到期日期。因此，创建 Token 时应将到期日安全登记到 `ISC_GITHUB_TOKEN_EXPIRES_AT`，脚本负责计算剩余天数。

## 安全约定

脚本只从环境变量读取 Token，不接受 `--token` 参数，不打印 Authorization 请求头，也不会执行创建分支、写文件、触发工作流或其他写操作。不要把 Token 写入 `.env`、代码、README、shell 历史或日志。

## 本地运行

项目已注册以下快捷命令：

```bash
pnpm test:github-token       # 运行 mock 单元测试，不访问 GitHub
pnpm check:github-token      # 使用 ISC_GITHUB_TOKEN 执行真实只读检查
```

```bash
cd /home/ubuntu/ice_snow_city_agent
export ISC_GITHUB_TOKEN='在受控终端临时设置，不要提交或发送'
export ISC_GITHUB_TOKEN_EXPIRES_AT='2026-12-17'
python3 scripts/check_github_token_expiry.py \
  --repo Icesnowcoin/ice-snow-city-gamefi \
  --warn-days 30
status=$?
unset ISC_GITHUB_TOKEN ISC_GITHUB_TOKEN_EXPIRES_AT
exit "$status"
```

到期日期也支持 ISO-8601 时间戳。若只需要临时测试，可使用 `--expires-at 2026-12-17`，但不要把包含敏感内容的命令保存到 shell 历史。

机器可读输出：

```bash
python3 scripts/check_github_token_expiry.py \
  --repo Icesnowcoin/ice-snow-city-gamefi \
  --json
```

## 退出码

| 退出码 | 含义                                                  |
| -----: | ----------------------------------------------------- |
|    `0` | Token 未过期，且账户、仓库、Actions 只读 API 均可访问 |
|    `2` | 配置或参数错误，例如缺少 Token、到期日或仓库名        |
|   `10` | 登记的 Token 已过期                                   |
|   `11` | GitHub API 认证或网络错误                             |
|   `12` | 账户、仓库或 Actions 工作流 API 无法验证              |

脚本在 `--warn-days` 范围内会输出 `expiring-soon` 和 warning，但仍返回 `0`，适合“到期前提醒、到期时阻断”的定时任务策略。若希望“进入提醒窗口即让 CI 失败”，可在外层脚本中把 JSON 的 `expiryStatus=expiring-soon` 转换为非零退出码。

## 定期执行示例

Linux/macOS 可以使用 cron，例如每天 09:00 执行。不要把 Token 直接写进 crontab；使用受保护的环境注入机制或 CI Secret：

```cron
0 9 * * * /opt/isc/check-token.sh >> /var/log/isc-token-check.log 2>&1
```

`check-token.sh` 示例：

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /home/ubuntu/ice_snow_city_agent
python3 scripts/check_github_token_expiry.py \
  --repo Icesnowcoin/ice-snow-city-gamefi \
  --warn-days 30 \
  --json
```

推荐让运行环境注入 `ISC_GITHUB_TOKEN` 和 `ISC_GITHUB_TOKEN_EXPIRES_AT`，并限制脚本与日志文件权限：

```bash
chmod 700 /opt/isc/check-token.sh
chmod 600 /var/log/isc-token-check.log
```

## GitHub Actions 使用注意

仓库新增 `.github/workflows/github-token-expiry.yml`，默认每周一运行一次，也支持在 Actions 页面手动运行。它只执行只读 API 检查，并要求以下两个 repository secrets：

```text
ISC_GITHUB_TOKEN
ISC_GITHUB_TOKEN_EXPIRES_AT
```

未配置时工作流会明确失败并提示缺少配置，但不会打印 Token。当前项目没有启用 Slack 通知，因此到期提醒通过 GitHub Actions 的失败状态和日志摘要体现；如需邮件或其他渠道，应另行配置受控通知集成。

如果在 GitHub Actions 中运行，使用 repository secret：

```yaml
- name: Check GitHub token expiry
  env:
    ISC_GITHUB_TOKEN: ${{ secrets.ISC_GITHUB_TOKEN }}
    ISC_GITHUB_TOKEN_EXPIRES_AT: ${{ secrets.ISC_GITHUB_TOKEN_EXPIRES_AT }}
  run: |
    python3 scripts/check_github_token_expiry.py \
      --repo Icesnowcoin/ice-snow-city-gamefi \
      --warn-days 30 \
      --json
```

到期日期本身不是高敏感凭据，但仍建议作为 Secret 或受保护的环境变量维护，避免把 Token 管理信息散落在公开配置中。Token 本体仍必须是 Secret。

## 权限边界

脚本的 API 检查是只读检查：

1. `GET /user`：验证 Token 认证身份；
2. `GET /repos/{owner}/{repo}`：验证目标仓库可见性，并读取 GitHub 返回的仓库权限摘要；
3. `GET /repos/{owner}/{repo}/actions/workflows`：验证 Actions 工作流 API 可访问。

只读检查**不会证明写权限**，因为证明写权限需要创建分支、写入内容或触发工作流，这些都是有副作用的操作。真正执行性能数据上传时，仍应使用现有上传脚本的显式 `--upload` 流程，并在完成后撤销或轮换短期 Token。

## 单元测试

```bash
python3 -m unittest scripts/test_check_github_token_expiry.py -v
```

测试使用 mock，不会访问 GitHub，也不需要真实 Token。
