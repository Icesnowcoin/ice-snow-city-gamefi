import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PlayerCharacterModel } from '../game/models/PlayerCharacterModel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

/**
 * 玩家角色 3D 模型查看器
 * 支持实时预览、自定义配置、表情动画播放
 */
export const CharacterModelViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterRef = useRef<PlayerCharacterModel | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 配置状态
  const [skinTone, setSkinTone] = useState('#f4c4a0');
  const [hairColor, setHairColor] = useState('#2c1810');
  const [outfitColor, setOutfitColor] = useState('#2563eb');
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [scale, setScale] = useState(1);
  const [currentExpression, setCurrentExpression] = useState<string>('neutral');
  const [expressionOptions, setExpressionOptions] = useState<string[]>([]);

  // 初始化 Three.js 场景
  useEffect(() => {
    if (!containerRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f9ff);
    scene.fog = new THREE.Fog(0xf0f9ff, 100, 500);
    sceneRef.current = scene;

    // 创建相机
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0.5, 1.5);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 添加灯光
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 主方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    // 补光
    const pointLight = new THREE.PointLight(0xffffff, 0.4);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);

    // 创建地面
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xe5e7eb,
      roughness: 0.8,
    });
    (groundMaterial as any).metallic = 0;
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.8;
    ground.receiveShadow = true;
    scene.add(ground);

    // 创建玩家角色模型
    const character = new PlayerCharacterModel({
      skinTone,
      hairColor,
      outfitColor,
      scale,
      position: new THREE.Vector3(0, 0, 0),
    });
    scene.add(character.getScene());
    characterRef.current = character;

    // 获取表情系统并初始化表情选项
    const expressionSystem = character.getExpressionSystem();
    const expressions = expressionSystem.getAllExpressions();
    setExpressionOptions(expressions);
    setCurrentExpression(expressions[0] || 'neutral');

    // 动画循环
    let lastTime = Date.now();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      // 旋转角色
      if (character.getScene()) {
        character.getScene().rotation.y = rotation;
      }

      // 播放待机动画
      if (isAnimating) {
        character.playIdleAnimation();
      }

      renderer.render(scene, camera);
    };
    animate();

    // 处理窗口大小变化
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // 清理
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      character.dispose();
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // 更新皮肤颜色
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.setSkinTone(skinTone);
    }
  }, [skinTone]);

  // 更新发色
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.setHairColor(hairColor);
    }
  }, [hairColor]);

  // 更新服装颜色
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.setOutfitColor(outfitColor);
    }
  }, [outfitColor]);

  // 更新缩放
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.getScene().scale.multiplyScalar(scale);
    }
  }, [scale]);

  // 更新旋转
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.getScene().rotation.y = rotation;
    }
  }, [rotation]);

  // 更新表情
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.setExpression(currentExpression as any, 300);
    }
  }, [currentExpression]);

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* 标题 */}
      <div className="p-6 border-b border-gray-200 bg-white shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">玩家角色 3D 模型预览</h1>
        <p className="text-gray-600 mt-2">Ice Snow City - 角色定制系统 (支持面部表情)</p>
      </div>

      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* 3D 查看器 */}
        <div className="flex-1 rounded-lg overflow-hidden shadow-lg border border-gray-200">
          <div
            ref={containerRef}
            className="w-full h-full bg-gradient-to-b from-blue-100 to-blue-50"
          />
        </div>

        {/* 控制面板 */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
          {/* 基础信息 */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">模型信息</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">多边形数:</span> ~8,000 (原型)
              </p>
              <p>
                <span className="font-medium">纹理分辨率:</span> 2048×2048
              </p>
              <p>
                <span className="font-medium">骨骼数:</span> 18 (原型)
              </p>
              <p>
                <span className="font-medium">风格:</span> 3D 半写实卡通
              </p>
              <p>
                <span className="font-medium">表情系统:</span> 8 种表情
              </p>
            </div>
          </Card>

          {/* 皮肤颜色 */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">皮肤颜色</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="color"
                value={skinTone}
                onChange={(e) => setSkinTone(e.target.value)}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={skinTone}
                onChange={(e) => setSkinTone(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['#f4c4a0', '#e8b896', '#d4a574', '#c9985c'].map((color) => (
                <button
                  key={color}
                  onClick={() => setSkinTone(color)}
                  className="w-full h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </Card>

          {/* 发色 */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">发色</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="color"
                value={hairColor}
                onChange={(e) => setHairColor(e.target.value)}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={hairColor}
                onChange={(e) => setHairColor(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['#2c1810', '#5c4033', '#8b6f47', '#d4af37'].map((color) => (
                <button
                  key={color}
                  onClick={() => setHairColor(color)}
                  className="w-full h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </Card>

          {/* 服装颜色 */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">服装颜色</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="color"
                value={outfitColor}
                onChange={(e) => setOutfitColor(e.target.value)}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={outfitColor}
                onChange={(e) => setOutfitColor(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['#2563eb', '#dc2626', '#16a34a', '#ea580c'].map((color) => (
                <button
                  key={color}
                  onClick={() => setOutfitColor(color)}
                  className="w-full h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </Card>

          {/* 旋转控制 */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">旋转</h3>
            <Slider
              value={[rotation]}
              onValueChange={(value) => setRotation(value[0])}
              min={0}
              max={Math.PI * 2}
              step={0.01}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              {(rotation * (180 / Math.PI)).toFixed(1)}°
            </p>
          </Card>

          {/* 缩放控制 */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">缩放</h3>
            <Slider
              value={[scale]}
              onValueChange={(value) => setScale(value[0])}
              min={0.5}
              max={2}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">{scale.toFixed(1)}x</p>
          </Card>

          {/* 表情控制 */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">面部表情</h3>
            <div className="space-y-2">
              {expressionOptions.map((expression) => (
                <button
                  key={expression}
                  onClick={() => setCurrentExpression(expression)}
                  className={`w-full px-3 py-2 rounded text-sm font-medium transition ${
                    currentExpression === expression
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  {expression.charAt(0).toUpperCase() + expression.slice(1)}
                </button>
              ))}
            </div>
          </Card>

          {/* 动画控制 */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">动画</h3>
            <Button
              onClick={() => setIsAnimating(!isAnimating)}
              className={`w-full ${
                isAnimating
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-400 hover:bg-gray-500'
              }`}
            >
              {isAnimating ? '⏸ 暂停' : '▶ 播放'}
            </Button>
          </Card>

          {/* 技术规格 */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">技术规格</h2>
            <div className="space-y-1 text-xs text-gray-600">
              <p>✓ PBR 材质系统</p>
              <p>✓ 实时阴影渲染</p>
              <p>✓ 骨骼动画支持</p>
              <p>✓ 面部表情系统</p>
              <p>✓ 高质量光照</p>
              <p>✓ 响应式设计</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CharacterModelViewer;
