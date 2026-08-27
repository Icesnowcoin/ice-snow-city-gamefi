import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Type,
  Palette,
  Copy,
  Trash2,
  Download,
  RotateCcw,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
}

interface PosterEditorProps {
  posterImageUrl: string;
  onSave?: (canvas: HTMLCanvasElement) => void;
  onCancel?: () => void;
}

const FONT_FAMILIES = [
  { name: '微软雅黑', value: 'Microsoft YaHei' },
  { name: '宋体', value: 'SimSun' },
  { name: 'Arial', value: 'Arial' },
  { name: 'Helvetica', value: 'Helvetica' },
  { name: 'Georgia', value: 'Georgia' },
];

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4',
  '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F',
];

export const PosterEditor: React.FC<PosterEditorProps> = ({
  posterImageUrl,
  onSave,
  onCancel,
}) => {
  const { lang } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [posterImage, setPosterImage] = useState<HTMLImageElement | null>(null);

  // Load poster image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setPosterImage(img);
      redrawCanvas(img, textElements);
    };
    img.src = posterImageUrl;
  }, [posterImageUrl]);

  // Redraw canvas when elements change
  useEffect(() => {
    if (posterImage) {
      redrawCanvas(posterImage, textElements);
    }
  }, [textElements]);

  const redrawCanvas = (img: HTMLImageElement, elements: TextElement[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw background image
    ctx.drawImage(img, 0, 0);

    // Draw text elements
    elements.forEach((element) => {
      ctx.font = `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
      ctx.fillStyle = element.color;
      ctx.textAlign = element.textAlign;

      // Draw text with shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const x = element.textAlign === 'center' ? element.x + 50 : element.x;
      ctx.fillText(element.text, x, element.y);

      // Reset shadow
      ctx.shadowColor = 'transparent';
    });
  };

  const addTextElement = () => {
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      text: lang === 'zh' ? '新文本' : 'New Text',
      x: 50,
      y: 100,
      fontSize: 24,
      fontFamily: 'Microsoft YaHei',
      color: '#FFFFFF',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
    };
    setTextElements([...textElements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(
      textElements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = (id: string) => {
    setTextElements(textElements.filter((el) => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const duplicateElement = (id: string) => {
    const element = textElements.find((el) => el.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: `text-${Date.now()}`,
        x: element.x + 20,
        y: element.y + 20,
      };
      setTextElements([...textElements, newElement]);
      setSelectedElementId(newElement.id);
    }
  };

  const resetToOriginal = () => {
    setTextElements([]);
    setSelectedElementId(null);
    toast.success(lang === 'zh' ? '已重置为原始海报' : 'Reset to original poster');
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave?.(canvas);
      toast.success(lang === 'zh' ? '海报已保存' : 'Poster saved');
    }
  };

  const selectedElement = textElements.find((el) => el.id === selectedElementId);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Canvas area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{lang === 'zh' ? '海报预览' : 'Poster Preview'}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center bg-gray-900 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                className="max-w-full border-2 border-gray-700 rounded-lg shadow-lg cursor-crosshair"
                style={{ maxHeight: '500px' }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Controls panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {lang === 'zh' ? '编辑工具' : 'Edit Tools'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={addTextElement}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                {lang === 'zh' ? '添加文本' : 'Add Text'}
              </Button>

              <Button
                onClick={resetToOriginal}
                className="w-full"
                variant="outline"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {lang === 'zh' ? '重置' : 'Reset'}
              </Button>

              <div className="space-y-2">
                <Button
                  onClick={handleSave}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {lang === 'zh' ? '保存' : 'Save'}
                </Button>
                <Button
                  onClick={onCancel}
                  className="w-full"
                  variant="outline"
                >
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Text elements list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {lang === 'zh' ? '文本元素' : 'Text Elements'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {textElements.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {lang === 'zh' ? '暂无文本' : 'No text elements'}
                </p>
              ) : (
                textElements.map((element) => (
                  <div
                    key={element.id}
                    className={`p-2 rounded border-2 cursor-pointer transition-colors ${
                      selectedElementId === element.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => setSelectedElementId(element.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 truncate">
                        <p className="text-sm font-medium truncate">
                          {element.text}
                        </p>
                        <p className="text-xs text-gray-500">
                          {element.fontSize}px
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => duplicateElement(element.id)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            {lang === 'zh' ? '复制' : 'Duplicate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteElement(element.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {lang === 'zh' ? '删除' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Text properties panel */}
      {selectedElement && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {lang === 'zh' ? '文本属性' : 'Text Properties'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">
                  {lang === 'zh' ? '内容' : 'Content'}
                </TabsTrigger>
                <TabsTrigger value="style">
                  {lang === 'zh' ? '样式' : 'Style'}
                </TabsTrigger>
                <TabsTrigger value="position">
                  {lang === 'zh' ? '位置' : 'Position'}
                </TabsTrigger>
              </TabsList>

              {/* Content tab */}
              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label>{lang === 'zh' ? '文本内容' : 'Text Content'}</Label>
                  <Input
                    value={selectedElement.text}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { text: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
              </TabsContent>

              {/* Style tab */}
              <TabsContent value="style" className="space-y-4">
                <div>
                  <Label>{lang === 'zh' ? '字体大小' : 'Font Size'}</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[selectedElement.fontSize]}
                      onValueChange={(value) =>
                        updateElement(selectedElement.id, { fontSize: value[0] })
                      }
                      min={12}
                      max={72}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">
                      {selectedElement.fontSize}
                    </span>
                  </div>
                </div>

                <div>
                  <Label>{lang === 'zh' ? '字体' : 'Font'}</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full mt-2">
                        {selectedElement.fontFamily}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {FONT_FAMILIES.map((font) => (
                        <DropdownMenuItem
                          key={font.value}
                          onClick={() =>
                            updateElement(selectedElement.id, {
                              fontFamily: font.value,
                            })
                          }
                        >
                          {font.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <Label>{lang === 'zh' ? '文本颜色' : 'Text Color'}</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className="w-10 h-10 rounded border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor:
                            selectedElement.color === color
                              ? '#000'
                              : '#ccc',
                        }}
                        onClick={() =>
                          updateElement(selectedElement.id, { color })
                        }
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={selectedElement.color}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { color: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={
                      selectedElement.fontWeight === 'bold' ? 'default' : 'outline'
                    }
                    onClick={() =>
                      updateElement(selectedElement.id, {
                        fontWeight:
                          selectedElement.fontWeight === 'bold'
                            ? 'normal'
                            : 'bold',
                      })
                    }
                    className="flex-1"
                  >
                    {lang === 'zh' ? '粗体' : 'Bold'}
                  </Button>
                  <Button
                    variant={
                      selectedElement.fontStyle === 'italic' ? 'default' : 'outline'
                    }
                    onClick={() =>
                      updateElement(selectedElement.id, {
                        fontStyle:
                          selectedElement.fontStyle === 'italic'
                            ? 'normal'
                            : 'italic',
                      })
                    }
                    className="flex-1"
                  >
                    {lang === 'zh' ? '斜体' : 'Italic'}
                  </Button>
                </div>
              </TabsContent>

              {/* Position tab */}
              <TabsContent value="position" className="space-y-4">
                <div>
                  <Label>{lang === 'zh' ? '水平位置' : 'X Position'}</Label>
                  <Slider
                    value={[selectedElement.x]}
                    onValueChange={(value) =>
                      updateElement(selectedElement.id, { x: value[0] })
                    }
                    min={0}
                    max={posterImage?.width || 800}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>{lang === 'zh' ? '垂直位置' : 'Y Position'}</Label>
                  <Slider
                    value={[selectedElement.y]}
                    onValueChange={(value) =>
                      updateElement(selectedElement.id, { y: value[0] })
                    }
                    min={0}
                    max={posterImage?.height || 600}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>{lang === 'zh' ? '对齐方式' : 'Text Align'}</Label>
                  <div className="flex gap-2 mt-2">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <Button
                        key={align}
                        variant={
                          selectedElement.textAlign === align
                            ? 'default'
                            : 'outline'
                        }
                        onClick={() =>
                          updateElement(selectedElement.id, { textAlign: align })
                        }
                        className="flex-1 capitalize"
                      >
                        {lang === 'zh'
                          ? align === 'left'
                            ? '左'
                            : align === 'center'
                              ? '中'
                              : '右'
                          : align}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
