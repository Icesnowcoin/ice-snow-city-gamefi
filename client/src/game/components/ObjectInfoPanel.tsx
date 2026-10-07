import React, { useState } from 'react';
import { Building, Vegetation, BUILDING_CONFIGS, VEGETATION_CONFIGS } from '../types/GameObjectTypes';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditObjectDialog } from './EditObjectDialog';
import { MaintenanceDialog } from './MaintenanceDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface ObjectInfoPanelProps {
  object: Building | Vegetation | null;
  onClose: () => void;
  onUpdate?: (object: Building | Vegetation) => void;
  onDelete?: (object: Building | Vegetation) => void;
}

/**
 * 游戏对象信息面板组件
 * 显示选中建筑或植被的详细属性和状态信息
 */
export const ObjectInfoPanel: React.FC<ObjectInfoPanelProps> = ({
  object,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!object) {
    return null;
  }

  const isBuilding = object.type === 'building';
  const building = isBuilding ? (object as Building) : null;
  const vegetation = !isBuilding ? (object as Vegetation) : null;

  const getStatusColor = (value: number): string => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusLabel = (value: number): string => {
    if (value >= 80) return '优秀';
    if (value >= 60) return '良好';
    if (value >= 40) return '一般';
    return '需要维护';
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleSaveEdit = (updatedObject: Building | Vegetation) => {
    if (onUpdate) {
      onUpdate(updatedObject);
    }
  };

  const handleMaintain = (updatedBuilding: Building) => {
    if (onUpdate) {
      onUpdate(updatedBuilding);
    }
  };

  const handleDelete = (deletedObject: Building | Vegetation) => {
    if (onDelete) {
      onDelete(deletedObject);
    }
    onClose();
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto bg-gray-900 border-2 border-green-500 rounded-lg shadow-2xl z-50">
        {/* 标题栏 */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {isBuilding ? '🏢' : '🌿'}
            </span>
            <div>
              <h2 className="font-bold text-lg">{object.name}</h2>
              <p className="text-xs opacity-75">{object.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1"
          >
            ✕
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-4 space-y-3">
          {/* 基本信息 */}
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('basic')}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white p-3 flex justify-between items-center"
            >
              <span className="font-bold">ℹ️ 基本信息</span>
              <span>{expandedSection === 'basic' ? '▼' : '▶'}</span>
            </button>
            {expandedSection === 'basic' && (
              <div className="bg-gray-800 bg-opacity-50 p-3 space-y-2 text-sm text-gray-200">
                <div className="flex justify-between">
                  <span>位置:</span>
                  <span className="font-bold">
                    ({object.position.x.toFixed(0)}, {object.position.y.toFixed(0)}, {object.position.z.toFixed(0)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>创建时间:</span>
                  <span className="text-gray-400">{object.createdAt.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>更新时间:</span>
                  <span className="text-gray-400">{object.updatedAt.toLocaleDateString()}</span>
                </div>
                <div className="pt-2 border-t border-gray-700">
                  <p className="text-gray-300">{object.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* 建筑特定信息 */}
          {isBuilding && building && (
            <>
              {/* 状态信息 */}
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('status')}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white p-3 flex justify-between items-center"
                >
                  <span className="font-bold">⚙️ 状态信息</span>
                  <span>{expandedSection === 'status' ? '▼' : '▶'}</span>
                </button>
                {expandedSection === 'status' && (
                  <div className="bg-gray-800 bg-opacity-50 p-3 space-y-3 text-sm text-gray-200">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>健康度</span>
                        <span className="font-bold">
                          {building.state.health}% ({getStatusLabel(building.state.health)})
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getStatusColor(building.state.health)}`}
                          style={{ width: `${building.state.health}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>生产力</span>
                        <span className="font-bold">
                          {building.state.productivity}% ({getStatusLabel(building.state.productivity)})
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getStatusColor(building.state.productivity)}`}
                          style={{ width: `${building.state.productivity}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span>工人数量:</span>
                      <span className="font-bold">
                        {building.state.workers}/{building.state.capacity}
                      </span>
                    </div>

                    <div className="border-t border-gray-700 pt-2">
                      <div className="flex justify-between">
                        <span>上次维护:</span>
                        <span className="text-gray-400">{building.state.lastMaintenance.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>下次维护:</span>
                        <span className="text-gray-400">{building.state.nextMaintenance.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 经济信息 */}
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('economy')}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white p-3 flex justify-between items-center"
                >
                  <span className="font-bold">💰 经济信息</span>
                  <span>{expandedSection === 'economy' ? '▼' : '▶'}</span>
                </button>
                {expandedSection === 'economy' && (
                  <div className="bg-gray-800 bg-opacity-50 p-3 space-y-3 text-sm text-gray-200">
                    <div className="flex justify-between">
                      <span>建造成本:</span>
                      <span className="font-bold text-green-400">{building.constructionCost} ISC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>维护成本:</span>
                      <span className="font-bold text-orange-400">{building.maintenanceCost.toFixed(2)} ISC/天</span>
                    </div>
                    {building.production && (
                      <div className="border-t border-gray-700 pt-2">
                        <div className="flex justify-between">
                          <span>产出物:</span>
                          <span className="font-bold">{building.production.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>产量:</span>
                          <span className="font-bold text-green-400">
                            {building.production.amount} ({building.production.rate}/天)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 存储信息 */}
              {building.storage && (
                <div className="border border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('storage')}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white p-3 flex justify-between items-center"
                  >
                    <span className="font-bold">📦 存储信息</span>
                    <span>{expandedSection === 'storage' ? '▼' : '▶'}</span>
                  </button>
                  {expandedSection === 'storage' && (
                    <div className="bg-gray-800 bg-opacity-50 p-3 space-y-3 text-sm text-gray-200">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>容量使用</span>
                          <span className="font-bold">
                            {building.storage.current}/{building.storage.capacity}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all"
                            style={{
                              width: `${(building.storage.current / building.storage.capacity) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {((building.storage.current / building.storage.capacity) * 100).toFixed(1)}%
                        </p>
                      </div>
                      {building.storage.items.length > 0 && (
                        <div className="border-t border-gray-700 pt-2">
                          <p className="font-bold mb-1">物品列表:</p>
                          <ul className="space-y-1">
                            {building.storage.items.map((item, idx) => (
                              <li key={idx} className="text-xs text-gray-300">
                                • {item.name} x{item.quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* 植被特定信息 */}
          {!isBuilding && vegetation && (
            <>
              {/* 生长状态 */}
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('growth')}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white p-3 flex justify-between items-center"
                >
                  <span className="font-bold">🌱 生长状态</span>
                  <span>{expandedSection === 'growth' ? '▼' : '▶'}</span>
                </button>
                {expandedSection === 'growth' && (
                  <div className="bg-gray-800 bg-opacity-50 p-3 space-y-3 text-sm text-gray-200">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>健康度</span>
                        <span className="font-bold">
                          {vegetation.state.health}% ({getStatusLabel(vegetation.state.health)})
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getStatusColor(vegetation.state.health)}`}
                          style={{ width: `${vegetation.state.health}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>生长进度</span>
                        <span className="font-bold">{vegetation.state.growth}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-green-500 transition-all"
                          style={{ width: `${vegetation.state.growth}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span>水分:</span>
                      <span className="font-bold text-blue-400">{vegetation.state.moisture}%</span>
                    </div>

                    <div className="flex justify-between">
                      <span>养分:</span>
                      <span className="font-bold text-yellow-400">{vegetation.state.nutrients}%</span>
                    </div>

                    <div className="border-t border-gray-700 pt-2">
                      <div className="flex justify-between">
                        <span>收获状态:</span>
                        <span className="font-bold">
                          {vegetation.state.harvestReady ? '✅ 可收获' : '⏳ 未成熟'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 环境条件 */}
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('environment')}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white p-3 flex justify-between items-center"
                >
                  <span className="font-bold">🌍 环境条件</span>
                  <span>{expandedSection === 'environment' ? '▼' : '▶'}</span>
                </button>
                {expandedSection === 'environment' && (
                  <div className="bg-gray-800 bg-opacity-50 p-3 space-y-2 text-sm text-gray-200">
                    <div className="flex justify-between">
                      <span>面积:</span>
                      <span className="font-bold">{vegetation.area} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span>日照:</span>
                      <span className="font-bold">{vegetation.sunlight}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>温度:</span>
                      <span className="font-bold">{vegetation.temperature}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>需水量:</span>
                      <span className="font-bold">{vegetation.waterRequirement} L/天</span>
                    </div>
                    {vegetation.yield && (
                      <div className="border-t border-gray-700 pt-2">
                        <div className="flex justify-between">
                          <span>产出:</span>
                          <span className="font-bold text-green-400">{vegetation.yield.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>产量:</span>
                          <span className="font-bold">{vegetation.yield.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>收获时间:</span>
                          <span className="text-gray-400">
                            {new Date(vegetation.yield.harvestTime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2 border-t border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="flex-1 text-white hover:bg-blue-600"
            >
              📝 编辑
            </Button>
            {isBuilding && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMaintenanceDialogOpen(true)}
                className="flex-1 text-white hover:bg-yellow-600"
              >
                🔧 维护
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex-1"
            >
              🗑️ 删除
            </Button>
          </div>
        </div>
      </div>

      {/* 编辑对话框 */}
      <EditObjectDialog
        object={object}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleSaveEdit}
      />

      {/* 维护对话框 */}
      {isBuilding && (
        <MaintenanceDialog
          object={building}
          isOpen={isMaintenanceDialogOpen}
          onClose={() => setIsMaintenanceDialogOpen(false)}
          onMaintain={handleMaintain}
        />
      )}

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        object={object}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default ObjectInfoPanel;
