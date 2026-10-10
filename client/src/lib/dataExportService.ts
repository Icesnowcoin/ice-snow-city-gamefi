/**
 * 数据导出服务
 * 支持 CSV 和 Excel 格式导出
 */

/**
 * 导出数据行接口
 */
export interface ExportRow {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * 导出配置接口
 */
export interface ExportConfig {
  filename: string;
  sheetName?: string;
  dateFormat?: string;
  includeHeaders?: boolean;
  encoding?: string;
}

/**
 * CSV 导出选项
 */
export interface CSVExportOptions extends ExportConfig {
  delimiter?: string;
  quoteChar?: string;
  escapeChar?: string;
  lineBreak?: string;
}

/**
 * Excel 导出选项
 */
export interface ExcelExportOptions extends ExportConfig {
  columnWidths?: number[];
  headerStyle?: {
    bold?: boolean;
    backgroundColor?: string;
    textColor?: string;
  };
  dataStyle?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

/**
 * CSV 导出服务
 */
export class CSVExporter {
  private delimiter: string;
  private quoteChar: string;
  private escapeChar: string;
  private lineBreak: string;

  constructor(options: Partial<CSVExportOptions> = {}) {
    this.delimiter = options.delimiter || ',';
    this.quoteChar = options.quoteChar || '"';
    this.escapeChar = options.escapeChar || '"';
    this.lineBreak = options.lineBreak || '\n';
  }

  /**
   * 转义 CSV 字段
   */
  private escapeField(field: string | number | boolean | null | undefined): string {
    if (field === null || field === undefined) {
      return '';
    }

    const fieldStr = String(field);
    const needsQuotes =
      fieldStr.includes(this.delimiter) ||
      fieldStr.includes(this.quoteChar) ||
      fieldStr.includes(this.lineBreak);

    if (needsQuotes) {
      return (
        this.quoteChar +
        fieldStr.replace(new RegExp(this.quoteChar, 'g'), this.escapeChar + this.quoteChar) +
        this.quoteChar
      );
    }

    return fieldStr;
  }

  /**
   * 导出数据为 CSV 字符串
   */
  exportToString(
    data: ExportRow[],
    headers?: string[],
    includeHeaders: boolean = true
  ): string {
    if (data.length === 0) {
      return '';
    }

    const allHeaders = headers || Object.keys(data[0]);
    const rows: string[] = [];

    // 添加表头
    if (includeHeaders) {
      rows.push(allHeaders.map((h) => this.escapeField(h)).join(this.delimiter));
    }

    // 添加数据行
    data.forEach((row) => {
      const values = allHeaders.map((header) => this.escapeField(row[header]));
      rows.push(values.join(this.delimiter));
    });

    return rows.join(this.lineBreak);
  }

  /**
   * 导出数据为 CSV 文件
   */
  exportToFile(
    data: ExportRow[],
    config: CSVExportOptions,
    headers?: string[]
  ): void {
    const csvContent = this.exportToString(data, headers, config.includeHeaders !== false);
    const blob = new Blob([csvContent], {
      type: `text/csv;charset=${config.encoding || 'utf-8'}`,
    });
    this.downloadBlob(blob, config.filename);
  }

