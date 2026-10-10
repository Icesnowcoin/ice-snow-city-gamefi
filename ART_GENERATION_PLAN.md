# 冰雪城市游戏 - 美术资源生成计划

## 概述

使用 Manus AI 图像生成工具快速创建游戏所需的美术资源，包括场景、角色、UI、建筑等。

---

## 第一阶段：核心场景美术 (优先级 P0)

### 1. 冰雪城市主场景

**描述：** 现代化的冰雪主题城市，融合真实城市元素和冬季美学

**生成提示词：**
```
A modern ice snow city with futuristic architecture, snow-covered buildings, 
frozen streets, aurora borealis in the sky, cyberpunk aesthetic mixed with 
winter wonderland, isometric view, game art style, bright cyan and white colors
```

**输出规格：** 1920×1080 PNG
**用途：** 游戏主场景背景、宣传图

### 2. 城市街道场景

**描述：** 繁忙的街道，NPC 活动，商店、银行、市政厅等建筑

**生成提示词：**
```
Isometric city street scene, modern buildings with snow, shops and banks, 
NPCs walking, street lamps, game art style, winter theme, bright lighting, 
detailed textures, cyberpunk meets cozy aesthetic
```

**输出规格：** 2048×2048 PNG
**用途：** 游戏主场景

### 3. 农场场景

**描述：** 冬季农场，雪地、田地、农舍、温室

**生成提示词：**
```
Snowy farm scene, isometric view, frozen fields, farmhouse, greenhouse, 
snow-covered crops, winter aesthetic, game art style, bright cyan lighting, 
detailed farm equipment
```

**输出规格：** 2048×2048 PNG
**用途：** 农业系统场景

### 4. 房地产场景

**描述：** 现代住宅区，各种风格的房屋

**生成提示词：**
```
Modern residential area in snow, isometric view, various house styles, 
luxury villas, apartments, snow-covered gardens, winter landscape, 
game art style, bright cyan and white colors
```

**输出规格：** 2048×2048 PNG
**用途：** 房地产系统场景

---

## 第二阶段：角色美术 (优先级 P0)

### 1. 玩家角色（5 个变体）

**描述：** 玩家可选的角色形象，现代风格，冬季装扮

**生成提示词（示例 1 - 商人）：**
```
Isometric character design, modern businessman in winter clothes, 
snow-covered suit, professional appearance, friendly expression, 
game art style, cyan and white color scheme, full body view, 
standing pose, detailed clothing
```

**生成提示词（示例 2 - 农民）：**
```
Isometric character design, modern farmer in winter outfit, 
warm clothing, friendly expression, game art style, 
cyan and white colors, full body view, holding farming tools
```

**其他变体：** 工人、医生、工程师

**输出规格：** 512×512 PNG（每个角色）
**用途：** 角色选择、玩家头像

### 2. NPC 角色（20 个代表性 NPC）

**描述：** 不同职业、年龄、性别的 NPC 角色

**生成提示词（示例 - 年长的商人）：**
```
Isometric NPC character design, elderly businessman, winter clothes, 
wise expression, game art style, cyan and white colors, full body view, 
standing pose, detailed clothing and accessories
```

**输出规格：** 512×512 PNG（每个 NPC）
**用途：** NPC 头像、交互界面

---

## 第三阶段：建筑美术 (优先级 P1)

### 1. 核心建筑（6 种）

| 建筑 | 描述 | 生成提示词 |
|------|------|---------|
| **房屋** | 现代住宅 | `Isometric house design, modern architecture, snow-covered roof, winter aesthetic, game art style, cyan and white` |
| **农舍** | 农业建筑 | `Isometric farmhouse, rustic design, snow-covered, winter farm, game art style` |
| **商店** | 零售商店 | `Isometric shop building, modern storefront, snow-covered, winter decoration, game art style` |
| **银行** | 金融机构 | `Isometric bank building, modern architecture, secure appearance, snow-covered, game art style` |
| **工厂** | 生产设施 | `Isometric factory building, industrial design, snow-covered, game art style` |
| **市政厅** | 政府建筑 | `Isometric town hall, grand architecture, snow-covered, winter aesthetic, game art style` |

**输出规格：** 512×512 PNG（每个建筑）
**用途：** RTS 游戏引擎场景

---

## 第四阶段：UI 美术资源 (优先级 P1)

### 1. 图标集（30+ 个）

**类别：**
- 职业图标（商人、农民、工人、医生、工程师、艺术家）
- 消费品图标（食物、饮料、娱乐、医疗）
- 系统图标（钱包、银行、任务、商城、房地产、农业）
- 状态图标（饥饿、口渴、疲劳、幸福、健康）

**生成提示词（示例 - 商人图标）：**
```
Isometric icon design, merchant profession symbol, briefcase and money, 
game art style, cyan and white colors, 256x256 pixel, transparent background, 
simple and clear design
```

**输出规格：** 256×256 PNG（每个图标）
**用途：** UI 界面、菜单、HUD

### 2. 按钮和面板

