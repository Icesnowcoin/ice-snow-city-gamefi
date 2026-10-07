# GitHub Actions 集成真实 Android 设备云进行性能自动化

**作者：Manus AI**  
**适用项目：Ice Snow City Babylon.js Web/GameHub**  
**日期：2026-09-02**

## 结论先行

Ice Snow City 当前是浏览器游戏，主入口是 `/game`，因此首选 **BrowserStack Real Device Cloud + Playwright**。它可以直接在真实 Android 手机的 Chrome 浏览器打开已部署的 `/game` 页面，执行雪层 Shader 性能采样。

**Firebase Test Lab** 更适合 Android APK/AAB 的 Robo、Instrumentation 或 Game Loop 测试。它不是直接运行任意网页 Playwright 的设备云。若一定要使用 Firebase Test Lab，需要把游戏封装为 Android WebView APK 或 Android 游戏壳；此时测到的是 WebView/应用壳路径，不等同于真实 Chrome 网页性能，必须在报告中单独标注。

Firebase 官方说明 Test Lab 在 Google 数据中心的实体设备上运行 Android 测试，并通过 `gcloud firebase test android run` 选择设备、系统、语言和横竖屏方向。[1] BrowserStack 官方提供 Playwright 在真实 Android/iOS 设备上的 CI 集成，并支持 GitHub Actions 和 Local Testing 隧道。[2]

## 两条路线对比

| 方案 | 适合当前 Web 游戏吗 | 测试对象 | 性能可信度 | CI 复杂度 | 建议 |
|---|---|---|---|---|---|
| BrowserStack Real Device Cloud + Playwright | 是 | 真实 Android Chrome 中的 `/game` | 直接对应网页用户路径 | 中 | 当前主路线 |
| Firebase Test Lab + Android WebView APK | 部分适合 | WebView 包装后的 `/game` | 能反映 Android 应用壳，不等同 Chrome | 中高 | 作为第二条校验路线 |
| Firebase Test Lab + 原生 Game Loop | 仅适合已有 Android 游戏包 | APK/AAB 的游戏循环 | 适合原生/封装游戏 | 高 | 只有 Android 包成熟后采用 |

## 推荐路线：BrowserStack + Playwright

### 第一步：准备可被设备云访问的测试环境

不要让真机测试直接依赖 GitHub Actions 临时端口，除非使用 BrowserStack Local Tunnel。更稳定的做法是每个候选版本先部署到独立的 HTTPS staging 地址，例如：

```text
https://staging.example.com/game
```

如果只能在 CI runner 内启动应用，使用 BrowserStack 官方 `setup-local` Action 建立隧道，让真实设备访问 runner 上的服务。[2]

性能测试页面应暴露一个确定的浏览器 API，例如：

```ts
window.__iscPerf = {
  start: () => runSnowLayerPerfBenchmark(canvas, {
    durationMs: 10_000,
    warmupMs: 3_000,
    quality: "medium",
    meshCount: 24,
  }),
};
```

建议性能采样页面使用固定场景、固定摄像机、固定建筑数量和固定质量档位。不要在同一次采样中混入登录、网络请求、资产下载或随机天气，否则无法判断 Shader 本身的影响。

### 第二步：配置 GitHub Secrets

在 GitHub 仓库的 **Settings → Secrets and variables → Actions** 中配置：

| Secret | 用途 |
|---|---|
| `BROWSERSTACK_USERNAME` | BrowserStack 用户名 |
| `BROWSERSTACK_ACCESS_KEY` | BrowserStack Access Key |
| `ISC_PERF_BASE_URL` | staging 或生产候选版本的 HTTPS 地址 |
| `FEISHU_WEBHOOK_URL` | 可选，飞书机器人 Webhook |
| `FEISHU_WEBHOOK_SECRET` | 可选，飞书签名密钥 |
| `DINGTALK_WEBHOOK_URL` | 可选，钉钉机器人 Webhook |
| `DINGTALK_SECRET` | 可选，钉钉加签密钥 |

