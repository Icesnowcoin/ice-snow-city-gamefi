# CI/CD 雪层 Shader 性能测试与飞书/钉钉通知方案

## 结论先行

建议把流程拆成两条质量线：CI 中用 Playwright 或 Puppeteer 运行 Chromium 的软件/虚拟 GPU 基线，检查 Shader 是否能编译、页面是否稳定、性能是否出现明显回归；iOS/Android 真机性能则交给设备云或实体设备矩阵执行。浏览器自动化可以验证流程和趋势，但不能把桌面 Chromium 的结果标记为真实手机 GPU 结果。

飞书和钉钉都支持通过自定义机器人 Webhook 推送消息；两者都可以配置安全校验，钉钉官方文档明确提供加签方式，飞书官方文档提供自定义机器人 Webhook 能力。[1] [2]

## 两种可行方案

| 方案 | 适用场景 | 优点 | 局限 | 成本与复杂度 |
|---|---|---|---|---|
| Playwright + CI Chromium + Webhook | 每次 PR、合并和发布前的快速回归 | 可复现、易归档、失败可阻断合并 | 不是手机 GPU；软件渲染的 FPS 只适合趋势比较 | 较低；需要安装浏览器和两个通知密钥 |
| Playwright/Puppeteer + 真机设备云 + Webhook | 夜间、发布候选版本或每周性能门禁 | 可获得真实 iOS/Android 设备数据 | 设备排队、系统温控、浏览器版本和网络会增加噪声 | 较高；需要设备云账号或自有设备 Runner |

推荐先落地第一种方案作为 CI 必过门禁，再把第二种方案作为发布候选版本的真实设备门禁。若项目暂时不需要自动执行，只保留本地脚本和报告归档，也可以只采用第一种方案的采样脚本。

## 一、CI 页面准备

当前 `snowLayerPerfHarness.ts` 导出的是浏览器端函数。为了让 Playwright 调用它，建议增加一个仅在非生产环境或受保护预览构建中出现的 `/perf/snow-layer` 页面。页面需要把函数挂到测试专用全局对象，生产包不能暴露内部测试入口：

```ts
// 仅在 PERF_HARNESS_ENABLED=true 的测试构建中执行
import { runSnowLayerPerfBenchmark } from "@/game/snowLayerPerfHarness";

(window as Window & {
  __ISC_PERF__?: {
    run: (options?: Parameters<typeof runSnowLayerPerfBenchmark>[1]) => ReturnType<typeof runSnowLayerPerfBenchmark>;
  };
}).__ISC_PERF__ = {
  run: (options) => {
    const canvas = document.querySelector<HTMLCanvasElement>("#snow-perf-canvas");
    if (!canvas) throw new Error("snow-perf-canvas not found");
    return runSnowLayerPerfBenchmark(canvas, options);
  },
};
```

页面还应提供一个稳定的 `#snow-perf-canvas`、`#perf-status` 和 `#perf-result` 元素。测试页不要加载登录、交易、通知推送或外部网络数据，否则会把业务噪声混入 Shader 结果。

## 二、Playwright CI 采样脚本

安装依赖并下载 Chromium：

```bash
pnpm add -D @playwright/test
pnpm exec playwright install --with-deps chromium
```

下面脚本将访问构建后的预览页面，执行 baseline 与 snow 两组测试，保存 JSON，并根据相对退化阈值决定进程是否失败。建议连续执行 3 次，使用中位数，而不是单次结果：

