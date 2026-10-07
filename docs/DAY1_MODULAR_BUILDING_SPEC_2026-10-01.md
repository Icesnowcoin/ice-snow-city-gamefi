# Ice Snow City Day 1：模块化建筑单位尺寸与模块清单

**版本：** v1.0  
**日期：** 2026-10-01  
**适用范围：** 城市核心、银行、商业中心、生产区、住宅区、公共服务建筑、道路与基础环境  
**资产状态：** 生产规范；不等同于真实 GLB/PBR/LOD 已交付

## 1. 基础坐标与单位

| 项目 | 规范 |
|---|---:|
| Babylon.js 世界单位 | 1 unit = 1 m |
| 建筑拼装主网格 | 2 m |
| 小装饰对齐网格 | 0.5 m |
| 主体墙厚 | 0.25–0.5 m |
| 标准层高 | 3 m |
| 商业首层层高 | 4 m |
| 生产/仓储层高 | 5 m |
| 门洞标准宽度 | 2 m |
| 门洞标准高度 | 2.4 m |
| 车行道路宽度 | 8 m（双向） |
| 人行道宽度 | 2 m |
| 建筑与道路最小退界 | 2 m |
| 玩家碰撞半径参考 | 0.45–0.6 m |

**规则：** 所有模块的原点放在底面中心或左后角，必须在资产 manifest 中记录；建筑主体底面 Y=0，所有碰撞体不得低于地面 0.02 m。

## 2. 地块与建筑等级尺寸

地块尺寸使用 2 m 网格，建筑尺寸包含主体，不包含道路退界。

| 用途 | Lot 尺寸 | Lv.1 主体 | Lv.2 主体 | Lv.3 主体 | 建议高度 |
|---|---:|---:|---:|---:|---:|
| 城市核心 | 48×48 m | 32×32 m | 40×40 m | 48×48 m | 22/28/34 m |
| 银行总部 | 32×28 m | 24×18 m | 28×22 m | 32×26 m | 16/20/24 m |
| 商业中心 | 40×32 m | 28×22 m | 34×26 m | 38×30 m | 10/13/16 m |
| 生产中心 | 40×32 m | 28×20 m | 34×26 m | 38×30 m | 12/16/20 m |
| 物流枢纽 | 32×24 m | 24×16 m | 28×20 m | 30×22 m | 8/10/12 m |
| 住宅小屋 | 16×16 m | 12×10 m | 14×12 m | 16×14 m | 6/8/10 m |
| 公寓楼 | 24×20 m | 18×14 m | 22×18 m | 24×20 m | 9/12/15 m |
| 住宅服务中心 | 32×24 m | 24×18 m | 28×20 m | 30×22 m | 10/13/16 m |
| 任务大厅 | 28×24 m | 20×16 m | 24×20 m | 26×22 m | 9/12/15 m |
| 公共服务建筑 | 32×28 m | 24×18 m | 28×22 m | 32×26 m | 10/14/18 m |
| 温室/农业站 | 24×20 m | 18×14 m | 22×18 m | 24×20 m | 7/9/11 m |

**与当前程序化地标的关系：** 当前 `LandmarkManager` 中的 48×48 城市核心、银行、商业和生产区坐标可继续作为世界布局锚点；后续正式模块应优先套入上表 Lot，而不是修改交互 ID。

## 3. 建筑模块清单

### 3.1 主体结构模块

| 模块 ID | 尺寸（m） | 用途 | LOD0 预算 |
|---|---:|---|---:|
| `bld_wall_2x3` | 2×0.3×3 | 标准墙段 | 80 tris |
| `bld_wall_4x3` | 4×0.3×3 | 长墙段 | 120 tris |
| `bld_wall_window_4x3` | 4×0.3×3 | 窗墙段 | 180 tris |
| `bld_wall_glass_4x3` | 4×0.2×3 | 玻璃幕墙 | 160 tris |
| `bld_corner_2x2x3` | 2×2×3 | 外墙转角 | 160 tris |
| `bld_pillar_1x1x3` | 1×1×3 | 结构柱 | 80 tris |
| `bld_floor_4x4` | 4×0.25×4 | 楼板/平台 | 60 tris |
| `bld_roof_flat_4x4` | 4×0.4×4 | 平屋顶 | 80 tris |
| `bld_roof_snow_4x4` | 4×0.6×4 | 积雪屋顶 | 140 tris |
| `bld_roof_crystal_4x4` | 4×1.5×4 | 冰晶屋顶 | 260 tris |
| `bld_canopy_4x2` | 4×0.25×2 | 入口雨棚 | 100 tris |
| `bld_stair_2x4` | 2×1.5×4 | 台阶 | 120 tris |

