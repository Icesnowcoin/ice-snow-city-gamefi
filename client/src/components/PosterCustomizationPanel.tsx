import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PosterTemplateSelector } from './PosterTemplateSelector';
import { PosterEditor } from './PosterEditor';
import { PosterEditorModal } from './PosterEditorModal';
import { type PosterTemplate, getTemplateById } from '@/lib/posterTemplates';
import { Download, Edit2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface PosterCustomizationPanelProps {
  posterImageUrl: string;
  onSave?: (canvas: HTMLCanvasElement) => void;
}

export const PosterCustomizationPanel: React.FC<PosterCustomizationPanelProps> = ({
  posterImageUrl,
  onSave,
}) => {
  const { lang } = useLanguage();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState(posterImageUrl);

  const selectedTemplate = selectedTemplateId
    ? getTemplateById(selectedTemplateId)
    : null;

  const handleSelectTemplate = (template: PosterTemplate) => {
    setSelectedTemplateId(template.id);
    toast.success(
      lang === 'zh'
        ? `已选择模板：${template.nameZh}`
        : `Selected template: ${template.name}`
    );
  };

  const handleOpenEditor = () => {
    setEditingImageUrl(posterImageUrl);
    setIsEditorOpen(true);
  };

  const handleEditorSave = (canvas: HTMLCanvasElement) => {
    // Convert canvas to image and save
    const imageUrl = canvas.toDataURL('image/png');
    setEditingImageUrl(imageUrl);
    onSave?.(canvas);
    setIsEditorOpen(false);
    toast.success(lang === 'zh' ? '海报已更新' : 'Poster updated');
  };

  const handleResetTemplate = () => {
    setSelectedTemplateId(null);
    toast.info(lang === 'zh' ? '已重置模板' : 'Template reset');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = editingImageUrl;
    link.download = `poster-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(lang === 'zh' ? '海报已下载' : 'Poster downloaded');
  };

  return (
    <div className="w-full space-y-4">
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">
            {lang === 'zh' ? '模板库' : 'Templates'}
          </TabsTrigger>
          <TabsTrigger value="editor">
            {lang === 'zh' ? '编辑器' : 'Editor'}
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <PosterTemplateSelector
            onSelectTemplate={handleSelectTemplate}
            selectedTemplateId={selectedTemplateId || undefined}
          />

          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {lang === 'zh' ? '模板预览' : 'Template Preview'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-900 rounded-lg p-4 flex justify-center">
                  <img
                    src={editingImageUrl}
                    alt="Poster preview"
                    className="max-w-full max-h-96 rounded-lg border-2 border-gray-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleOpenEditor}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    {lang === 'zh' ? '编辑' : 'Edit'}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {lang === 'zh' ? '下载' : 'Download'}
                  </Button>
                </div>

                <Button
                  onClick={handleResetTemplate}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  {lang === 'zh' ? '重置模板' : 'Reset Template'}
                </Button>

                {/* Template details */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
                  <h4 className="font-medium text-sm">
                    {lang === 'zh' ? '模板信息' : 'Template Info'}
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>
                      <span className="font-medium">
                        {lang === 'zh' ? '名称：' : 'Name: '}
                      </span>
                      {lang === 'zh'
                        ? selectedTemplate.nameZh
                        : selectedTemplate.name}
                    </p>
                    <p>
                      <span className="font-medium">
                        {lang === 'zh' ? '描述：' : 'Description: '}
                      </span>
                      {lang === 'zh'
                        ? selectedTemplate.descriptionZh
                        : selectedTemplate.description}
                    </p>
                    <p>
                      <span className="font-medium">
                        {lang === 'zh' ? '元素数：' : 'Elements: '}
                      </span>
                      {selectedTemplate.presets.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedTemplate && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {lang === 'zh'
                      ? '选择一个模板开始自定义'
                      : 'Select a template to get started'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Editor Tab */}
        <TabsContent value="editor">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {lang === 'zh' ? '高级编辑器' : 'Advanced Editor'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lang === 'zh'
                    ? '使用高级编辑器自定义海报的每个细节'
                    : 'Use the advanced editor to customize every detail of your poster'}
                </p>
                <Button
                  onClick={handleOpenEditor}
                  className="w-full"
                  size="lg"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {lang === 'zh' ? '打开编辑器' : 'Open Editor'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Editor Modal */}
      <PosterEditorModal
        isOpen={isEditorOpen}
        posterImageUrl={editingImageUrl}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleEditorSave}
      />
    </div>
  );
};
