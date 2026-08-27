import React, { useState } from 'react';
import { Building, Vegetation } from '../types/GameObjectTypes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface MaintenanceDialogProps {
  object: Building | null;
  isOpen: boolean;
  onClose: () => void;
  onMaintain: (object: Building) => void;
}

/**
 * 维护操作对话框组件
 * 用于维护建筑，恢复健康度和生产力
 */
export const MaintenanceDialog: React.FC<MaintenanceDialogProps> = ({
  object,
  isOpen,
  onClose,
  onMaintain,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!object) {
    return null;
  }

  const building = object as Building;
  const needsMaintenance = building.state.health < 80 || building.state.productivity < 80;
  const maintenanceCost = building.maintenanceCost;

  const handleMaintain = async () => {
    setIsProcessing(true);
    try {
      // 模拟维护过程
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 更新建筑状态
      const updatedBuilding: Building = {
        ...building,
        state: {
          ...building.state,
          health: Math.min(100, building.state.health + 30),
          productivity: Math.min(100, building.state.productivity + 25),
          lastMaintenance: new Date(),
          nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
        },
        updatedAt: new Date(),
      };

      onMaintain(updatedBuilding);
      setIsProcessing(false);
      onClose();
    } catch (error) {
      console.error('Maintenance failed:', error);
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-900 border-2 border-yellow-500 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            维护建筑
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 建筑信息 */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">{building.name}</h3>
            <p className="text-sm text-gray-300 mb-4">{building.description}</p>

            {/* 当前状态 */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>健康度</span>
                <span className={building.state.health < 50 ? 'text-red-400' : 'text-yellow-400'}>
                  {building.state.health}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    building.state.health < 50
                      ? 'bg-red-500'
                      : building.state.health < 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${building.state.health}%` }}
                />
              </div>

              <div className="flex justify-between text-sm mt-3">
                <span>生产力</span>
                <span className={building.state.productivity < 50 ? 'text-red-400' : 'text-yellow-400'}>
                  {building.state.productivity}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    building.state.productivity < 50
                      ? 'bg-red-500'
                      : building.state.productivity < 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${building.state.productivity}%` }}
                />
              </div>
            </div>
          </div>

          {/* 维护信息 */}
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg border border-blue-500">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              维护效果
            </h4>
            <ul className="text-sm space-y-1 text-gray-300">
              <li>✓ 健康度恢复 +30%</li>
              <li>✓ 生产力恢复 +25%</li>
              <li>✓ 重置维护周期（7天）</li>
            </ul>
          </div>

          {/* 成本信息 */}
          <div className="bg-orange-900 bg-opacity-50 p-4 rounded-lg border border-orange-500">
            <h4 className="font-bold mb-2">💰 维护成本</h4>
            <div className="text-lg font-bold text-orange-400">
              {maintenanceCost} ISC
            </div>
            <p className="text-sm text-gray-300 mt-1">
              {needsMaintenance ? '⚠️ 此建筑需要维护' : '✅ 此建筑状态良好'}
            </p>
          </div>

          {/* 最后维护时间 */}
          <div className="text-sm text-gray-400">
            <p>上次维护: {building.state.lastMaintenance.toLocaleDateString()}</p>
            <p>下次维护: {building.state.nextMaintenance.toLocaleDateString()}</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-end pt-4 border-t border-gray-700">
          <Button variant="outline" onClick={onClose} className="text-white">
            取消
          </Button>
          <Button
            onClick={handleMaintain}
            disabled={isProcessing}
            className="bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
          >
            {isProcessing ? '维护中...' : '开始维护'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceDialog;
