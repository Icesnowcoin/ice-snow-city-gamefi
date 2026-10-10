# AI-Generated Development Baseline 资产自动化测试与校验标准

**版本：** 2026-09-16  
**适用范围：** Ice Snow City 的 `AI-generated development baseline`、`generated-procedural` 和其他仅用于开发预览的模型资源  
**目标：** 让 AI 生成或程序化生成的资产能够安全地用于开发、集成、回归和性能流程，同时绝不因为自动化测试通过而被误标为高保真生产资产。

## 一、资产等级与自动化门禁

自动化测试只能证明资产满足某些机器可验证条件，不能证明美术质量、商业授权或真实设备表现。因此资产状态必须与测试状态分离。

| 资产状态 | 可做什么 | 不可做什么 | 必须条件 |
|---|---|---|---|
| `generated-procedural` | 本地开发、加载测试、场景占位、流程演练 | 作为最终美术展示或高保真证据 | 来源、生成器版本、文件哈希和限制说明完整 |
| `procedural-baseline` | 开发预览、回归测试、性能预算初测 | 清除真实资产 pending 门禁 | GLB、结构、资源引用、加载和基础预算检查通过 |
| `technical-review` | 进入有限的集成测试 | 作为正式上线资源 | 人工技术审查和完整报告通过 |
| `device-validated` | 进入设备验证候选 | 直接宣称高保真或正式上线 | 真实设备证据包完整且可复现 |
| `verified` | 允许申请正式运行时接入 | 不能绕过授权和产品评审 | 艺术、技术、授权、设备和回归证据齐全 |

> **硬规则：** `test pass` 只表示“当前自动化检查通过”，不表示“资产质量优秀”，也不表示“真实高保真交付已完成”。任何脚本都不得把 `ci-software`、`generated-procedural` 或 `procedural-baseline` 自动升级为 `verified`。

## 二、必须执行的九类检查

### 2.1 来源、身份和可追溯性检查

每个资产必须有唯一 `assetId`，并在 manifest 中记录 `source`、`status`、`generator`、`generatorVersion`、`generatedAt`、`sha256`、`licenseStatus` 和 `highFidelityDelivery`。若缺少来源、版本或哈希，测试必须失败。生成器输出、外部输入和人工修改后的版本不能共用同一个不可追溯的文件名。

建议的最小 manifest 结构如下：

```json
{
  "assetId": "landmark-bank-baseline",
  "source": "generated-procedural",
  "status": "procedural-baseline",
  "highFidelityDelivery": "pending-import",
  "generator": "scripts/generateProceduralBaselineGlb.mjs",
  "generatorVersion": "2026-09-14",
  "generatedAt": "2026-09-14T00:00:00.000Z",
  "file": "landmark-bank-baseline.glb",
  "sha256": "...",
  "licenseStatus": "internal-generated-development-only"
}
```

自动化失败条件包括：`assetId` 重复、`source` 缺失、`status` 与目录不一致、真实 URL 被误写入 baseline、`highFidelityDelivery` 不是 `pending-import`、哈希不匹配，以及 manifest 中出现 Token、Webhook、Bearer、设备序列号或本地敏感路径。

### 2.2 GLB/glTF 文件完整性检查

资产必须是可解析的二进制 glTF 2.0。基础检查包括文件存在、文件大小大于零、前四字节为 `glTF`、版本字段为 2、声明长度等于实际文件长度，以及 JSON/二进制 chunk 可以被解析。

当前项目可使用：

```bash
BASELINE_ASSET_OUTPUT=/home/ubuntu/webdev-static-assets/ice-snow-city/procedural-baseline \
  node scripts/validateProceduralBaseline.mjs
```

硬失败条件是 magic 不匹配、版本不是 2、声明长度不一致、manifest 引用了不存在的 GLB、GLB 引用了不存在的 buffer 或 image，或者同一个 `assetId` 存在多个候选文件而没有明确版本。

### 2.3 场景结构和命名检查

