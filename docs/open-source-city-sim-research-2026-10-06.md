# Ice Snow City 开源城市模拟路线研究（2026-10-06）

## 结论

当前最匹配的开源基础不是普通 Godot 模板，而是 **MicropolisCore**：它是基于 SimCity Classic/Micropolis 模拟逻辑的独立城市模拟核心，仓库同时提供 C++/Emscripten WASM 引擎、TypeScript/SvelteKit 浏览器应用、Canvas/WebGL/WebGPU tile renderer，以及保存/加载与确定性模拟相关代码。

- 仓库：https://github.com/SimHacker/MicropolisCore
- 官方 README：https://github.com/SimHacker/MicropolisCore/blob/main/README.md
- 开发文档：https://github.com/SimHacker/MicropolisCore/blob/main/DEVELOPMENT.md
- 许可证：https://github.com/SimHacker/MicropolisCore/blob/main/LICENSE
- 上游 JavaScript 版本：https://github.com/graememcc/micropolisJS
- MicropolisCore 提供的浏览器应用目录：`apps/micropolis`
- WASM 引擎目录：`packages/micropolis-engine`
- 图块渲染器：`packages/tile-renderer`

## 技术可行性

MicropolisCore 的开发文档明确写出：

- Node.js >= 20、pnpm 10；
- 已提交的 WASM 产物可直接运行，不必先安装 Emscripten；
- 引擎可通过 Emscripten 编译为 WASM；
- `apps/micropolis` 是 SvelteKit 浏览器城市模拟应用；
- `packages/micropolis-engine` 是 C++/Emscripten WASM 模拟核心；
- `packages/tile-renderer` 支持 Canvas/WebGL/WebGPU；
- 仓库包含 iOS/Capacitor 壳，但 Android 仍需要单独补齐移动壳与输入适配。

MicropolisCore README 的项目历史还明确指出其路线包括 C++/Emscripten/Embind/TypeScript/SvelteKit，并支持浏览器 UI、Node headless 和 WASM 引擎。

## 许可证边界

MicropolisCore 和 micropolisJS 使用 GPL 系列许可，并带有额外的商标/名称条款：

- 代码不能被重新标称为原始 SimCity；修改版本必须标明修改来源；
- 不能使用 SimCity 或 EA 商标暗示官方关联；
- 使用 Micropolis 名称还受 Micropolis Public Name License 约束；
- 如果将 GPL 核心直接打包进浏览器产品，必须评估整个衍生/组合发布物的 GPL 义务、源码提供、版权及许可证文本；
- Ice Snow City 应继续使用自己的名称、视觉资产、地图、建筑名和品牌，不复制 SimCity 的素材、UI、音频或商标。

**因此不能在未确认发布许可证策略前直接把 MicropolisCore 合并进现有项目。** 技术上可以先做隔离原型；正式合并前需要确认项目接受 GPL-3.0 发布义务，或改为基于公开玩法文档进行独立重写。

## 候选项目排除

| 项目 | 结论 | 原因 |
|---|---|---|
| `SimHacker/MicropolisCore` | 首选模拟核心 | 有 WASM、浏览器、TypeScript/SvelteKit、tile renderer；GPL-3.0 + 名称条款 |
| `graememcc/micropolisJS` | 备选/参考 | 直接 JavaScript/HTML5，接入较容易，但同样 GPLv3 + 名称条款，且技术栈较旧 |
| `frodrigo/opencity` | 不作为移动端基础 | C++/OpenGL/SDL 桌面程序，GPL-2.0，非浏览器/手机路线 |
| `lloydsparkes/MicropolisSharp` | 不作为首选 | C# 移植很早期，GPL，Web/Android/iOS 仍是未完成目标 |
| `jonahmakowski-Godot/city_builder` | 仅可作 Godot 参考 | AGPL-3.0，规模小，需切换技术栈 |
| `DiniBis/Godot-City-Builder` | 不采用 | 学生项目，README 未给出明确软件许可证，素材还有独立第三方许可 |
| `dginovker/godot-city-builder-sim` | 不采用 | 无明确许可证，不能直接用于产品 |

## 推荐产品架构

### 阶段 1：先建立真正的城市模拟垂直切片

1. 隔离引入 MicropolisCore 的 WASM 与 tile renderer，不再把当前街景图片当作地图主体。
2. 使用自己的 Ice Snow City 主题图块、建筑图标和 UI；初始只做一张 64×64 或 96×96 城市地图。
3. 实现真实网格操作：道路、住宅、商业、生产、供水、电力、人口、收入、维护费、满意度。
4. 用 MicropolisCore 的 tick/地图/工具/存档能力驱动数值，不再用按钮直接伪造资源变化。
5. 保留 React + tRPC 作为外围：登录、云存档、城市资料、社交数据与后台服务；游戏画布可独立挂载 WASM/Svelte/Canvas 组件。

### 阶段 2：Ice Snow City 自有模式

- **自由建设**：无限期城市规划和经营；
- **冰雪生存场景**：暴雪、供暖、电力和物资压力；
- **目标场景**：在限定预算/人口/时间内完成城市指标；
- **区域扩建**：解锁新地块、跨区道路和公共服务；
- **每日挑战**：固定种子与规则，比较城市结果；
- **访问/社交**：查看好友城市、点赞/留言、城市设计分享、公共工程协作；不复制 SimCity 的网络服务或素材。

### 阶段 3：移动端体验

- 双指缩放、单指拖拽地图、点按格子/建筑；
- 长按显示建筑信息，不再依靠大面积固定卡片；
- 底部工具栏按建设/道路/公共服务/统计分类；
- 资源和警报使用可折叠 HUD；
- 先以 PWA/移动浏览器上线，再评估 Capacitor iOS/Android 壳。

## 当前项目的处理建议

当前 React 2.5D 图片演示组件应降级为临时入口/视觉参考，不再继续添加更多按钮、建筑卡片或图片热点。下一次实现应创建独立的 `client/src/game/simulation/` 适配层，并先验证：

- WASM 能在当前 Vite 构建中加载；
- 真实网格地图可以渲染；
- 放置道路/区域会改变模拟状态；
- tick 后人口、收入、供电或污染等数值发生真实变化；
- 存档与恢复不丢失；
- 移动端点按/拖拽不与 HUD 冲突。

在这些条件通过前，不应声称游戏已具备 SimCity 级可玩性，也不应继续扩展图片场景的装饰功能。
