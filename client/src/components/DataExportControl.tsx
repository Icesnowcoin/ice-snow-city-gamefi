'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Sheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataExportService, type ExportRow } from '@/lib/dataExportService';

/**
 * 数据导出控制组件属性
 */
export interface DataExportControlProps {
  data: ExportRow[];
  headers?: string[];
  filename: string;
  sheetName?: string;
  onExportStart?: () => void;
  onExportSuccess?: (format: 'csv' | 'excel') => void;
  onExportError?: (error: Error) => void;
  className?: string;
  showProgress?: boolean;
}

/**
 * DataExportControl 组件：提供 CSV 和 Excel 导出功能
 */
export const DataExportControl: React.FC<DataExportControlProps> = ({
  data,
  headers,
  filename,
  sheetName = 'Sheet1',
  onExportStart,
  onExportSuccess,
  onExportError,
  className = '',
  showProgress = true,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const exportService = new DataExportService();

  /**
   * 处理 CSV 导出
   */
  const handleExportCSV = async () => {
    let progressInterval: NodeJS.Timeout | null = null;
    try {
      setIsExporting(true);
      setExportStatus('loading');
      setExportProgress(0);
      onExportStart?.();

      // 模拟导出进度
      progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + Math.random() * 30, 90));
      }, 200);

      const csv = exportService.getCSVString(data, headers);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      if (progressInterval) clearInterval(progressInterval);
      setExportProgress(100);
      setExportStatus('success');

      toast.success('CSV 导出成功', {
        description: `文件 ${filename}.csv 已下载`,
        duration: 3000,
      });

      onExportSuccess?.('csv');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('导出失败');
      setExportStatus('error');

      toast.error('CSV 导出失败', {
        description: err.message,
        duration: 4000,
      });

      onExportError?.(err);
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setIsExporting(false);
      setTimeout(() => {
        setExportProgress(0);
        setExportStatus('idle');
      }, 1000);
    }
  };

  /**
   * 处理 Excel 导出
   */
  const handleExportExcel = async () => {
    let progressInterval: NodeJS.Timeout | null = null;
    try {
      setIsExporting(true);
      setExportStatus('loading');
      setExportProgress(0);
      onExportStart?.();

      // 模拟导出进度
      progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + Math.random() * 25, 90));
      }, 250);

      const excelBuffer = await exportService.getExcelBuffer(data, headers, sheetName);
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);

      if (progressInterval) clearInterval(progressInterval);
      setExportProgress(100);
      setExportStatus('success');

      toast.success('Excel 导出成功', {
        description: `文件 ${filename}.xlsx 已下载`,
        duration: 3000,
      });

      onExportSuccess?.('excel');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('导出失败');
      setExportStatus('error');

      toast.error('Excel 导出失败', {
        description: err.message,
        duration: 4000,
      });

      onExportError?.(err);
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setIsExporting(false);
      setTimeout(() => {
        setExportProgress(0);
        setExportStatus('idle');
      }, 1000);
    }
  };

  /**
   * 获取导出状态显示文本
   */
  const getStatusText = () => {
    if (exportStatus === 'loading') {
      return `导出中... ${Math.round(exportProgress)}%`;
    }
    if (exportStatus === 'success') {
      return '导出成功';
    }
    if (exportStatus === 'error') {
      return '导出失败';
    }
    return '导出数据';
  };

  /**
   * 预览 CSV
   */
  const handlePreviewCSV = () => {
    try {
      const csv = exportService.getCSVString(data, headers);
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write('<pre>' + csv.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>');
        previewWindow.document.close();
        toast.info('CSV 预览已打开', { duration: 2000 });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('预览失败');
      toast.error('CSV 预览失败', {
        description: err.message,
        duration: 3000,
      });
    }
  };

  /**
   * 预览 Excel
   */
  const handlePreviewExcel = () => {
    try {
      const data_preview = exportService.formatDataForExport(data, headers);
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        const html = `
          <html>
            <head><title>Excel 预览</title></head>
            <body>
              <table border="1" cellpadding="5" cellspacing="0">
                <tr>
                  ${Object.keys(data_preview[0] || {})
                    .map(key => `<th>${key}</th>`)
                    .join('')}
                </tr>
                ${data_preview
                  .map(
                    row => `
                  <tr>
                    ${Object.values(row)
                      .map(val => `<td>${val}</td>`)
                      .join('')}
                  </tr>
                `
                  )
                  .join('')}
              </table>
            </body>
          </html>
        `;
        previewWindow.document.write(html);
        previewWindow.document.close();
        toast.info('Excel 预览已打开', { duration: 2000 });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('预览失败');
      toast.error('Excel 预览失败', {
        description: err.message,
        duration: 3000,
      });
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* 导出进度条 */}
      {showProgress && isExporting && (
        <div className="w-full space-y-1">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 text-center">{getStatusText()}</div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isExporting || data.length === 0}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {getStatusText()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV} disabled={isExporting}>
              <FileText className="mr-2 h-4 w-4" />
              <span>导出为 CSV</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel} disabled={isExporting}>
              <Sheet className="mr-2 h-4 w-4" />
              <span>导出为 Excel</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePreviewCSV} disabled={isExporting}>
              <FileText className="mr-2 h-4 w-4" />
              <span>预览 CSV</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePreviewExcel} disabled={isExporting}>
              <Sheet className="mr-2 h-4 w-4" />
              <span>预览 Excel</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

/**
 * 高级导出控制组件：支持多个数据集
 */
export interface AdvancedExportControlProps {
  datasets: Array<{
    name: string;
    data: ExportRow[];
    headers?: string[];
  }>;
  filename: string;
  className?: string;
}

export const AdvancedExportControl: React.FC<AdvancedExportControlProps> = ({
  datasets,
  filename,
  className = '',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const exportService = new DataExportService();

  const handleExportMultipleSheets = async () => {
    try {
      setIsExporting(true);
      toast.loading('正在导出 Excel...', { duration: 0 });

      const excelBuffer = await exportService.getMultiSheetExcelBuffer(datasets);
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.dismiss();
      toast.success('Excel 导出成功', {
        description: `包含 ${datasets.length} 个工作表`,
        duration: 3000,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('导出失败');
      toast.dismiss();
      toast.error('Excel 导出失败', {
        description: err.message,
        duration: 4000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExportMultipleSheets}
      disabled={isExporting || datasets.length === 0}
      variant="outline"
      size="sm"
      className={`gap-2 ${className}`}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {isExporting ? '导出中...' : '导出多工作表'}
    </Button>
  );
};