节点、网格、材质、骨骼、动画和碰撞节点必须使用稳定命名。建议采用 `assetId__category__name` 形式，例如 `landmark-bank-baseline__mesh__main`、`landmark-bank-baseline__collision__root`。不应把 Blender、Maya 或导出器产生的随机默认名称作为业务契约。

自动化应检查：根节点数量、节点名称重复、孤立节点、非预期隐藏节点、负缩放、非单位化旋转/缩放、未冻结变换、空网格、空材质、未绑定的骨骼和超出允许范围的层级深度。对 baseline 资产，建议把未使用节点作为警告；对正式候选资产，未使用节点应作为失败。

### 2.4 几何和拓扑检查

几何检查不需要试图判断“艺术上是否漂亮”，而应检查可确定的技术事实。每个资产必须记录总三角形数、每个 LOD 的三角形数、网格数量、材质槽数量、顶点数和包围盒尺寸。

| 资源类型 | LOD0 起始预算 | 自动化行为 |
|---|---:|---|
| 英雄地标 | 25k–60k 三角形 | 超过上限失败；接近上限警告并要求说明 |
| 普通建筑 | 8k–25k | 超过上限失败 |
| 玩家角色 | 15k–25k | 超过上限失败；缺少完整骨骼时失败 |
| NPC | 10k–20k | 超过上限失败；不允许以头像替代全身模型 |
| 道路/街灯 | 1k–8k | 超过上限警告或失败，取决于场景可见数量 |
| 植被小件 | 200–3k | 超过上限警告，要求说明实例化策略 |

必须检查法线、切线、UV 集合、非有限数值、零面积三角形、退化面、极端坐标、异常包围盒和负体积。自动化工具无法完全判断法线是否符合美术预期，因此应输出可审查报告，而不能将“法线存在”解释为“法线正确”。

### 2.5 PBR、纹理和材质检查

每个材质必须明确 `baseColor`、`roughness`、`metallic`、`normal` 和可选的 `occlusion`、`emissive`。脚本应检查纹理引用是否存在、图片格式是否允许、尺寸是否在预算内、色彩空间标记是否合理、透明材质是否显式声明，以及材质数量是否超过资源类型上限。

| 资源类型 | 纹理建议 | 材质数量建议 |
|---|---|---:|
| 玩家角色 | 身体 2048，服装 1024–2048 | 2–4 |
| NPC | 1024–2048 | 1–3 |
| 地标建筑 | 1024–2048，必要时使用图集 | 2–4 |
| 普通道路/道具 | 512–1024，优先图集 | 1–2 |
| 植被 | 256–1024，优先图集 | 1–2 |

baseline 允许程序化材质，但必须记录材质是“placeholder”还是“PBR-ready”。禁止出现材质名称声称为最终制作、审计通过或真实资产，但 manifest 中没有对应的审计证据。

### 2.6 LOD、碰撞和实例化检查

开发 baseline 也必须拥有最小的运行时结构。建筑至少应有 LOD0 和 LOD1；大量重复对象应声明实例化或合批策略；可交互物体必须有简化碰撞体或明确标记为 `noCollision`。高模网格不应未经说明直接作为碰撞体。

自动化检查包括：LOD 数量、LOD 三角形单调递减、LOD 切换距离非负且顺序正确、碰撞节点存在、碰撞体三角形数量远小于渲染网格、碰撞节点不被渲染材质引用，以及实例化对象使用统一材质。对于只用于远景的装饰物，允许没有复杂碰撞，但必须在 manifest 说明。

### 2.7 骨骼、动画和角色完整性检查

玩家角色 baseline 必须是完整全身角色，不能以头像、半身模型或静态截图满足角色资产测试。应检查骨骼数量、根骨骼、蒙皮权重、最大影响骨骼数、动画名称、帧率、持续时间、循环标记和关键帧范围。

推荐的最小动画集合是 `idle`、`walk`、`run`、`work`、`sleep`、`celebrate`、`sad` 和 `talk`。baseline 可以暂时缺少部分动画，但必须将其记录为 warning，并阻止其进入 `verified`。动画检查器应检测空动画、零时长动画、NaN 关键帧、骨骼路径失效、非循环动作被标记为循环，以及动画播放后角色位置异常漂移。

