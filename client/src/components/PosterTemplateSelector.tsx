import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  getTemplatesByCategory,
  ALL_TEMPLATES,
  type PosterTemplate,
} from '@/lib/posterTemplates';
import { Check } from 'lucide-react';

interface PosterTemplateSelectorProps {
  onSelectTemplate: (template: PosterTemplate) => void;
  selectedTemplateId?: string;
}

const CATEGORY_LABELS = {
  transaction: { en: 'Transaction', zh: '交易' },
  achievement: { en: 'Achievement', zh: '成就' },
  event: { en: 'Event', zh: '活动' },
  social: { en: 'Social', zh: '社交' },
};

export const PosterTemplateSelector: React.FC<PosterTemplateSelectorProps> = ({
  onSelectTemplate,
  selectedTemplateId,
}) => {
  const { lang } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<
    'transaction' | 'achievement' | 'event' | 'social'
  >('transaction');

  const categoryTemplates = getTemplatesByCategory(selectedCategory);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {lang === 'zh' ? '选择海报模板' : 'Select Poster Template'}
        </CardTitle>
        <CardDescription>
          {lang === 'zh'
            ? '选择一个模板开始自定义'
            : 'Choose a template to get started'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={selectedCategory}
          onValueChange={(value) =>
            setSelectedCategory(
              value as 'transaction' | 'achievement' | 'event' | 'social'
            )
          }
        >
          <TabsList className="grid w-full grid-cols-4">
            {Object.entries(CATEGORY_LABELS).map(([key, labels]) => (
              <TabsTrigger key={key} value={key}>
                {lang === 'zh' ? labels.zh : labels.en}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(CATEGORY_LABELS).map((category) => (
            <TabsContent
              key={category}
              value={category}
              className="space-y-4 mt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getTemplatesByCategory(
                  category as 'transaction' | 'achievement' | 'event' | 'social'
                ).map((template) => (
                  <div
                    key={template.id}
                    className={`relative rounded-lg border-2 transition-all cursor-pointer overflow-hidden ${
                      selectedTemplateId === template.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                    }`}
                    onClick={() => onSelectTemplate(template)}
                  >
                    {/* Template preview */}
                    <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
                      <div className="text-center space-y-2">
                        <div className="text-sm font-medium text-white truncate">
                          {lang === 'zh' ? template.nameZh : template.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {template.presets.length}{' '}
                          {lang === 'zh' ? '个文本元素' : ' text elements'}
                        </div>
                      </div>
                    </div>

                    {/* Template info */}
                    <div className="p-3 space-y-2">
                      <div>
                        <h4 className="font-medium text-sm">
                          {lang === 'zh' ? template.nameZh : template.name}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {lang === 'zh'
                            ? template.descriptionZh
                            : template.description}
                        </p>
                      </div>

                      {/* Presets preview */}
                      <div className="flex flex-wrap gap-1">
                        {template.presets.slice(0, 3).map((preset) => (
                          <Badge
                            key={preset.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {preset.fontSize}px
                          </Badge>
                        ))}
                        {template.presets.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.presets.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Selection indicator */}
                      {selectedTemplateId === template.id && (
                        <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 text-xs font-medium">
                          <Check className="w-3 h-3" />
                          {lang === 'zh' ? '已选择' : 'Selected'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {categoryTemplates.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {lang === 'zh'
                      ? '此类别暂无模板'
                      : 'No templates in this category'}
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Selected template details */}
        {selectedTemplateId && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="space-y-2">
              <h4 className="font-medium">
                {lang === 'zh' ? '模板详情' : 'Template Details'}
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>
                  {lang === 'zh' ? '类别：' : 'Category: '}
                  <span className="font-medium">
                    {lang === 'zh'
                      ? CATEGORY_LABELS[selectedCategory].zh
                      : CATEGORY_LABELS[selectedCategory].en}
                  </span>
                </p>
                <p>
                  {lang === 'zh' ? '预设元素：' : 'Preset Elements: '}
                  <span className="font-medium">
                    {
                      ALL_TEMPLATES.find((t) => t.id === selectedTemplateId)
                        ?.presets.length
                    }
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
