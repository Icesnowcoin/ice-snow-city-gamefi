# GameHub Babylon.js 3D 地图接入记录

## 已完成

GameHub 的 `scenes` 与 `scene` 标签现在挂载 `AgriculturalMapViewer`，不再渲染 `PlayableGameScene` 的 Canvas 2D 城市原型。GameHub 的资产、收益、一键领取、商城、背包和底部导航仍由原有 React 层维护，3D 地图作为场景画布嵌入其中。

`AgriculturalMapViewer` 增加 `embedded` 模式：在 GameHub 内使用受控高度、圆角容器和 `touch-none` 画布，隐藏独立页面头尾栏，避免嵌套全屏布局。其 Babylon 引擎仍负责地面、建筑、植被、光照、天空盒、地图交互和小地图初始化。

## 生命周期安全

小地图更新定时器现在在卸载时清理，避免切换 GameHub 标签后继续更新已销毁的组件。Babylon 引擎原有窗口 resize 监听仍由引擎实例使用；后续生产化应继续把监听函数改为可移除的实例回调，并补充 React StrictMode 异步初始化取消标记。

为了规避当前预览环境在开发热更新期间对 GameHub 动态模块的加载失败，GameHub 已从 lazy import 改为静态导入。生产构建已通过，但 Babylon 全量依赖使主入口包体显著增大，后续应拆分 Babylon 场景包或采用稳定的异步预加载策略。

## 验证结果与边界

`GameHub.test.tsx` 与 `Minimap.test.ts` 共 28 项通过；TypeScript 检查和生产构建通过。完整测试运行中有 1 个与本次改动无关的既有 `server/game-logic/gameScenes.test.ts` 随机失败，单独重跑该文件 33 项全部通过，表明它更可能是全量运行中的非确定性问题。

浏览器预览曾出现动态模块加载失败和随后临时请求限流，因此本次无法把新的 Babylon 画面截图作为最终证据。代码和本地构建确认挂载关系已成立；待预览限流恢复后，应再次确认：GameHub 进入后显示 3D 地面/建筑/植被，加载失败显示错误层，点击 3D 对象能打开对象信息面板，移动横屏下画布尺寸和触控相机均正常。

## 未完成门禁

真实 GLB/PBR 资产尚未接入；当前农业地图仍以程序化网格为主。`AgriculturalMapViewer` 的界面文案和交互仍保留部分鼠标表述，需要替换为触控/双指操作说明。主入口 HUD 在窄屏上可能遮挡部分 3D 画布，需使用真实 iOS/Android 横屏设备进一步校验。
