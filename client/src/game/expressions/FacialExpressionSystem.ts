/**
 * 面部表情系统
 * 支持 8 种表情动画，通过骨骼变形实现表情变化
 * 
 * 表情类型:
 * 1. 微笑 (Smile) - 嘴角上扬、眼睛眯起
 * 2. 中立 (Neutral) - 无表情、放松的面部
 * 3. 悲伤 (Sad) - 嘴角下垂、眉毛下压
 * 4. 愤怒 (Angry) - 眉毛上扬、嘴角紧绷
 * 5. 惊讶 (Surprised) - 眼睛睁大、嘴巴张开
 * 6. 疲劳 (Tired) - 眼睛半闭、嘴巴微张
 * 7. 思考 (Thinking) - 下巴抬起、眼睛看向一侧
 * 8. 开心 (Happy) - 大笑、眼睛眯起
 */

import * as THREE from 'three';

export type ExpressionType = 
  | 'neutral' 
  | 'smile' 
  | 'sad' 
  | 'angry' 
  | 'surprised' 
  | 'tired' 
  | 'thinking' 
  | 'happy';

export interface ExpressionConfig {
  eyeScale?: number;        // 眼睛缩放 (0-1)
  eyeRotation?: number;     // 眼睛旋转 (弧度)
  mouthScale?: number;      // 嘴巴缩放 (0-1)
  mouthRotation?: number;   // 嘴巴旋转 (弧度)
  browRotation?: number;    // 眉毛旋转 (弧度)
  jawRotation?: number;     // 下巴旋转 (弧度)
  cheekScale?: number;      // 脸颊缩放 (0-1)
  duration?: number;        // 动画时长 (毫秒)
}

export class FacialExpressionSystem {
  private currentExpression: ExpressionType = 'neutral';
  private targetExpression: ExpressionType = 'neutral';
  private animationProgress: number = 0;
  private isAnimating: boolean = false;
  private animationDuration: number = 300; // 毫秒
  private lastAnimationTime: number = 0;

  // 表情配置库
  private expressionConfigs: Map<ExpressionType, ExpressionConfig> = new Map([
    ['neutral', {
      eyeScale: 1.0,
      eyeRotation: 0,
      mouthScale: 1.0,
      mouthRotation: 0,
      browRotation: 0,
      jawRotation: 0,
      cheekScale: 1.0,
    }],
    ['smile', {
      eyeScale: 0.9,        // 眼睛略微缩小 (眯起)
      eyeRotation: 0.1,     // 眼睛略微旋转
      mouthScale: 1.2,      // 嘴巴张开
      mouthRotation: 0.15,  // 嘴角上扬
      browRotation: -0.05,  // 眉毛略微下压
      jawRotation: 0.05,    // 下巴略微下移
      cheekScale: 1.1,      // 脸颊鼓起
    }],
    ['sad', {
      eyeScale: 1.1,        // 眼睛睁大
      eyeRotation: -0.1,    // 眼睛向下看
      mouthScale: 0.8,      // 嘴巴缩小
      mouthRotation: -0.2,  // 嘴角下垂
      browRotation: 0.15,   // 眉毛上扬 (内侧)
      jawRotation: -0.1,    // 下巴上移
      cheekScale: 0.9,      // 脸颊凹陷
    }],
    ['angry', {
      eyeScale: 0.95,       // 眼睛略微缩小
      eyeRotation: -0.15,   // 眼睛向下看
      mouthScale: 0.9,      // 嘴巴紧绷
      mouthRotation: -0.1,  // 嘴角紧绷
      browRotation: 0.25,   // 眉毛上扬 (明显)
      jawRotation: -0.05,   // 下巴紧绷
      cheekScale: 0.95,     // 脸颊紧张
    }],
    ['surprised', {
      eyeScale: 1.3,        // 眼睛睁大 (明显)
      eyeRotation: 0.2,     // 眼睛睁大
      mouthScale: 1.4,      // 嘴巴张大
      mouthRotation: 0.3,   // 嘴巴张大
      browRotation: -0.2,   // 眉毛上扬 (外侧)
      jawRotation: 0.2,     // 下巴下移 (明显)
      cheekScale: 1.05,     // 脸颊略微鼓起
    }],
    ['tired', {
      eyeScale: 0.6,        // 眼睛半闭
      eyeRotation: -0.3,    // 眼睛向下看
      mouthScale: 0.95,     // 嘴巴微张
      mouthRotation: -0.05, // 嘴角略微下垂
      browRotation: 0.1,    // 眉毛略微下压
      jawRotation: 0.08,    // 下巴略微下移
      cheekScale: 0.9,      // 脸颊凹陷
    }],
    ['thinking', {
      eyeScale: 1.0,        // 眼睛正常
      eyeRotation: -0.15,   // 眼睛看向一侧
      mouthScale: 0.9,      // 嘴巴略微闭合
      mouthRotation: 0,     // 嘴巴中立
      browRotation: 0.1,    // 眉毛略微上扬
      jawRotation: 0.1,     // 下巴抬起
      cheekScale: 1.0,      // 脸颊正常
    }],
    ['happy', {
      eyeScale: 0.7,        // 眼睛眯起 (明显)
      eyeRotation: 0.2,     // 眼睛眯起
      mouthScale: 1.3,      // 嘴巴张大
      mouthRotation: 0.25,  // 嘴角上扬 (明显)
      browRotation: -0.1,   // 眉毛下压
      jawRotation: 0.15,    // 下巴下移
      cheekScale: 1.2,      // 脸颊鼓起 (明显)
    }],
  ]);