不要把 Access Key、Webhook URL 或签名密钥写进仓库、测试日志或截图。BrowserStack 官方示例要求把用户名和 Access Key 作为 GitHub Secrets 注入，并在测试前运行环境设置 Action。[2]

### 第三步：安装 Playwright 依赖

```bash
pnpm add -D @playwright/test
pnpm exec playwright install --with-deps chromium
```

推荐把 Playwright 配置放在 `perf/playwright.config.ts`，并把设备云测试与本地 Chromium 测试分开。BrowserStack 真机测试通常使用其远程 Playwright 连接能力；如果项目采用 BrowserStack 提供的 Playwright capabilities，应使用官方当前版本文档中的连接参数，不要把旧版 capability 模板长期硬编码。

### 第四步：Playwright 性能采样测试模板

```ts
// perf/android-real-device.spec.ts
import { test, expect } from "@playwright/test";

const baseUrl = process.env.ISC_PERF_BASE_URL!;

test("Android real device: snow layer performance", async ({ page }) => {
  await page.goto(`${baseUrl}/game?perf=1`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /start performance|开始性能测试/i }).click();

  const result = await page.evaluate(async () => {
    const perf = (window as any).__iscPerf;
    if (!perf?.start) throw new Error("__iscPerf API is not available");
    return await perf.start();
  });

  expect(result.baseline.avgFps).toBeGreaterThan(25);
  expect(result.snow.avgFrameMs / result.baseline.avgFrameMs).toBeLessThan(1.35);

  await test.info().attach("android-perf.json", {
    body: JSON.stringify({
      source: "browserstack-real-android",
      url: `${baseUrl}/game`,
      result,
    }, null, 2),
    contentType: "application/json",
  });
});
```

注意：真实 Android Chrome 中的 FPS、P95 帧时间和掉帧比例来自设备云运行结果；GitHub runner 的 CPU 使用率不能替代设备 GPU 数据。性能阈值应先用至少 3 次同设备重复运行建立基线，再设置门禁。

### 第五步：BrowserStack GitHub Actions 示例

以下模板表达集成结构。BrowserStack Action 的版本和 Playwright 连接参数应在落地时锁定到经过验证的版本，不建议无条件使用 `master`。

```yaml
# .github/workflows/android-browserstack-perf.yml
name: Android real-device web performance

on:
  workflow_dispatch:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  browserstack-android:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      ISC_PERF_BASE_URL: ${{ secrets.ISC_PERF_BASE_URL }}
      BROWSERSTACK_USERNAME: ${{ secrets.BROWSERSTACK_USERNAME }}
      BROWSERSTACK_ACCESS_KEY: ${{ secrets.BROWSERSTACK_ACCESS_KEY }}

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium

      - name: BrowserStack environment
        uses: browserstack/github-actions/setup-env@master
        with:
          username: ${{ secrets.BROWSERSTACK_USERNAME }}
          access-key: ${{ secrets.BROWSERSTACK_ACCESS_KEY }}
          project-name: ice-snow-city
          build-name: "android-perf-${{ github.run_number }}"

      # 如果 staging 只能在 runner 内访问，则取消注释并配合 Local capability。
      # - name: BrowserStack Local start
      #   uses: browserstack/github-actions/setup-local@master
      #   with:
      #     local-testing: start
      #     local-identifier: isc-${{ github.run_id }}

      - name: Run real Android Playwright performance test
        run: pnpm exec playwright test perf/android-real-device.spec.ts

      - name: Upload performance artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: android-real-device-perf-${{ github.run_number }}
          path: |
            test-results/
            playwright-report/
          retention-days: 14

      # - name: BrowserStack Local stop
      #   if: always()
      #   uses: browserstack/github-actions/setup-local@master
      #   with:
      #     local-testing: stop
```

设备矩阵建议先固定为 3 个代表性设备，而不是一开始运行大矩阵：一个中端 Samsung/Pixel 横屏 Chrome、一个较低端 Android 设备、一个当前项目主要用户覆盖的 Android 版本。每次 PR 运行 1 个中端设备；夜间或发布候选版本运行完整矩阵。

## Firebase Test Lab 路线：适用于 Android WebView 包装或 Android 游戏包