  /**
   * 下载 Blob
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

/**
 * Excel 导出服务（使用 XLSX 库）
 */
export class ExcelExporter {
  /**
   * 导出数据为 Excel 文件
   */
  async exportToFile(
    data: ExportRow[],
    config: ExcelExportOptions,
    headers?: string[]
  ): Promise<void> {
    try {
      // 动态导入 xlsx 库
      const XLSX = await import('xlsx');

      if (data.length === 0) {
        console.warn('No data to export');
        return;
      }

      const allHeaders = headers || Object.keys(data[0]);

      // 创建工作簿
      const workbook = XLSX.utils.book_new();

      // 准备数据
      const exportData = [
        config.includeHeaders !== false ? allHeaders : [],
        ...data.map((row) => allHeaders.map((header) => row[header] || '')),
      ].filter((row) => row.length > 0);

      // 创建工作表
      const worksheet = XLSX.utils.aoa_to_sheet(exportData);

      // 设置列宽
      if (config.columnWidths) {
        worksheet['!cols'] = config.columnWidths.map((width) => ({ wch: width }));
      }

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        config.sheetName || 'Sheet1'
      );

      // 写入文件
      const filename = config.filename.endsWith('.xlsx')
        ? config.filename
        : `${config.filename}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Excel export failed:', error);
      throw new Error('Failed to export Excel file');
    }
  }
}

/**
 * 通用数据导出服务
 */
export class DataExportService {
  private csvExporter: CSVExporter;
  private excelExporter: ExcelExporter;

  constructor() {
    this.csvExporter = new CSVExporter();
    this.excelExporter = new ExcelExporter();
  }

  /**
   * 导出为 CSV
   */
  exportAsCSV(
    data: ExportRow[],
    config: CSVExportOptions,
    headers?: string[]
  ): void {
    this.csvExporter.exportToFile(data, config, headers);
  }

  /**
   * 导出为 Excel
   */
  async exportAsExcel(
    data: ExportRow[],
    config: ExcelExportOptions,
    headers?: string[]
  ): Promise<void> {
    await this.excelExporter.exportToFile(data, config, headers);
  }

  /**
   * 获取 CSV 字符串（用于预览或进一步处理）
   */
  getCSVString(
    data: ExportRow[],
    headers?: string[],
    delimiter: string = ','
  ): string {
    const exporter = new CSVExporter({ delimiter });
    return exporter.exportToString(data, headers);
  }

  /**
   * 格式化数据为导出格式
   */
  formatDataForExport(
    data: Record<string, any>[],
    fieldMapping?: Record<string, string> | string[]
  ): ExportRow[] {
    return data.map((item) => {
      const row: ExportRow = {};
      const isMapping = fieldMapping && !Array.isArray(fieldMapping);
      const keys = isMapping ? Object.keys(fieldMapping as Record<string, string>) : Object.keys(item);

      keys.forEach((key) => {
        const displayKey = isMapping ? (fieldMapping as Record<string, string>)[key] : key;
        const value = item[key];

        // 格式化值
        if (value === null || value === undefined) {
          row[displayKey] = '';
        } else if (typeof value === 'boolean') {
          row[displayKey] = value ? '是' : '否';
        } else if (typeof value === 'number') {
          row[displayKey] = value;
        } else if (value instanceof Date) {
          row[displayKey] = value.toISOString();
        } else if (typeof value === 'object') {
          row[displayKey] = JSON.stringify(value);
        } else {
          row[displayKey] = String(value);
        }
      });

      return row;
    });
  }

  /**
   * 获取 Excel Buffer（用于下载）
   */
  async getExcelBuffer(
    data: ExportRow[],
    headers?: string[],
    sheetName: string = 'Sheet1'
  ): Promise<ArrayBuffer> {
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      
      const allHeaders = headers || Object.keys(data[0] || {});
      const exportData = [
        allHeaders,
        ...data.map((row) => allHeaders.map((header) => row[header] || '')),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      return buffer;
    } catch (error) {
      console.error('Excel buffer generation failed:', error);
      throw new Error('Failed to generate Excel buffer');
    }
  }

  /**
   * 获取多工作表 Excel Buffer
   */
  async getMultiSheetExcelBuffer(
    datasets: Array<{
      name: string;
      data: ExportRow[];
      headers?: string[];
    }>
  ): Promise<ArrayBuffer> {
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();

      for (const dataset of datasets) {
        const allHeaders = dataset.headers || Object.keys(dataset.data[0] || {});
        const exportData = [
          allHeaders,
          ...dataset.data.map((row) => allHeaders.map((header) => row[header] || '')),
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, worksheet, dataset.name);
      }

      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      return buffer;
    } catch (error) {
      console.error('Multi-sheet Excel buffer generation failed:', error);
      throw new Error('Failed to generate multi-sheet Excel buffer');
    }
  }

  /**
   * 批量导出多个数据集为 Excel（多个工作表）
   */
  async exportMultipleSheets(
    datasets: Array<{
      data: ExportRow[];
      sheetName: string;
      headers?: string[];
    }>,
    filename: string
  ): Promise<void> {
    try {
      const XLSX = await import('xlsx');

      const workbook = XLSX.utils.book_new();

      for (const dataset of datasets) {
        const allHeaders = dataset.headers || Object.keys(dataset.data[0] || {});
        const exportData = [
          allHeaders,
          ...dataset.data.map((row) => allHeaders.map((header) => row[header] || '')),
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, worksheet, dataset.sheetName);
      }

      const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
      XLSX.writeFile(workbook, finalFilename);
    } catch (error) {
      console.error('Multi-sheet export failed:', error);
      throw new Error('Failed to export multi-sheet Excel file');
    }
  }
}

/**
 * 创建全局数据导出服务实例
 */
export const createDataExportService = (): DataExportService => {
  return new DataExportService();
};

/**
 * 导出服务单例
 */
let exportServiceInstance: DataExportService | null = null;

export const getDataExportService = (): DataExportService => {
  if (!exportServiceInstance) {
    exportServiceInstance = createDataExportService();
  }
  return exportServiceInstance;
};