**生成提示词：**
```
Game UI button design, modern style, cyan and white gradient, 
snow texture, rounded corners, glowing effect, game art style, 
512x128 pixel, transparent background
```

**输出规格：** 512×128 PNG
**用途：** UI 交互元素

---

## 第五阶段：道具和物品 (优先级 P2)

### 1. 消费品图标（15 个）

**包括：** 面包、米饭、肉类、水、果汁、咖啡、电影票、游戏、音乐会、药物等

**生成提示词（示例 - 面包）：**
```
Isometric food icon, bread design, game art style, cyan and white colors, 
256x256 pixel, transparent background, appetizing appearance
```

**输出规格：** 256×256 PNG（每个物品）
**用途：** 消费系统、商城

### 2. 装饰品和配件

**包括：** 衣服、帽子、眼镜、珠宝等

**生成提示词：**
```
Isometric accessory design, winter fashion item, game art style, 
cyan and white colors, 256x256 pixel, transparent background
```

---

## 第六阶段：动画和特效 (优先级 P2)

### 1. 角色动画

**需要生成的动画帧：**
- 行走（4 帧）
- 工作（4 帧）
- 交互（3 帧）
- 庆祝（3 帧）

**生成提示词：**
```
Isometric character animation frame, walking pose, modern businessman, 
winter clothes, game art style, cyan and white colors, 512x512 pixel
```

### 2. 特效

**包括：** 金币掉落、经验获得、升级闪光、交易成功等

**生成提示词：**
```
Game particle effect, gold coin falling, glowing effect, cyan and white colors, 
game art style, transparent background, 256x256 pixel
```

---

## 美术资源清单

| 类别 | 数量 | 优先级 | 预计生成时间 |
|------|------|--------|-----------|
| **场景** | 4 | P0 | 30 分钟 |
| **玩家角色** | 5 | P0 | 20 分钟 |
| **NPC 角色** | 20 | P0 | 60 分钟 |
| **建筑** | 6 | P1 | 20 分钟 |
| **UI 图标** | 30+ | P1 | 45 分钟 |
| **消费品** | 15 | P2 | 30 分钟 |
| **装饰品** | 10 | P2 | 20 分钟 |
| **动画帧** | 14 | P2 | 40 分钟 |
| **特效** | 5 | P2 | 15 分钟 |
| **总计** | **105+** | - | **4-5 小时** |

---

## 生成工作流程

### 步骤 1：准备提示词库
- 为每个美术资源编写详细的生成提示词
- 确保风格一致性（冰雪主题 + 现代城市 + 游戏美术风格）
- 使用统一的颜色方案（青色和白色为主）

### 步骤 2：批量生成 P0 资源
- 生成 4 个场景
- 生成 5 个玩家角色
- 生成 20 个 NPC 角色
- **预计时间：** 2 小时

### 步骤 3：集成到游戏
- 将生成的图像导入到项目中
- 上传到 S3 存储
- 在 UI 中引用这些资源

### 步骤 4：质量检查和调整
- 检查风格一致性
- 调整颜色和细节
- 如需要，重新生成不满意的资源

### 步骤 5：生成 P1 和 P2 资源
- 继续生成建筑、图标、消费品等
- 根据游戏开发进度逐步集成

---

## 风格指南

### 颜色方案
- **主色：** 青色（#00BFFF）
- **辅助色：** 白色（#FFFFFF）
- **强调色：** 深蓝色（#0047AB）
- **背景：** 深灰色（#1A1A1A）

### 视觉风格
- **视角：** 等距视图（Isometric）
- **风格：** 现代游戏美术
- **主题：** 冰雪城市 + 现代城市 + 赛博朋克
- **质感：** 光滑、现代、科技感

### 设计原则
- 简洁清晰，易于识别
- 色彩鲜艳，对比度高
- 细节丰富但不过度
- 风格统一，保持连贯性

---

## 资源存储和管理

### 存储位置
```
/home/ubuntu/webdev-static-assets/
├── scenes/          # 场景美术
├── characters/      # 角色美术
├── buildings/       # 建筑美术
├── ui/              # UI 资源
├── items/           # 物品图标
├── effects/         # 特效
└── animations/      # 动画帧
```

### 命名规范
```
{category}_{name}_{variant}.png

示例：
- scene_city_main.png
- character_merchant_01.png
- building_house_01.png
- icon_merchant.png
- item_bread.png
- effect_coin_fall.png
```

### 上传到 S3
```bash
manus-upload-file --webdev /home/ubuntu/webdev-static-assets/*/*.png
```

---

## 下一步行动

1. **立即生成 P0 资源**（场景 + 角色）
2. **集成到游戏中**
3. **进行美术审核**
4. **根据反馈调整**
5. **继续生成 P1 和 P2 资源**

---

## 预期成果

完成此计划后，冰雪城市游戏将拥有：
- ✅ 一致的视觉风格
- ✅ 专业的美术资源
- ✅ 完整的 UI 系统
- ✅ 沉浸式的游戏体验
- ✅ 可扩展的美术库