### 2.8 Babylon.js 加载和运行时检查

资产必须在 Babylon.js 的实际加载路径中验证，而不仅是通过文件头检查。至少需要覆盖：成功加载、加载失败时可捕获错误、材质和纹理引用解析、节点数量、动画组数量、碰撞节点发现、资源释放和重复加载不会无限增加场景对象。

建议使用 Babylon.js `NullEngine` 或受控浏览器测试执行以下断言：

```ts
expect(asset.status).toBe("procedural-baseline");
expect(asset.highFidelityDelivery).toBe("pending-import");
expect(importedMeshes.length).toBeGreaterThan(0);
expect(importedMeshes.every(mesh => Number.isFinite(mesh.getTotalVertices()))).toBe(true);
expect(scene.animationGroups.every(group => group.targetedAnimations.length > 0)).toBe(true);
```

浏览器级测试还应验证移动端横屏 16:9 视口、资源加载超时、重复进入/退出场景、切换质量档位、低质量 fallback 和模型卸载。加载失败时必须回退到另一个明确标记的 baseline，而不能静默加载未知远程 URL。

### 2.9 性能、稳定性和回归检查

性能测试应区分三类证据：`ci-software`、`ci-gpu` 和 `ios-real/android-real`。前两者只能用于开发趋势和回归；只有最后一类才能作为真实设备证据。任何性能 JSON 必须包含 `source`、`device`、`samples`、`mode`、`quality`、`engineFps`、`averageFrameMs`、`p95FrameMs`、`droppedFrameRatio`、`frames` 和 `durationMs`。

建议的开发 baseline 初始阈值如下：平均 FPS 不低于 45，P95 帧时间不高于 33 ms，掉帧比例不高于 0.05，连续运行时间至少 30 秒。若样例中的内存或 Draw Calls 无法采集，应使用 `null` 并显示为“未采集”，不能填入估算值。CI 软件指标通过不代表真机指标通过。

每次性能回归还应记录相对变化。与基线相比，P95 帧时间上升超过 20%、样本数减少超过 10%、文件大小上升超过 30%、材质数量翻倍或首次加载时间上升超过 25%时，应阻止合并或要求人工确认。

## 三、测试层级与命令设计

### 3.1 快速静态门禁

每次提交都应执行 manifest、敏感字段、GLB 文件头、哈希和路径检查。该层级应在 30 秒到 2 分钟内完成，失败时直接阻止后续任务。

```bash
pnpm exec vitest run server/validateExternalDeliveryBundle.test.ts
BASELINE_ASSET_OUTPUT=/home/ubuntu/webdev-static-assets/ice-snow-city/procedural-baseline \
  node scripts/validateProceduralBaseline.mjs
```

### 3.2 结构与引擎门禁

在 Node 或浏览器环境中加载全部 baseline 资产，输出节点、材质、动画、LOD、碰撞和包围盒报告。测试必须覆盖一个角色、一个 NPC、一个地标、一个道路包和一个植被包，避免只测试最简单的静态立方体。

### 3.3 性能趋势门禁

使用固定的场景布局、固定的质量档位和固定的运行时版本，运行 baseline 与 snow 两组样本。报告必须写入 `performance-data/` 或专用 artifact，且包含生成器版本、浏览器版本、渲染器和采样时长。`ci-software` 只能触发趋势检查，不得写入真实设备目录或清除 `realDeviceEvidenceRequired`。

### 3.4 发布前组合门禁

发布候选必须串联：完整 Vitest、TypeScript、生产构建、外部 pending 分类器、交付包安全扫描、baseline 校验器和性能分析器。只要其中一个步骤报告未知来源、敏感字段、真实证据缺失或状态越权，整体必须 fail-closed。

## 四、统一报告结构

每个资产报告应至少包含以下字段：