```ts
// scripts/run-snow-layer-ci.mts
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = process.env.PERF_BASE_URL ?? "http://127.0.0.1:4173";
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--disable-gpu-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
await page.goto(`${baseUrl}/perf/snow-layer`, { waitUntil: "networkidle" });
await page.waitForFunction(() => Boolean((window as Window & { __ISC_PERF__?: unknown }).__ISC_PERF__));

const runs = [];
for (let index = 0; index < 3; index += 1) {
  const result = await page.evaluate(async () => {
    const perf = (window as Window & {
      __ISC_PERF__?: { run: (options: { durationMs: number; quality: "medium"; meshCount: number }) => Promise<unknown[]> };
    }).__ISC_PERF__;
    if (!perf) throw new Error("Performance harness is not available");
    return perf.run({ durationMs: 5000, quality: "medium", meshCount: 24 });
  });
  runs.push({ index: index + 1, result });
}

await mkdir("artifacts/snow-layer", { recursive: true });
await writeFile("artifacts/snow-layer/runs.json", JSON.stringify({ baseUrl, runs }, null, 2));
await page.screenshot({ path: "artifacts/snow-layer/page.png", fullPage: true });
await browser.close();

const allSamples = runs.flatMap((run) => run.result as Array<{
  mode: "baseline" | "snow";
  averageFrameMs: number;
  p95FrameMs: number;
  droppedFrameRatio: number;
}>);
const baseline = allSamples.filter((sample) => sample.mode === "baseline");
const snow = allSamples.filter((sample) => sample.mode === "snow");
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const baselineFrameMs = mean(baseline.map((sample) => sample.averageFrameMs));
const snowFrameMs = mean(snow.map((sample) => sample.averageFrameMs));
const snowP95 = mean(snow.map((sample) => sample.p95FrameMs));
const snowDropped = mean(snow.map((sample) => sample.droppedFrameRatio));
const overhead = (snowFrameMs - baselineFrameMs) / Math.max(0.001, baselineFrameMs);
const summary = { baselineFrameMs, snowFrameMs, snowP95, snowDropped, overhead };
await writeFile("artifacts/snow-layer/summary.json", JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

// 初始 CI 阈值：只做回归检测，不代表手机发布标准。
if (overhead > 0.35 || snowDropped > 0.2) {
  console.error("Snow layer performance regression exceeded CI threshold");
  process.exitCode = 1;
}
```

`--use-angle=swiftshader` 适合无 GPU Runner 的稳定回归，但其 FPS 不应与真机 FPS 直接比较。若 CI Runner 有可控 GPU，可以另建一个 `gpu-perf` job，固定 Runner 类型并把结果标记为 `ci-gpu`，不能与 `ios`、`android` 混用。

## 三、GitHub Actions 示例

```yaml
# .github/workflows/snow-layer-perf.yml
name: snow-layer-performance

on:
  pull_request:
    paths:
      - "client/src/game/**"
      - "client/src/pages/**"
      - "client/src/index.css"
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  chromium-baseline:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.34.4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
      - name: Start preview server
        run: pnpm exec vite preview --host 127.0.0.1 > /tmp/ice-snow-preview.log 2>&1 &
      - run: pnpm exec tsx scripts/run-snow-layer-ci.mts
        env:
          PERF_BASE_URL: http://127.0.0.1:4173
      - name: Upload performance artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: snow-layer-${{ github.sha }}
          path: artifacts/snow-layer/
      - name: Notify Feishu or DingTalk
        if: always() && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')
        run: pnpm exec tsx scripts/notify-performance.mts
        env:
          CI_STATUS: ${{ job.status }}
          CI_SHA: ${{ github.sha }}
          CI_RUN_URL: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}
          FEISHU_WEBHOOK_URL: ${{ secrets.FEISHU_WEBHOOK_URL }}
          FEISHU_WEBHOOK_SECRET: ${{ secrets.FEISHU_WEBHOOK_SECRET }}
          DINGTALK_WEBHOOK_URL: ${{ secrets.DINGTALK_WEBHOOK_URL }}
          DINGTALK_WEBHOOK_SECRET: ${{ secrets.DINGTALK_WEBHOOK_SECRET }}
```

Pull request 中建议默认不发群通知，避免噪声；只上传报告并在失败时阻断合并。推送到 `main`、手动运行和发布候选版本再发送飞书/钉钉摘要。

## 四、飞书/钉钉安全通知脚本

机器人 Webhook URL 和签名密钥必须放在 CI Secret 中，不能写入仓库、报告或日志。飞书签名通常使用 `timestamp + "\\n" + secret` 进行 HMAC-SHA256 后 Base64，再作为 `sign` 参数；钉钉加签也使用时间戳与密钥计算签名，具体以群机器人安全设置为准。[1] [2]