  // 表情描述
  private expressionDescriptions: Map<ExpressionType, string> = new Map([
    ['neutral', '中立 - 无表情，放松的面部'],
    ['smile', '微笑 - 嘴角上扬、眼睛眯起'],
    ['sad', '悲伤 - 嘴角下垂、眉毛下压'],
    ['angry', '愤怒 - 眉毛上扬、嘴角紧绷'],
    ['surprised', '惊讶 - 眼睛睁大、嘴巴张开'],
    ['tired', '疲劳 - 眼睛半闭、嘴巴微张'],
    ['thinking', '思考 - 下巴抬起、眼睛看向一侧'],
    ['happy', '开心 - 大笑、眼睛眯起'],
  ]);

  // 面部网格和骨骼引用
  private headMesh: THREE.Mesh | null = null;
  private eyeMeshes: THREE.Mesh[] = [];
  private mouthMesh: THREE.Mesh | null = null;
  private browMeshes: THREE.Mesh[] = [];
  private cheekMeshes: THREE.Mesh[] = [];

  // 原始形状数据
  private originalPositions: Map<string, Float32Array> = new Map();

  constructor() {
    this.currentExpression = 'neutral';
    this.targetExpression = 'neutral';
  }

  /**
   * 初始化面部表情系统
   */
  public initialize(headMesh: THREE.Mesh, eyeMeshes: THREE.Mesh[], mouthMesh: THREE.Mesh): void {
    this.headMesh = headMesh;
    this.eyeMeshes = eyeMeshes;
    this.mouthMesh = mouthMesh;

    // 保存原始形状数据
    if (headMesh.geometry) {
      const positionAttribute = headMesh.geometry.getAttribute('position');
      if (positionAttribute) {
        this.originalPositions.set('head', new Float32Array(positionAttribute.array as Float32Array));
      }
    }

    if (mouthMesh && mouthMesh.geometry) {
      const positionAttribute = mouthMesh.geometry.getAttribute('position');
      if (positionAttribute) {
        this.originalPositions.set('mouth', new Float32Array(positionAttribute.array as Float32Array));
      }
    }
  }

  /**
   * 设置表情
   */
  public setExpression(expression: ExpressionType, duration: number = 300): void {
    if (expression === this.currentExpression) return;

    this.targetExpression = expression;
    this.animationDuration = duration;
    this.animationProgress = 0;
    this.isAnimating = true;
    this.lastAnimationTime = Date.now();
  }

  /**
   * 更新表情动画
   */
  public update(): void {
    if (!this.isAnimating) return;

    const now = Date.now();
    const deltaTime = now - this.lastAnimationTime;
    this.lastAnimationTime = now;

    this.animationProgress += deltaTime / this.animationDuration;

    if (this.animationProgress >= 1.0) {
      this.animationProgress = 1.0;
      this.isAnimating = false;
      this.currentExpression = this.targetExpression;
    }

    this.applyExpression(this.animationProgress);
  }

  /**
   * 应用表情变形
   */
  private applyExpression(progress: number): void {
    const currentConfig = this.expressionConfigs.get(this.currentExpression) || this.expressionConfigs.get('neutral')!;
    const targetConfig = this.expressionConfigs.get(this.targetExpression) || this.expressionConfigs.get('neutral')!;

    // 线性插值
    const interpolatedConfig = this.interpolateConfigs(currentConfig, targetConfig, progress);

    // 应用眼睛变形
    this.applyEyeDeformation(interpolatedConfig);

    // 应用嘴巴变形
    this.applyMouthDeformation(interpolatedConfig);

    // 应用脸颊变形
    this.applyCheekDeformation(interpolatedConfig);
  }

