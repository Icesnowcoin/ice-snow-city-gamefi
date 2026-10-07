# GLB 运行时接入契约

## 适用范围

本契约用于 Ice Snow City 后续接入真实玩家、NPC、建筑和环境 GLB/PBR 资产。当前仓库仍使用程序化占位模型；本文档不宣称已有真实美术文件、真实设备验收或动画资产验收。

## 加载入口

`BabylonGameEngine.loadModel(url, name, position, options)` 是统一入口。`url` 必须来自项目静态资源上传后的稳定 URL，不能把本地路径或未经授权的远程地址直接写入生产代码。加载完成后，入口会选择无父节点的根网格，设置稳定名称和位置，并发送一次 `percent: 100` 的完成进度。

```ts
const controller = new AbortController();
const root = await engine.loadModel(assetUrl, "npc-quest-officer", new BABYLON.Vector3(12, 0, -8), {
  signal: controller.signal,
  onProgress: ({ loaded, total, percent }) => {
    setAssetProgress(percent ?? (total > 0 ? (loaded / total) * 100 : null));
  },
});

// 组件卸载或场景切换时：
engine.disposeLoadedModel(root);
```

## 生命周期与错误边界

如果请求在开始前已经取消，加载器会抛出 `AbortError`，不会触发 Babylon 的导入调用。导入完成后若没有可渲染根网格，加载器会抛出带有资源 URL 的错误；若取消发生在导入返回后，已创建的网格会先清理，再抛出 `AbortError`。调用方必须在 React effect cleanup、场景切换和错误回退路径中释放返回的根节点。

## 进度与移动端 UI

`lengthComputable` 为 `false` 时，`percent` 为 `null`，UI 应显示不确定进度而不是伪造百分比。移动横屏加载界面建议使用短标题、百分比或“正在加载资产”文案、取消/重试入口，并保留 `aria-live` 状态。进度仅表示文件传输，不表示骨骼绑定、材质编译或纹理上传已完成。

## 资产验收仍需外部完成

真实资产交付后仍需逐项验证：GLB 可解析、PBR 贴图色彩空间正确、骨骼数量与动画帧率符合规格、碰撞体和 LOD 存在、移动端纹理尺寸受控、真实 iOS/Android WebGL 渲染无异常。当前 NullEngine 测试只验证 API 契约，不能替代真实设备验收。