```ts
// scripts/notify-performance.mts
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";

const summary = JSON.parse(await readFile("artifacts/snow-layer/summary.json", "utf8"));
const status = process.env.CI_STATUS ?? "unknown";
const sha = (process.env.CI_SHA ?? "unknown").slice(0, 12);
const runUrl = process.env.CI_RUN_URL ?? "";
const text = [
  `Ice Snow City 雪层 Shader CI：${status}`,
  `commit: ${sha}`,
  `平均帧时间 baseline/snow：${summary.baselineFrameMs.toFixed(2)} / ${summary.snowFrameMs.toFixed(2)} ms`,
  `P95 帧时间：${summary.snowP95.toFixed(2)} ms`,
  `掉帧比例：${(summary.snowDropped * 100).toFixed(1)}%`,
  `相对开销：${(summary.overhead * 100).toFixed(1)}%`,
  `报告：${runUrl}`,
].join("\\n");

function signedUrl(rawUrl: string | undefined, secret: string | undefined) {
  if (!rawUrl) return undefined;
  if (!secret) return rawUrl;
  const timestamp = Date.now().toString();
  const sign = createHmac("sha256", secret)
    .update(`${timestamp}\\n${secret}`)
    .digest("base64");
  const separator = rawUrl.includes("?") ? "&" : "?";
  return `${rawUrl}${separator}timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
}

async function post(url: string | undefined, body: unknown) {
  if (!url) return;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Notification failed: HTTP ${response.status}`);
}

const feishuUrl = signedUrl(process.env.FEISHU_WEBHOOK_URL, process.env.FEISHU_WEBHOOK_SECRET);
const dingtalkUrl = signedUrl(process.env.DINGTALK_WEBHOOK_URL, process.env.DINGTALK_WEBHOOK_SECRET);
const failures: string[] = [];

await Promise.all([
  post(feishuUrl, { msg_type: "text", content: { text } }).catch((error) => failures.push(`Feishu: ${String(error)}`)),
  post(dingtalkUrl, { msgtype: "text", text: { content: text } }).catch((error) => failures.push(`DingTalk: ${String(error)}`)),
]);

if (failures.length > 0) {
  console.error(failures.join("\\n"));
  // 通知失败不应覆盖已经产生的性能结果；如需强门禁，可改为 process.exitCode = 1。
}
```

生产环境建议把通知脚本的重试限制为 2–3 次，采用 1 秒、3 秒、9 秒退避；不得在失败日志中打印完整 Webhook URL 或签名参数。通知内容只放摘要和 CI 报告链接，不放邮箱、Token、RPC URL、钱包地址或完整环境变量。

## 五、真机设备云接入

真机任务应使用同一个 `/perf/snow-layer` 页面和同一个 `snowLayerPerfHarness.ts`，但由设备云的 iOS Safari、Android Chromium 会话执行。设备云结果需要额外记录设备型号、系统版本、浏览器版本、DPR、温度/电源状态、WebGL 版本和测试时间。建议每台设备执行 3 次并报告中位数，超过 P95 或掉帧阈值时保留原始 JSON 供复查。

真机 job 不应使用 CI Chromium 的阈值直接判定。推荐将结果分为 `ci-software`, `ci-gpu`, `ios-real`, `android-real` 四个标签，并分别设定门禁。只有真实设备数据才能支持“iOS/Android 帧率达标”的发布结论。

## 六、建议门禁

| 门禁 | 初始建议 | 失败处理 |
|---|---|---|
| Shader 编译 | 页面无 WebGL 编译错误、无黑材质 | CI 失败，上传截图和控制台日志 |
| CI 软件基线 | 相对帧时间开销不超过 35%，掉帧比例不超过 20% | 阻断合并或要求性能负责人确认 |
| 中端真机 | 目标设备上长期维持约 40 FPS 或以上 | 切换 Medium、降低纹理或关闭阴影/Bloom |
| 低端真机 | 目标设备上长期维持约 30 FPS 或以上 | 使用 Low 档，关闭法线、实时阴影和 Bloom |
| 报告完整性 | JSON、摘要、截图和 commit 可追溯 | 不允许只发送群通知而不归档原始数据 |

这些阈值是工程起始值，不是当前项目已经取得的实测结果。性能脚本执行前必须先固定场景、模型数量、纹理、摄像机、浏览器版本和电源状态。

## 七、实现顺序

第一步是在测试构建中加入 `/perf/snow-layer` 页面并暴露专用全局函数。第二步把 Playwright 脚本和报告归档加入 GitHub Actions。第三步接入飞书或钉钉其中一个机器人，验证密钥不出现在日志中。第四步接入真实 iOS/Android 设备云，建立独立设备矩阵。第五步根据 2–3 周历史数据校准阈值，而不是依据一次 CI 运行结果调整 Shader。

### References

[1]: https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot "飞书开放平台：自定义机器人使用指南"
[2]: https://open.dingtalk.com/document/robots/customize-robot-security-settings "钉钉开放平台：自定义机器人安全设置"