  /**
   * 插值表情配置
   */
  private interpolateConfigs(from: ExpressionConfig, to: ExpressionConfig, progress: number): ExpressionConfig {
    return {
      eyeScale: this.lerp(from.eyeScale || 1, to.eyeScale || 1, progress),
      eyeRotation: this.lerp(from.eyeRotation || 0, to.eyeRotation || 0, progress),
      mouthScale: this.lerp(from.mouthScale || 1, to.mouthScale || 1, progress),
      mouthRotation: this.lerp(from.mouthRotation || 0, to.mouthRotation || 0, progress),
      browRotation: this.lerp(from.browRotation || 0, to.browRotation || 0, progress),
      jawRotation: this.lerp(from.jawRotation || 0, to.jawRotation || 0, progress),
      cheekScale: this.lerp(from.cheekScale || 1, to.cheekScale || 1, progress),
    };
  }

  /**
   * 线性插值
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * 应用眼睛变形
   */
  private applyEyeDeformation(config: ExpressionConfig): void {
    this.eyeMeshes.forEach((eye) => {
      // 缩放眼睛
      eye.scale.set(
        config.eyeScale || 1,
        config.eyeScale || 1,
        1
      );

      // 旋转眼睛
      eye.rotation.z = config.eyeRotation || 0;
    });
  }

  /**
   * 应用嘴巴变形
   */
  private applyMouthDeformation(config: ExpressionConfig): void {
    if (!this.mouthMesh) return;

    // 缩放嘴巴
    this.mouthMesh.scale.set(
      config.mouthScale || 1,
      config.mouthScale || 1,
      1
    );

    // 旋转嘴巴
    this.mouthMesh.rotation.z = config.mouthRotation || 0;

    // 应用下巴旋转
    this.mouthMesh.position.y += (config.jawRotation || 0) * 0.1;
  }

  /**
   * 应用脸颊变形
   */
  private applyCheekDeformation(config: ExpressionConfig): void {
    if (!this.headMesh) return;

    // 通过修改头部网格的顶点来实现脸颊变形
    const geometry = this.headMesh.geometry;
    if (!geometry) return;

    const positionAttribute = geometry.getAttribute('position');
    if (!positionAttribute) return;

    const positions = positionAttribute.array as Float32Array;
    const originalPositions = this.originalPositions.get('head');

    if (!originalPositions) return;

    // 脸颊变形 - 修改侧面顶点
    for (let i = 0; i < positions.length; i += 3) {
      const x = originalPositions[i];
      const y = originalPositions[i + 1];
      const z = originalPositions[i + 2];

      // 只修改脸颊区域 (侧面)
      if (Math.abs(x) > 0.15 && y > 0 && y < 0.3) {
        // 脸颊缩放
        positions[i] = x * (config.cheekScale || 1);
      } else {
        positions[i] = x;
      }

      positions[i + 1] = y;
      positions[i + 2] = z;
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  /**
   * 获取当前表情
   */
  public getCurrentExpression(): ExpressionType {
    return this.currentExpression;
  }

  /**
   * 获取目标表情
   */
  public getTargetExpression(): ExpressionType {
    return this.targetExpression;
  }

  /**
   * 获取所有表情类型
   */
  public getAllExpressions(): ExpressionType[] {
    return Array.from(this.expressionConfigs.keys());
  }

  /**
   * 获取表情描述
   */
  public getExpressionDescription(expression: ExpressionType): string {
    return this.expressionDescriptions.get(expression) || '未知表情';
  }

  /**
   * 获取表情配置
   */
  public getExpressionConfig(expression: ExpressionType): ExpressionConfig | undefined {
    return this.expressionConfigs.get(expression);
  }

  /**
   * 是否正在播放动画
   */
  public isPlayingAnimation(): boolean {
    return this.isAnimating;
  }

  /**
   * 获取动画进度 (0-1)
   */
  public getAnimationProgress(): number {
    return this.animationProgress;
  }

  /**
   * 播放随机表情
   */
  public playRandomExpression(): void {
    const expressions = this.getAllExpressions();
    const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
    this.setExpression(randomExpression);
  }

  /**
   * 播放表情序列
   */
  public playExpressionSequence(expressions: ExpressionType[], interval: number = 1000): void {
    let index = 0;

    const playNext = () => {
      if (index < expressions.length) {
        this.setExpression(expressions[index]);
        index++;
        setTimeout(playNext, interval);
      }
    };

    playNext();
  }

  /**
   * 重置表情
   */
  public reset(): void {
    this.currentExpression = 'neutral';
    this.targetExpression = 'neutral';
    this.animationProgress = 0;
    this.isAnimating = false;
    this.applyExpression(1.0);
  }

  /**
   * 销毁系统
   */
  public dispose(): void {
    this.originalPositions.clear();
    this.expressionConfigs.clear();
    this.expressionDescriptions.clear();
    this.eyeMeshes = [];
    this.browMeshes = [];
    this.cheekMeshes = [];
    this.headMesh = null;
    this.mouthMesh = null;
  }
}
