import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PosterEditor } from './PosterEditor';
import { toast } from 'sonner';

interface PosterEditorModalProps {
  isOpen: boolean;
  posterImageUrl: string;
  onClose: () => void;
  onSave?: (canvas: HTMLCanvasElement) => void;
}

export const PosterEditorModal: React.FC<PosterEditorModalProps> = ({
  isOpen,
  posterImageUrl,
  onClose,
  onSave,
}) => {
  const { lang } = useLanguage();

  const handleSave = (canvas: HTMLCanvasElement) => {
    onSave?.(canvas);
    onClose();
    toast.success(lang === 'zh' ? '海报已保存' : 'Poster saved successfully');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lang === 'zh' ? '编辑海报' : 'Edit Poster'}
          </DialogTitle>
          <DialogDescription>
            {lang === 'zh'
              ? '自定义海报内容、样式和位置'
              : 'Customize poster content, style, and position'}
          </DialogDescription>
        </DialogHeader>
        <PosterEditor
          posterImageUrl={posterImageUrl}
          onSave={handleSave}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
