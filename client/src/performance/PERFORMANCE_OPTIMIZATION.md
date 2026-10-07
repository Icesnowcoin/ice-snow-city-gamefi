# 性能优化指南

## 当前性能基准

### Three.js 渲染性能
- **目标 FPS**: 60 FPS (移动端 30-45 FPS)
- **目标加载时间**: < 3 秒
- **目标内存占用**: < 200 MB (移动端 < 100 MB)

### React 组件性能
- **目标首屏加载**: < 2 秒
- **目标交互响应**: < 100 ms
- **目标重新渲染**: < 16 ms (60 FPS)

## 优化策略

### 1. Three.js 渲染优化

#### 几何体优化
```typescript
// 使用 BufferGeometry 而不是 Geometry
const geometry = new THREE.BufferGeometry();

// 共享材质
const sharedMaterial = new THREE.MeshStandardMaterial({ ... });

// 使用 LOD (Level of Detail)
const lod = new THREE.LOD();
lod.addLevel(highDetail, 0);
lod.addLevel(mediumDetail, 10);
lod.addLevel(lowDetail, 50);
```

#### 渲染优化
```typescript
// 启用视锥剔除 (Frustum Culling)
renderer.sortObjects = true;

// 使用 InstancedMesh 渲染相同对象
const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

// 禁用不必要的阴影
light.castShadow = true;
light.shadow.mapSize.width = 1024; // 降低分辨率
light.shadow.mapSize.height = 1024;

// 使用 WebGL 扩展
renderer.extensions.get('EXT_texture_compression_s3tc');
```

#### 纹理优化
```typescript
// 使用压缩纹理
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('texture.jpg');
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;

// 纹理尺寸优化
// 使用 2^n 尺寸 (512, 1024, 2048)
// 避免过大纹理 (> 4096)
```

### 2. React 组件优化

#### 代码分割
```typescript
// 使用 React.lazy 进行路由级代码分割
const CharacterModelViewer = React.lazy(() => 
  import('../pages/CharacterModelViewer')
);

// 使用 Suspense 处理加载状态
<Suspense fallback={<LoadingSpinner />}>
  <CharacterModelViewer />
</Suspense>
```

#### 组件记忆化
```typescript
// 使用 useMemo 缓存计算结果
const memoizedValue = useMemo(() => {
  return expensiveCalculation(a, b);
}, [a, b]);

// 使用 useCallback 缓存函数
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// 使用 React.memo 避免不必要的重新渲染
export const MemoizedComponent = React.memo(Component);
```

#### 列表优化
```typescript
// 使用虚拟化列表 (react-window)
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={35}
  width="100%"
>
  {Row}
</FixedSizeList>
```

### 3. 网络优化

#### 资源加载
```typescript
// 使用 WebP 格式图片
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="..." />
</picture>

// 使用 CDN 加速
// 启用 HTTP/2 推送
// 使用 gzip 压缩
```

#### 数据加载
```typescript
// 使用分页加载
const { data, hasMore, loadMore } = usePaginatedQuery(query, {
  pageSize: 20,
});

// 使用缓存策略
const cachedData = useMemo(() => {
  return processData(rawData);
}, [rawData]);
```

### 4. 内存优化

#### 对象池
```typescript
class ObjectPool {
  private pool: THREE.Mesh[] = [];
  private factory: () => THREE.Mesh;

  constructor(factory: () => THREE.Mesh, initialSize: number) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): THREE.Mesh {
    return this.pool.pop() || this.factory();
  }

  release(mesh: THREE.Mesh): void {
    mesh.visible = false;
    this.pool.push(mesh);
  }
}
```

#### 事件监听清理
```typescript
useEffect(() => {
  const handleResize = () => {
    // 处理
  };

  window.addEventListener('resize', handleResize);

  // 清理函数
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### 5. 动画优化

#### 使用 requestAnimationFrame
```typescript
let animationFrameId: number;

const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  // 更新逻辑
  renderer.render(scene, camera);
};

animate();

// 清理
return () => {
  cancelAnimationFrame(animationFrameId);
};
```

#### 使用 CSS 动画
```css
/* 使用 transform 和 opacity 进行 GPU 加速 */
.animated {
  animation: slide 0.3s ease-out;
  will-change: transform;
}

@keyframes slide {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## 性能监控

### 使用 Performance API
```typescript
// 标记性能时间点
performance.mark('component-start');

// 执行操作

performance.mark('component-end');
performance.measure('component', 'component-start', 'component-end');

// 获取测量结果
const measures = performance.getEntriesByName('component');
console.log(measures[0].duration);
```

### 使用 Chrome DevTools
1. **Performance 标签**: 记录运行时性能
2. **Lighthouse**: 审计页面性能
3. **Network 标签**: 分析网络加载
4. **Memory 标签**: 检查内存泄漏

## 优化检查清单

- [ ] 使用 BufferGeometry 而不是 Geometry
- [ ] 启用视锥剔除
- [ ] 使用 LOD 系统
- [ ] 压缩纹理和模型
- [ ] 使用对象池管理内存
- [ ] 实现代码分割
- [ ] 使用 React.memo 和 useMemo
- [ ] 实现虚拟化列表
- [ ] 使用 CDN 加速资源
- [ ] 启用 gzip 压缩
- [ ] 清理事件监听器
- [ ] 使用 requestAnimationFrame
- [ ] 监控性能指标
- [ ] 测试移动设备性能
- [ ] 优化首屏加载时间

## 性能目标

| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 首屏加载 | < 2s | - | ⏳ |
| 首次交互 | < 3s | - | ⏳ |
| 最大内容绘制 | < 2.5s | - | ⏳ |
| 累积布局偏移 | < 0.1 | - | ⏳ |
| 帧率 | 60 FPS | - | ⏳ |
| 内存占用 | < 200 MB | - | ⏳ |

## 参考资源

- [Three.js 性能优化](https://threejs.org/docs/index.html#manual/en/introduction/How-to-dispose-of-objects)
- [React 性能优化](https://react.dev/reference/react/useMemo)
- [Web 性能最佳实践](https://web.dev/performance/)
- [Chrome DevTools 性能分析](https://developer.chrome.com/docs/devtools/performance/)