```json
{
  "assetId": "landmark-bank-baseline",
  "assetVersion": "v001",
  "source": "generated-procedural",
  "status": "procedural-baseline",
  "checks": {
    "fileIntegrity": "pass",
    "sceneStructure": "pass",
    "geometry": "warning",
    "pbr": "pass",
    "lod": "pass",
    "collision": "pass",
    "animation": "not-applicable",
    "babylonLoad": "pass",
    "performance": "software-only"
  },
  "metrics": {
    "bytes": 2028,
    "trianglesLod0": 1200,
    "materials": 1,
    "textures": 0,
    "animations": 0,
    "lodCount": 2
  },
  "warnings": [
    "No artist-authored texture set",
    "No real-device evidence"
  ],
  "releaseDecision": "development-only",
  "highFidelityDelivery": "pending-import"
}
```

报告必须区分 `pass`、`warning`、`fail`、`not-applicable`、`software-only` 和 `pending-external-input`。不要把缺少数据表示为 0；例如没有采集内存时应为 `null` 或 `not-collected`，否则会误导后续分析。

## 五、CI 规则和不可升级保护

CI 中至少应设置四个独立 job：`baseline-static-checks`、`baseline-engine-load`、`baseline-performance-trend` 和 `release-boundary-check`。前三个 job 可以服务于开发反馈，最后一个 job 必须读取 manifest 和外部 pending 汇总，验证任何 baseline 资源都不会把真实资产状态从 `pending-import` 改成 `verified`。

必须拒绝以下变更：

| 变更 | 处理 |
|---|---|
| 将 `source=generated-procedural` 改成 `external-delivery` | 失败 |
| 将 `highFidelityDelivery=pending-import` 改成 `verified`，但没有真实交付证据 | 失败 |
| 用 `ci-software` 文件填充 `ios-real` 或 `android-real` 目录 | 失败 |
| 只提交渲染图，没有 GLB 和技术清单 | 失败 |
| 性能字段缺失时填入推测值 | 失败 |
| 资产中包含 Token、Webhook、设备身份或本地敏感路径 | 失败 |
| 修改生成器但没有更新 generatorVersion 和回归报告 | 失败或要求人工复核 |

## 六、测试覆盖目标

对 baseline 资产管线，建议将覆盖率拆成三类，而不是只看一个总百分比。校验器核心分支覆盖率目标为 90% 以上；manifest 状态越权、敏感字段、路径越界、哈希错误、重复资产和缺失证据等安全分支必须达到 100%；Babylon.js 加载集成测试至少覆盖每类资产一个样本，并覆盖加载失败和资源释放路径。

这些目标是测试工程目标，不是对艺术质量的评分。测试覆盖率高但规则不完整，仍然可能放过不适合运行时的资源，因此必须结合人工视觉审查和真实设备验证。

## 七、建议的最小验收命令

```bash
# 1. 静态类型和完整测试
pnpm exec tsc --noEmit
pnpm test

# 2. baseline GLB 完整性
BASELINE_ASSET_OUTPUT=/home/ubuntu/webdev-static-assets/ice-snow-city/procedural-baseline \
  node scripts/validateProceduralBaseline.mjs

# 3. 外部交付包安全门禁
pnpm test:external-pending
pnpm validate:external-delivery

# 4. 软件性能趋势演练
python3 scripts/analyze_real_device_performance.py \
  --input testing/fixtures/performance/ci-software-substitute-2026-09-16/ci-software-substitute.json \
  --output testing/fixtures/performance/ci-software-substitute-2026-09-16/report
```

## 八、最终结论

`AI-generated development baseline` 的正确质量标准不是“看起来像最终资产”，而是“可追溯、可加载、可回归、可降级、可测量、不会污染正式门禁”。自动化测试应首先保护项目不被坏文件、坏引用、超预算资源、敏感信息和状态越权破坏；随后再提供性能趋势和引擎整合反馈。

只要 manifest、报告和 CI 始终保留 `source=ci-software/generated-procedural`、`realDeviceEvidenceRequired=true` 和 `highFidelityDelivery=pending-import`，AI baseline 就可以安全地支持长期开发，而不会被误认为真实高保真交付。
