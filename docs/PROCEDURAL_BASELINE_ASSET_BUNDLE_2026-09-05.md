# Procedural Baseline Asset Bundle

本文件记录在没有真实美术文件输入时由 Babylon.js NullEngine 生成的**程序化基线资产**。这些文件用于 GLB 加载链路、资产门禁、场景回归和移动端资源预算验证，**不等同于高保真美术交付**。

| Asset ID | WebDev Storage Path | Status |
|---|---|---|
| `player-character-baseline` | `/manus-storage/player-character-baseline_b26d1cda.glb` | `procedural-baseline` / `pending-import` |
| `npc-citizen-baseline` | `/manus-storage/npc-citizen-baseline_6f36bf7e.glb` | `procedural-baseline` / `pending-import` |
| `landmark-city-core-baseline` | `/manus-storage/landmark-city-core-baseline_e168862c.glb` | `procedural-baseline` / `pending-import` |
| `landmark-bank-baseline` | `/manus-storage/landmark-bank-baseline_04f6197a.glb` | `procedural-baseline` / `pending-import` |
| `landmark-commercial-baseline` | `/manus-storage/landmark-commercial-baseline_28ee7e9c.glb` | `procedural-baseline` / `pending-import` |
| `landmark-production-baseline` | `/manus-storage/landmark-production-baseline_821c3b99.glb` | `procedural-baseline` / `pending-import` |
| `environment-road-baseline` | `/manus-storage/environment-road-baseline_e861b9c3.glb` | `procedural-baseline` / `pending-import` |
| `environment-vegetation-baseline` | `/manus-storage/environment-vegetation-baseline_4d40d3ad.glb` | `procedural-baseline` / `pending-import` |
| manifest | `/manus-storage/manifest_40510efc.json` | generated metadata |
| validation report | `/manus-storage/validation_f926394a.json` | 8/8 GLB headers valid |

生成器为每个文件写入 `assetStatus=procedural-baseline`、`source=generated-procedural` 和 `highFidelityDelivery=pending-import` 元数据。验证器检查 GLB magic `glTF`、版本 `2` 和声明长度；当前八个文件均通过。该结果只证明基线 GLB 可被验证和接入，不证明网格面数、骨骼、动画、PBR 贴图、LOD 或碰撞满足最终美术验收。

## 开发预览字段

`CORE_ASSET_MANIFEST` 为八项资产新增可选 `baselineGlbUrl`，指向已上传的程序化基线文件；真实 `glbUrl` 仍为 `null`，`status` 仍为 `pending-import`，因此 `validateAssetManifestEntry` 和 `readyForRuntime` 不会因开发预览文件而放行高保真资产。manifest 6 项测试、TypeScript、全量 199 个测试文件/2149 项测试和生产构建通过。
