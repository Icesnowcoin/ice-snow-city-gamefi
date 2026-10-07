import React, { useState } from 'react';
import { Building, Vegetation } from '../types/GameObjectTypes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  object: Building | Vegetation | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (object: Building | Vegetation) => void;
}

/**
 * 删除确认对话框组件
 * 用于确认删除建筑或植被
 */
export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  object,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!object) {
    return null;
  }

  const isBuilding = object.type === 'building';
  const building = isBuilding ? (object as Building) : null;
  const vegetation = !isBuilding ? (object as Vegetation) : null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      // 模拟删除过程
      await new Promise((resolve) => setTimeout(resolve, 800));
      onConfirm(object);
      setIsProcessing(false);
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-gray-900 border-2 border-red-500 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl text-red-400">
            <AlertTriangle className="w-5 h-5" />
            确认删除
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            你确定要删除这个{isBuilding ? '建筑' : '植被'}吗？此操作无法撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* 对象信息 */}
        <div className="bg-gray-800 p-4 rounded-lg my-4">
          <h3 className="font-bold text-lg mb-2">{object.name}</h3>
          <p className="text-sm text-gray-300 mb-3">{object.description}</p>

          {/* 删除后果 */}
          <div className="bg-red-900 bg-opacity-50 p-3 rounded border border-red-500 text-sm">
            <p className="font-bold mb-2">⚠️ 删除后果：</p>
            <ul className="space-y-1 text-gray-200">
              {isBuilding && building && (
                <>
                  <li>✗ 失去建筑及其所有功能</li>
                  <li>✗ 已投入的建造成本不会返还</li>
                  <li>✗ 建筑内的存储物品将丢失</li>
                  <li>✗ 工人将失业</li>
                </>
              )}
              {vegetation && (
                <>
                  <li>✗ 失去植被及其产出</li>
                  <li>✗ 已投入的种植成本不会返还</li>
                  <li>✗ 未收获的农产品将丢失</li>
                </>
              )}
            </ul>
          </div>

          {/* 经济信息 */}
          <div className="mt-3 text-sm text-gray-300">
            <p>
              {isBuilding && building
                ? `建造成本: ${building.constructionCost} ISC`
                : '种植成本: 待定'}
            </p>
          </div>
        </div>

        {/* 确认输入 */}
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <p className="text-sm text-gray-300 mb-2">
            输入 <span className="font-bold text-red-400">DELETE</span> 来确认删除：
          </p>
          <DeleteConfirmInput onConfirm={handleConfirm} isProcessing={isProcessing} />
        </div>

        <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 text-white border-0">
          取消
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/**
 * 删除确认输入组件
 */
interface DeleteConfirmInputProps {
  onConfirm: () => void;
  isProcessing: boolean;
}

const DeleteConfirmInput: React.FC<DeleteConfirmInputProps> = ({ onConfirm, isProcessing }) => {
  const [input, setInput] = useState('');
  const isConfirmed = input === 'DELETE';

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value.toUpperCase())}
        placeholder="输入 DELETE"
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
        disabled={isProcessing}
      />
      <button
        onClick={onConfirm}
        disabled={!isConfirmed || isProcessing}
        className={`w-full px-4 py-2 rounded font-bold transition-all ${
          isConfirmed && !isProcessing
            ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
        }`}
      >
        {isProcessing ? '删除中...' : '确认删除'}
      </button>
    </div>
  );
};

export default DeleteConfirmDialog;