### 3.2 入口、窗户和功能模块

| 模块 ID | 尺寸（m） | 用途 | LOD0 预算 |
|---|---:|---|---:|
| `bld_door_single_2x2_4` | 2×0.2×2.4 | 单入口 | 180 tris |
| `bld_door_double_4x2_4` | 4×0.2×2.4 | 地标主入口 | 260 tris |
| `bld_window_strip_4x1_8` | 4×0.15×1.8 | 标准窗带 | 180 tris |
| `bld_window_corner_2x2` | 2×0.15×2 | 转角窗 | 220 tris |
| `bld_shopfront_4x3` | 4×0.25×3 | 商业门面 | 260 tris |
| `bld_bank_portal_6x5` | 6×0.4×5 | 银行入口门廊 | 480 tris |
| `bld_factory_gate_6x5` | 6×0.3×5 | 生产区大门 | 360 tris |
| `bld_loading_dock_8x2` | 8×1.2×2 | 物流装卸台 | 220 tris |
| `bld_rooftop_unit_2x2x2` | 2×2×2 | 屋顶设备 | 160 tris |
| `bld_chimney_1x1x3` | 1×1×3 | 生产烟囱 | 120 tris |

### 3.3 冰雪城市识别模块

| 模块 ID | 尺寸（m） | 用途 | LOD0 预算 |
|---|---:|---|---:|
| `ice_crystal_pylon_2x2x8` | 2×2×8 | 城市核心副塔 | 320 tris |
| `ice_energy_ring_d10` | 外径 10 m | 核心能量环 | 480 tris |
| `ice_energy_ring_d18` | 外径 18 m | 核心中环 | 640 tris |
| `ice_energy_ring_d26` | 外径 26 m | 核心外环 | 800 tris |
| `ice_snow_cap_4x4` | 4×0.8×4 | 建筑积雪边缘 | 160 tris |
| `ice_facade_panel_2x3` | 2×0.15×3 | 冰晶立面板 | 220 tris |
| `ice_light_strip_4x0_2` | 4×0.08×0.2 | 发光灯带 | 40 tris |
| `ice_sign_gold_4x1` | 4×0.1×1 | 金色功能标识 | 100 tris |
| `ice_roof_spire_2x2x6` | 2×2×6 | 地标尖顶 | 280 tris |
| `ice_snow_bank_4x2x1` | 4×2×1 | 雪堆/边界 | 120 tris |

### 3.4 道路、公共空间与环境模块

| 模块 ID | 尺寸（m） | 用途 | LOD0 预算 |
|---|---:|---|---:|
| `road_straight_8x8` | 8×0.2×8 | 双向道路 | 40 tris |
| `road_corner_8x8` | 8×0.2×8 | 转弯道路 | 80 tris |
| `sidewalk_2x8` | 2×0.2×8 | 人行道 | 40 tris |
| `road_crossing_8x4` | 8×0.2×4 | 斑马线 | 40 tris |
| `street_lamp_1x1x5` | 1×1×5 | 路灯 | 180 tris |
| `street_sign_1x0_3x2` | 1×0.3×2 | 指示牌 | 100 tris |
| `snow_fence_4x1x1` | 4×0.2×1 | 雪地围栏 | 100 tris |
| `bench_2x0_6x0_8` | 2×0.6×0.8 | 长椅 | 140 tris |
| `planter_2x1x0_8` | 2×1×0.8 | 花箱 | 100 tris |
| `tree_snow_small_3x3x5` | 3×3×5 | 小型雪树 | 320 tris |
| `tree_snow_large_6x6x10` | 6×6×10 | 大型雪树 | 640 tris |
| `water_channel_4x8` | 4×0.15×8 | 农业水渠 | 60 tris |

## 4. 模块组合配方

### 城市核心

```text
1 × 32×32 base plaza
1 × 16×16 crystal tower footprint
3 × energy ring
4 × crystal pylon
4–8 × snow cap
4 × gold sign/light strip
1 × double entrance
```

目标是形成“中央冰晶塔 + 三层能源环 + 四角副塔 + 雪白高台广场”的固定轮廓。城市核心是唯一允许使用较强发光和较高装饰密度的首屏英雄建筑。

### 银行总部

```text
24 × wall/window modules
4 × corner modules
1 × bank portal
2 × gold sign
1 × roof crystal or roof spire
4 × snow cap
```

视觉关键词：深蓝石材、金色入口、对称门廊、低频暖光。

### 商业中心

