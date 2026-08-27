import React, { useEffect, useRef, useState } from 'react';
import { BabylonGameEngine } from '../engine/BabylonGameEngine';
import { AgriculturalMapManager } from '../map/AgriculturalMapManager';
import { Building, Vegetation } from '../types/GameObjectTypes';
import { ObjectInfoPanel } from './ObjectInfoPanel';
import { Minimap } from './Minimap';
import { CameraJumpController } from '../map/CameraJumpController';
import { QuestLogPanel } from './QuestLogPanel';
import { QuestLogManager } from '../quest/QuestLogManager';
import { EconomyStatusBar } from './EconomyStatusBar';
import { PlayerEconomySystem } from '../economy/PlayerEconomySystem';
import { RewardSystem } from '../economy/RewardSystem';

/**
 * 农业区 3D 地图查看器组件
 */
export const AgriculturalMapViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BabylonGameEngine | null>(null);
  const mapManagerRef = useRef<AgriculturalMapManager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<Building | Vegetation | null>(null);
  const cameraJumpRef = useRef<CameraJumpController | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0);
  const questLogManagerRef = useRef<QuestLogManager | null>(null);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const economySystemRef = useRef<PlayerEconomySystem | null>(null);
  const rewardSystemRef = useRef<RewardSystem | null>(null);
  const [playerCoin, setPlayerCoin] = useState(1000);
  const [playerExperience, setPlayerExperience] = useState(0);
  const [playerISC, setPlayerISC] = useState(0);
  const [playerEnergy, setPlayerEnergy] = useState(100);
  const [playerWater, setPlayerWater] = useState(100);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        if (!canvasRef.current) {
          throw new Error('Canvas element not found');
        }

        // 创建游戏引擎
        const engine = new BabylonGameEngine();
        await engine.initialize(canvasRef.current);
        engineRef.current = engine;

        // 创建地图管理器
        const mapManager = new AgriculturalMapManager(engine);
        await mapManager.initialize();
        mapManagerRef.current = mapManager;

        // 初始化相机跳转控制器
        cameraJumpRef.current = new CameraJumpController(1000);

        // 初始化任务日志管理器
        questLogManagerRef.current = new QuestLogManager();

        // 初始化玩家经济系统
        economySystemRef.current = new PlayerEconomySystem('player-1');
        rewardSystemRef.current = new RewardSystem(economySystemRef.current);
        
        // 订阅余额变化
        economySystemRef.current.onBalanceChange((currency, newBalance) => {
          if (currency === 'coin') {
            setPlayerCoin(newBalance);
          } else if (currency === 'experience') {
            setPlayerExperience(newBalance);
          } else if (currency === 'energy') {
            setPlayerEnergy(newBalance);
          } else if (currency === 'water') {
            setPlayerWater(newBalance);
          }
        });

        // 设置任务日志管理器的奖励系统
        if (questLogManagerRef.current && rewardSystemRef.current && economySystemRef.current) {
          questLogManagerRef.current.setRewardSystem(rewardSystemRef.current);
          questLogManagerRef.current.setEconomySystem(economySystemRef.current);
        }

        // 订阅 ISC 余额变化
        if (economySystemRef.current) {
          economySystemRef.current.onBalanceChange((currency, newBalance) => {
            if (currency === 'isc') {
              setPlayerISC(newBalance);
            }
          });
        }

        // 设置对象选择回调
        mapManager.setOnObjectSelected((object) => {
          setSelectedObject(object);
        });

        // 启动小地图更新循环
        const minimapUpdateInterval = setInterval(() => {
          if (mapManagerRef.current) {
            mapManagerRef.current.updateMinimapCamera();
            setUpdateCounter((prev) => prev + 1);
          }
        }, 100);

        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize map';
        setError(errorMessage);
        console.error('Map initialization error:', err);
      }
    };

    initializeMap();

    return () => {
      // 清理资源
      if (mapManagerRef.current) {
        mapManagerRef.current.dispose();
      }
      if (engineRef.current) {
        engineRef.current.dispose();
      }
      if (cameraJumpRef.current) {
        cameraJumpRef.current.stop();
      }
      if (economySystemRef.current) {
        // 清理经济系统
      }
      if (questLogManagerRef.current) {
        questLogManagerRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="w-full h-screen flex flex-col bg-gray-900">
      {/* 标题栏 */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold">🌾 农业区 3D 地图</h1>
        <p className="text-sm opacity-90">使用鼠标拖拽移动、滚轮缩放、点击选择建筑</p>
      </div>

      {/* 3D 画布 */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />

        {/* 加载指示器 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center">
              <div className="inline-block animate-spin">
                <div className="w-12 h-12 border-4 border-green-500 border-t-blue-500 rounded-full" />
              </div>
              <p className="text-white mt-4 text-lg">正在加载农业区地图...</p>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-red-600 text-white p-6 rounded-lg max-w-md">
              <h2 className="text-xl font-bold mb-2">加载失败</h2>
              <p className="mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-white text-red-600 px-4 py-2 rounded font-bold hover:bg-gray-100"
              >
                重新加载
              </button>
            </div>
          </div>
        )}

        {/* 信息面板 */}
        {!isLoading && !error && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg max-w-xs">
            <h3 className="font-bold mb-2">📍 地图信息</h3>
            <ul className="text-sm space-y-1">
              <li>🏠 建筑数量: 7</li>
              <li>🌳 植被数量: 15+</li>
              <li>📐 地图大小: 500×500m</li>
              <li>🎯 选中对象: {selectedObject ? selectedObject.name : '无'}</li>
            </ul>
          </div>
        )}

        {/* 对象信息面板 */}
        <ObjectInfoPanel
          object={selectedObject}
          onClose={() => setSelectedObject(null)}
          onUpdate={(updatedObject) => {
            // 更新选中对象
            setSelectedObject(updatedObject);
            console.log('Object updated:', updatedObject);
            // 播放编辑反馈
            if (mapManagerRef.current) {
              mapManagerRef.current.playEditFeedback(updatedObject);
            }
            // TODO: 同步到后端数据库
          }}
          onDelete={(deletedObject) => {
            // 清除选中对象
            setSelectedObject(null);
            console.log('Object deleted:', deletedObject);
            // 播放删除反馈
            if (mapManagerRef.current) {
              mapManagerRef.current.playDeleteFeedback(deletedObject);
            }
            // TODO: 从 3D 场景中移除网格
            // TODO: 从后端数据库中删除
          }}
        />

        {/* 小地图导航栏 */}
        {!isLoading && !error && mapManagerRef.current?.getMinimapManager() && (
          <Minimap
            key={updateCounter}
            minimapManager={mapManagerRef.current.getMinimapManager()!}
            onLocationClick={(worldX, worldZ) => {
              // 处理小地图点击跳转
              if (engineRef.current && cameraJumpRef.current) {
                const camera = engineRef.current.getScene().activeCamera;
                if (camera) {
                  const fromPos = camera.position;
                  cameraJumpRef.current.startJump(
                    fromPos.x,
                    fromPos.y,
                    fromPos.z,
                    worldX,
                    fromPos.y,
                    worldZ,
                    1000
                  );
                }
              }
            }}
            showLegend={true}
            showGrid={true}
          />
        )}

        {/* 任务日志面板 */}
        {!isLoading && !error && questLogManagerRef.current && (
          <QuestLogPanel
            questLogManager={questLogManagerRef.current}
            isOpen={isQuestLogOpen}
            onClose={() => setIsQuestLogOpen(false)}
          />
        )}

        {/* 经济状态栏 */}
        {!isLoading && !error && (
          <EconomyStatusBar
            coin={playerCoin}
            experience={playerExperience}
            energy={playerEnergy}
            water={playerWater}
            isc={playerISC}
            onCoinChange={(newValue, oldValue) => {
              console.log(`Coin changed: ${oldValue} -> ${newValue}`);
            }}
            onExperienceChange={(newValue, oldValue) => {
              console.log(`Experience changed: ${oldValue} -> ${newValue}`);
            }}
            onISCRefresh={(balance) => {
              console.log(`ISC balance refreshed from blockchain: ${balance}`);
              setPlayerISC(balance);
            }}
          />
        )}

        {/* 任务日志按钮 */}
        {!isLoading && !error && (
          <button
            onClick={() => setIsQuestLogOpen(!isQuestLogOpen)}
            className="absolute top-4 left-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-all"
          >
            📚 任务日志
          </button>
        )}

        {/* 控制提示 */}
        {!isLoading && !error && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg">
            <h3 className="font-bold mb-2">⌨️ 操作说明</h3>
            <ul className="text-sm space-y-1">
              <li>🖱️ 左键拖拽: 旋转视角</li>
              <li>🔍 滚轮: 缩放地图</li>
              <li>👆 点击: 选择建筑</li>
            </ul>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="bg-gray-800 text-white p-2 text-sm flex justify-between items-center">
        <span>
          {isLoading ? '加载中...' : error ? '加载失败' : '✅ 地图已加载'}
        </span>
        <span>Babylon.js 3D 引擎 | 农业区完整场景 | 任务日志系统 | 经济系统</span>
      </div>
    </div>
  );
};

export default AgriculturalMapViewer;
