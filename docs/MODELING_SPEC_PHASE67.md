# 《冰雪城市 (Ice Snow City)》Phase 67: 3D 建模规格与资产导出规范说明书

> **作者**：Manus AI & 美术设计团队  
> **项目**：Ice Snow City GameFi  
> **版本**：v1.0.0  
> **日期**：2026-08-14  

---

## 一、概述与美术 DNA 对齐

在《冰雪城市》(Ice Snow City) 的 3D 生产管线中，所有的 3D 资产必须严格遵循现代冬季城市（Modern Winter City）的美术 DNA。本阶段（Phase 67）聚焦于**玩家角色（Player Character）**与**核心 NPC（Non-Player Characters）**的 3D 建模、多边形面数预算、骨骼绑定（Rigging）与 GLTF/GLB 资产导出规范，确保模型在浏览器端（Babylon.js）既具备高保真的半写实卡通质感，又能维持高效流畅的实时渲染帧率。

下表总结了本阶段各类资产的核心技术指标与多边形预算：

| 资产类别 | 多边形面数预算 (Polygon Budget) | 骨骼数量上限 (Max Bones) | LOD 级别划分 | 默认导出格式 |
| :--- | :--- | :--- | :--- | :--- |
| **玩家角色 (Player)** | 15,000 - 25,000 triangles | 68 根标准人型骨骼 | LOD0 / LOD1 / LOD2 | .glb (含内嵌 PBR 材质) |
| **核心 NPC (NPC)** | 10,000 - 20,000 triangles | 52 根标准人型骨骼 | LOD0 / LOD1 | .glb (支持挂载动作库) |
| **建筑与公共设施 (Buildings)** | 5,000 - 15,000 triangles | N/A (静态网格) | LOD0 / LOD1 | .glb (合并材质批次) |
| **环境与植被 (Environment)** | 800 - 3,500 triangles | N/A (风场顶点动画) | LOD0 / LOD1 | .glb (实例化优化) |

---

## 二、玩家角色 3D 建模与骨骼绑定规范

玩家角色作为游戏中的核心视觉焦点，其 3D 模型需兼顾面部表情形变（Blendshapes/Morph Targets）与现代潮流服饰的层次感：

1. **拓扑结构 (Topology)**：网格布线必须在面部表情关键区（眉毛、眼眶、嘴角）以及关节处（肩膀、肘部、膝盖、手腕）预留足够的循环线（Edge Loops），以保证 8 种面部表情切换与 10 套动作循环时不发生严重的网格拉伸或穿模。
2. **多边形分配**：
   - 头部与面部：占总面数的 35%，重点支持眼、眉、口微表情的动态插值。
   - 服装与穿搭（风衣、羽绒服、西装）：占总面数的 45%，支持下摆飘动与厚重织物法线。
   - 手部与鞋履：占总面数的 20%，保证手指动作与鞋底轮廓清晰。
3. **骨骼与皮肤权重 (Skin Weighting)**：采用标准 Humanoid 骨骼架构，支持与现有 Babylon.js 动作系统无缝对接。所有顶点权重必须归一化，且单顶点受影响骨骼数不超过 4 根，以优化 GPU 蒙皮计算性能。

---

## 三、20 个核心 NPC 3D 模型与职业识别度

根据前期定稿的 20 个现代冬季职业矩阵（护士、教师、柜员、蓝领工人、治安员、学生等），NPC 建模规范强调**“一眼可辨的职业剪影”**：

1. **职业剪影规范**：通过标志性服饰轮廓（如护士的燕帽与修身制服、工人的高反光工装、学生的 JK 裙与双肩包）确保玩家在农场、商业街或车站远距离观察时即可准确识别 NPC 身份。
2. **模型精简策略**：在保证面数控制在 10k-20k 范围内的同时，通过高精度法线贴图（Normal Map）烘焙衣物褶皱、拉链与徽章细节，避免过多的几何面数损耗。

---

## 四、资产导出与浏览器端验证

1. **导出设置**：使用 Blender / Maya 导出为标准 `.glb` 格式，勾选“Compress”、“Apply Modifiers”与“Export Skin Weights”。
2. **浏览器验证**：所有导出的模型必须通过 `CharacterModelViewer.tsx` 的加载管线进行测试，确保冷暖光影、材质反射及 10 套城市生活动作均能正确加载且无内存泄漏。

---

## 五、参考文献

[1] Babylon.js Documentation. *GLTF Loader and PBR Materials Guide*. https://doc.babylonjs.com/  
[2] Khronos Group. *glTF 2.0 Specification*. https://www.khronos.org/gltf/  
[3] Ice Snow City Art Design Team. *Art DNA and High-Fidelity Specifications (Phase 66)*. Internal Project Document, 2026.
