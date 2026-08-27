# SplashScreen 调试记录

## 问题描述
开场动画显示为纯黑屏 + Loading 指示器，背景图像未加载。

## 诊断结果

### ✅ 已验证正常
1. 图片文件存在：`/home/ubuntu/upload/IMG_8183.PNG` (2.4MB)
2. 图片已上传到 S3：`/manus-storage/IMG_8183_0ee665da.PNG`
3. URL 重定向正常：返回 307 重定向到 CloudFront CDN
4. 服务器可访问：`curl -I` 返回 HTTP/2 307

### ❌ 问题所在
1. 浏览器控制台有 React DOM 嵌套错误（GameDashboard 中的 `<p>` 包含 `<div>`）
2. 背景图像在浏览器中未加载（可能是 CORS 或加载超时）
3. 用户认证可能阻塞了 SplashScreen 的隐藏

### 当前 SplashScreen 实现
- 文件：`client/src/components/SplashScreen.tsx`
- 使用 `backgroundImage` CSS 属性加载图片
- 添加了图片预加载逻辑和 Loading 指示器
- 等待用户认证和图片加载后才隐藏

## 可能的解决方案

### 方案 1：使用 `<img>` 标签替代 CSS 背景
```tsx
<img 
  src="/manus-storage/IMG_8183_0ee665da.PNG"
  alt="Opening Animation"
  className="absolute inset-0 w-full h-full object-cover"
/>
```

### 方案 2：检查 CORS 配置
- 确保 CloudFront 允许跨域请求
- 检查服务器 CORS 头配置

### 方案 3：增加加载超时
- 如果图片加载超过 5 秒，自动隐藏 SplashScreen
- 防止用户被卡在加载屏幕

### 方案 4：修复 GameDashboard 的 DOM 嵌套错误
- 这可能导致整个应用的渲染问题
- 需要检查 `client/src/pages/GameDashboard.tsx` 第 74-76 行

## 下一步行动
1. 修复 GameDashboard 的 DOM 嵌套错误
2. 尝试使用 `<img>` 标签替代 CSS 背景
3. 添加加载超时机制
4. 测试不同的网络条件
