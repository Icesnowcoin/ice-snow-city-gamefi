import React, { useState, useEffect } from 'react';
import { Building, Vegetation } from '../types/GameObjectTypes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';

interface EditObjectDialogProps {
  object: Building | Vegetation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (object: Building | Vegetation) => void;
}

/**
 * 对象编辑对话框组件
 * 允许编辑建筑或植被的属性
 */
export const EditObjectDialog: React.FC<EditObjectDialogProps> = ({
  object,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Building | Vegetation | null>(null);

  useEffect(() => {
    if (object) {
      setFormData(JSON.parse(JSON.stringify(object)));
    }
  }, [object, isOpen]);

  if (!formData) {
    return null;
  }

  const isBuilding = formData.type === 'building';
  const building = isBuilding ? (formData as Building) : null;
  const vegetation = !isBuilding ? (formData as Vegetation) : null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      name: e.target.value,
    });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      description: e.target.value,
    });
  };

  const handleHealthChange = (value: number[]) => {
    if (isBuilding && building) {
      setFormData({
        ...formData,
        state: {
          ...(formData.state as any),
          health: value[0],
        } as any,
      });
    } else if (vegetation) {
      setFormData({
        ...formData,
        state: {
          ...(formData.state as any),
          health: value[0],
        } as any,
      });
    }
  };

  const handleProductivityChange = (value: number[]) => {
    if (building) {
      setFormData({
        ...formData,
        state: {
          ...(formData.state as any),
          productivity: value[0],
        } as any,
      });
    }
  };

  const handleWorkersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (building) {
      const workers = Math.min(parseInt(e.target.value) || 0, (building.state as any).capacity);
      setFormData({
        ...formData,
        state: {
          ...(formData.state as any),
          workers,
        } as any,
      });
    }
  };

  const handleGrowthChange = (value: number[]) => {
    if (vegetation) {
      setFormData({
        ...formData,
        state: {
          ...(formData.state as any),
          growth: value[0],
        } as any,
      });
    }
  };

  const handleMoistureChange = (value: number[]) => {
    if (vegetation) {
      setFormData({
        ...formData,
        state: {
          ...(formData.state as any),
          moisture: value[0],
        } as any,
      });
    }
  };

  const handleNutrientsChange = (value: number[]) => {
    if (vegetation) {
      setFormData({
        ...formData,
        state: {
          ...(formData.state as any),
          nutrients: value[0],
        } as any,
      });
    }
  };

  const handleSave = () => {
    if (formData) {
      formData.updatedAt = new Date();
      onSave(formData);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto bg-gray-900 border-2 border-green-500 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isBuilding ? '📝 编辑建筑' : '🌿 编辑植被'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-bold">
              名称
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-bold">
              描述
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleDescriptionChange}
              rows={3}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* 建筑特定编辑 */}
          {isBuilding && building && (
            <>
              <div className="border-t border-gray-700 pt-4">
                <h3 className="font-bold mb-3 text-sm">⚙️ 状态编辑</h3>

                {/* 健康度 */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <Label className="text-sm">健康度</Label>
                    <span className="text-sm font-bold">{building.state.health}%</span>
                  </div>
                  <Slider
                    value={[building.state.health]}
                    onValueChange={handleHealthChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* 生产力 */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <Label className="text-sm">生产力</Label>
                    <span className="text-sm font-bold">{building.state.productivity}%</span>
                  </div>
                  <Slider
                    value={[building.state.productivity]}
                    onValueChange={handleProductivityChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* 工人数量 */}
                <div className="space-y-2">
                  <Label htmlFor="workers" className="text-sm">
                    工人数量 (最多 {building.state.capacity})
                  </Label>
                  <Input
                    id="workers"
                    type="number"
                    min={0}
                    max={building.state.capacity}
                    value={building.state.workers}
                    onChange={handleWorkersChange}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            </>
          )}

          {/* 植被特定编辑 */}
          {!isBuilding && vegetation && (
            <>
              <div className="border-t border-gray-700 pt-4">
                <h3 className="font-bold mb-3 text-sm">🌱 生长状态编辑</h3>

                {/* 健康度 */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <Label className="text-sm">健康度</Label>
                    <span className="text-sm font-bold">{vegetation.state.health}%</span>
                  </div>
                  <Slider
                    value={[vegetation.state.health]}
                    onValueChange={handleHealthChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* 生长进度 */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <Label className="text-sm">生长进度</Label>
                    <span className="text-sm font-bold">{vegetation.state.growth}%</span>
                  </div>
                  <Slider
                    value={[vegetation.state.growth]}
                    onValueChange={handleGrowthChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* 水分 */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <Label className="text-sm">水分</Label>
                    <span className="text-sm font-bold">{vegetation.state.moisture}%</span>
                  </div>
                  <Slider
                    value={[vegetation.state.moisture]}
                    onValueChange={handleMoistureChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* 养分 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">养分</Label>
                    <span className="text-sm font-bold">{vegetation.state.nutrients}%</span>
                  </div>
                  <Slider
                    value={[vegetation.state.nutrients]}
                    onValueChange={handleNutrientsChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2 justify-end pt-4 border-t border-gray-700">
          <Button variant="outline" onClick={onClose} className="text-white">
            取消
          </Button>
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditObjectDialog;