### 重要边界

Firebase Test Lab 官方支持 Robo、Instrumentation 和 Game Loop 等 Android 测试类型。[3] 因此当前 Ice Snow City Web 应用不能直接把 `/game` URL 作为普通 Playwright 页面交给 Test Lab。需要先准备一个 Android APK/AAB：

1. 使用 Android WebView 壳加载已部署的 `/game` 地址；或
2. 使用已有 Android 游戏壳，把性能测试 API 通过 WebView/原生桥暴露出来；或
3. 如果未来形成原生 Android 游戏包，使用 Game Loop 测试场景。

这条路线的报告必须写为 `firebase-test-lab-android-webview` 或 `firebase-test-lab-game-loop`，不能写成 `android-chrome-real-device`。

### Google Cloud 安全认证

GitHub Actions 不建议长期保存 Google Service Account JSON 私钥。推荐使用 GitHub OIDC + Google Workload Identity Federation，生成短期凭据；Google 官方提供 `google-github-actions/auth` Action 和 Workload Identity Federation 配置方式。[4]

需要准备：

| 配置 | 说明 |
|---|---|
| `GCP_PROJECT_ID` | Firebase/GCP 项目 ID |
| Workload Identity Pool | 允许指定 GitHub 仓库的 OIDC 身份 |
| Workload Identity Provider | 限制组织、仓库、分支或环境 |
| CI Service Account | 仅授予 Test Lab、结果桶和必要日志权限 |
| `FIREBASE_RESULTS_BUCKET` | 建议使用用户控制的 GCS 结果桶 |

服务账号权限应遵循最小权限原则。不要给 CI 服务账号长期 Owner 权限；Test Lab 官方文档指出，使用默认免费结果存储可能需要较高项目权限，如果需要长时间保留或自定义存储，应显式指定 `--results-bucket`。[3]

### Firebase Test Lab GitHub Actions 示例

```yaml
# .github/workflows/android-firebase-testlab.yml
name: Android Firebase Test Lab

on:
  workflow_dispatch:
  schedule:
    - cron: "17 2 * * *"

permissions:
  contents: read
  id-token: write

jobs:
  firebase-test-lab:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    env:
      GCP_PROJECT_ID: ${{ vars.GCP_PROJECT_ID }}
      FIREBASE_RESULTS_BUCKET: ${{ vars.FIREBASE_RESULTS_BUCKET }}

    steps:
      - uses: actions/checkout@v4

      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ vars.GCP_CI_SERVICE_ACCOUNT }}

      - uses: google-github-actions/setup-gcloud@v2

      - name: Build Android WebView wrapper
        run: ./gradlew assembleRelease assembleAndroidTest

      - name: Run physical-device instrumentation matrix
        run: |
          set -o pipefail
          RUN_ID="${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
          gcloud firebase test android run \
            --project="${GCP_PROJECT_ID}" \
            --type=instrumentation \
            --app=app/build/outputs/apk/release/app-release.apk \
            --test=app/build/outputs/apk/androidTest/release/app-release-androidTest.apk \
            --device=model=redfin,version=33,locale=en,orientation=landscape \
            --device=model=panther,version=34,locale=en,orientation=landscape \
            --performance-metrics \
            --record-video \
            --use-orchestrator \
            --timeout=10m \
            --results-bucket="gs://${FIREBASE_RESULTS_BUCKET}" \
            --results-dir="ice-snow-city/${RUN_ID}" \
            --results-history-name="ice-snow-city-webview-performance" \
            --client-details=matrixLabel="ice-snow-city-${RUN_ID}" \
            2>&1 | tee firebase-testlab.log

      - name: Upload Test Lab CLI output
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: firebase-testlab-${{ github.run_number }}
          path: firebase-testlab.log
          retention-days: 14
```

`--device` 可以重复指定设备；`--performance-metrics`、`--record-video`、`--results-bucket` 和唯一的 `--results-dir` 应根据实际测试类型和账户权限验证。Firebase 文档明确要求不同测试执行使用不同结果目录，不能复用同一路径。[3]