```text
32 × shopfront/window modules
8 × canopy modules
2 × sign modules
4 × facade crystal panels
8 × snow cap
```

视觉关键词：冰蓝玻璃、暖橙店招、连续橱窗、较高人流可读性。

### 生产中心

```text
20 × wall modules
4 × factory gate
2 × loading dock
2 × chimney or rooftop unit
4 × energy light strip
6 × snow bank
```

视觉关键词：青绿色功能色、深色金属、可见管线、稳定的生产灯效。

## 5. 材质槽与 PBR 约束

每个建筑正式 GLB 最多建议 6 个材质槽：

1. `mat_snow_white`：Base Color #F8F9FA，Metallic 0.0–0.05，Roughness 0.65–0.85
2. `mat_ice_blue`：Base Color #8CEBFF，Metallic 0.25–0.55，Roughness 0.18–0.35
3. `mat_deep_blue`：Base Color #0F3460，Metallic 0.15–0.35，Roughness 0.4–0.6
4. `mat_gold_accent`：Base Color #FFD700，Metallic 0.7–0.9，Roughness 0.2–0.35
5. `mat_dark_metal`：Base Color #26384A，Metallic 0.65–0.9，Roughness 0.25–0.45
6. `mat_emissive_energy`：Emissive #38D9FF 或 #FFB84D，强度由场景质量档位控制

纹理建议：建筑 2048² 起步，城市核心英雄资产允许使用 4096² 源文件，但移动端交付档默认压缩到 2048²；使用 ORM/Metallic-Roughness 打包，避免不必要的独立纹理采样。

## 6. LOD、碰撞和性能预算

### 建筑资产

| 级别 | 建议三角形数 | 材质槽 | 纹理档位 | 用途 |
|---|---:|---:|---:|---|
| LOD0 | 5k–15k | ≤6 | 2k–4k 源 | 0–35 m |
| LOD1 | 2.5k–7k | ≤4 | 2k | 35–100 m |
| LOD2 | 0.8k–2.5k | ≤2 | 1k | 100–250 m |
| LOD3/远景 | 2D/低模 | 1 | 512–1k | 250 m+ |

### 碰撞

- 建筑碰撞使用独立 `*_collision` 节点，不复用高模网格。
- 外部建筑碰撞体建议 1–8 个简单盒体/凸包。
- 单栋建筑碰撞三角形目标 ≤255 tris。
- 窗户、灯带、雪帽和装饰环默认不参与碰撞。
- 交互命中使用稳定根节点和简化点击体，避免点击到装饰子网格后 ID 不一致。

### 场景级预算

- 同屏近景高模建筑：最多 2–3 栋。
- 同屏可见建筑总数：建议 ≤24 栋。
- 同屏动态灯效：建议 ≤32 个发光节点。
- 重复模块优先实例化。
- 低端质量档关闭远景副塔细节、降低能量环更新频率和纹理分辨率。

## 7. 命名与目录规范

```text
art_assets/buildings/modular/v001/
├── modules/
│   ├── bld_wall_4x3.glb
│   ├── ice_energy_ring_d18.glb
│   └── street_lamp_1x1x5.glb
├── landmarks/
│   ├── landmark-city-core_lod0.glb
│   ├── landmark-city-core_lod1.glb
│   ├── landmark-city-core_lod2.glb
│   └── landmark-city-core_collision.glb
├── textures/
├── previews/
└── manifest.json
```

命名格式：`<domain>_<function>_<width>x<depth>x<height>[_variant]`。正式地标使用 canonical Asset ID，例如 `landmark-city-core`，不能使用只描述外观的临时名称替代。

## 8. Day 1 验收清单

- [ ] 所有尺寸均落在 2 m 主网格上
- [ ] 所有模块都有原点、尺寸、用途和三角形预算
- [ ] 建筑主体、装饰、碰撞体分离
- [ ] 城市核心、银行、商业、生产四类配方已确定
- [ ] 材质槽不超过 6 个
- [ ] LOD0/LOD1/LOD2/远景策略已确定
- [ ] 模块不包含不可逆的第三方授权内容
- [ ] 文档完成不代表真实 GLB/PBR/LOD 门禁完成

## 9. 下一步

1. 用本清单制作 `modules/` 第一批 12 个灰盒模块；
2. 在 Babylon.js 中拼装城市核心 Lv.1；
3. 对拼装结果执行点击、碰撞、LOD 和截图验证；
4. 再将灰盒模块替换为正式建模/PBR 资产；
5. 真实文件交付后执行 `pnpm validate:external-delivery`，未通过前保持 `external-pending`。
