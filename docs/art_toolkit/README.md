# Ice Snow City Art Toolkit

本目录是 Ice Snow City 的美术生产入口。推荐流程是：先填写角色或建筑资产卡，再创建 manifest 条目，导出 GLB/纹理/动画，运行项目内的 assetReadiness、textureOptimization 和 animationExportValidation 门禁，最后提交截图、性能报告和授权记录进行评审。

## 参考图板

| 主题 | 地址 |
|---|---|
| 总体艺术方向 | `/manus-storage/ice-snow-city-art-direction-board_f8f6b8ee.png` |
| 角色与 NPC | `/manus-storage/ice-snow-city-character-sheet_504645ab.png` |
| 建筑 | `/manus-storage/ice-snow-city-building-sheet_71d43ad7.png` |
| 环境 | `/manus-storage/ice-snow-city-environment-sheet_32eca047.png` |
| UI | `/manus-storage/ice-snow-city-ui-sheet_df5a6eef.png` |

这些图片是概念参考，不是可直接运行的游戏资产。正式运行资源必须经过真实文件加载、材质、LOD、碰撞体、动画和性能验证。

## 交付顺序

1. 使用 `CHARACTER_DESIGN_CARD_TEMPLATE.md` 或 `BUILDING_ENVIRONMENT_ASSET_TEMPLATE.md` 完成设计卡。
2. 依照命名规范导出 glTF 2.0/GLB、KTX2/WebP 纹理和动画文件。
3. 更新 `asset_production_manifest.json`，状态先使用 `catalogued` 或 `pending-import`。
4. 将资产放入项目指定的外部资产存储，不把大文件提交到 `client/public`。
5. 运行项目门禁并提交结果；只有所有阻塞项清零后才能使用 `verified`。

## 禁止事项

不能使用概念图冒充 GLB，不能用 openId 或未经签名验证的钱包地址推断资产归属，不能把程序化回退标记成高保真资产，不能在美术资产中加入未经批准的品牌文字或变形 ISC Logo，也不能把武器、铠甲和战斗元素作为城市商业主视觉。