### Firebase 结果解析

不要只解析 CLI 的“passed/failed”。应保存：

```json
{
  "source": "firebase-test-lab",
  "test_type": "instrumentation-webview",
  "device": "redfin",
  "android_version": "33",
  "orientation": "landscape",
  "performance_metrics": {
    "avg_fps": null,
    "p95_frame_ms": null,
    "jank_ratio": null,
    "cpu_percent": null,
    "memory_mb": null
  },
  "artifacts": {
    "video": "gs://...",
    "logs": "gs://...",
    "screenshots": "gs://..."
  }
}
```

Test Lab 能够提供设备测试结果、日志、视频以及某些测试类型对应的性能数据，但具体可用指标会受测试类型、设备和采集方式影响。没有实际字段时必须写 `null`，不能把 WebView 帧率估算成真实 Chrome GPU FPS。

## 阈值门禁建议

建议先设置“报告但不阻断”阶段，连续收集同一设备至少 10 次结果后再开启阻断：

| 指标 | 初始观察阈值 | 阻断建议 |
|---|---:|---:|
| Baseline 平均 FPS | 记录 | 低于历史 P10 时阻断 |
| 雪层相对帧时间开销 | ≤ 35% | 连续 2 次超过 35% 才阻断 |
| P95 帧时间 | 记录 | 比基线增加超过 40% 且连续 2 次阻断 |
| 掉帧比例 | 记录 | 超过 20% 且持续两次阻断 |
| Shader 编译失败 | 0 | 立即阻断 |
| 黑材质/透明错误 | 0 | 立即阻断 |

所有阈值都必须按设备、Android 版本、浏览器/包装类型分组。不能把 Pixel 的数据与低端 Samsung 的数据混成单一平均值。

## 飞书/钉钉通知

性能测试结束后，先生成统一 JSON，再由 CI 脚本把摘要发送到飞书或钉钉。通知内容应包含提交 SHA、设备、测试来源、baseline FPS、snow FPS、相对开销、P95、门禁结论和报告链接。Webhook URL 与签名密钥必须来自 GitHub Secrets；通知失败不应覆盖主测试失败结果，建议通知步骤使用 `if: always()`，并在网络错误时最多重试 3 次、指数退避。

通知正文要明确区分：

```text
来源：BrowserStack Android Chrome 真机
或：Firebase Test Lab Android WebView
```

不得使用“真实 Android Chrome”描述 Firebase WebView 结果。飞书自定义机器人与钉钉机器人都应启用签名/加签安全设置，并限制可发送的仓库、分支或 IP 范围；接口格式和安全要求应以各平台当前官方文档为准。[5] [6]

## 推荐落地顺序

第一阶段只接入 BrowserStack，使用一个 staging `/game` 地址和一台中端横屏 Android 真机，先验证固定场景、报告 JSON 和阈值逻辑。第二阶段扩展到低端设备和夜间矩阵，并把结果发送到飞书/钉钉。第三阶段如果项目需要 Android 应用发布，再建立 WebView 或原生 Android 包并接入 Firebase Test Lab；届时将 Firebase 结果与 BrowserStack Chrome 结果分开统计。

**当前项目最重要的限制是：**没有 BrowserStack 或 Firebase 的真实账户、设备矩阵和 CI Secret，不能在本地声称已经完成真机性能验证。上述配置是可复制的实施模板；真实 FPS、P95、掉帧率和 GPU 差异必须由 GitHub Actions 在目标设备云中实际运行后产生。

## References

[1]: https://firebase.google.com/docs/test-lab "Firebase Test Lab"
[2]: https://www.browserstack.com/docs/automate/playwright/github-actions "Integrate GitHub Actions with BrowserStack Playwright"
[3]: https://firebase.google.com/docs/test-lab/android/command-line "Firebase Test Lab Android command line"
[4]: https://github.com/google-github-actions/auth "Google GitHub Actions Auth"
[5]: https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot "飞书自定义机器人"
[6]: https://open.dingtalk.com/document/robots/customize-robot-security-settings "钉钉自定义机器人安全设置"
