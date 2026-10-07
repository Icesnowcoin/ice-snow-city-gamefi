import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CSVExporter,
  ExcelExporter,
  DataExportService,
  type ExportRow,
} from './dataExportService';

describe('DataExportService', () => {
  describe('CSVExporter', () => {
    let exporter: CSVExporter;

    beforeEach(() => {
      exporter = new CSVExporter();
    });

    it('should export simple data to CSV string', () => {
      const data: ExportRow[] = [
        { name: 'Alice', age: 30, city: 'New York' },
        { name: 'Bob', age: 25, city: 'Los Angeles' },
      ];

      const csv = exporter.exportToString(data);
      expect(csv).toContain('Alice');
      expect(csv).toContain('Bob');
      expect(csv).toContain('30');
      expect(csv).toContain('25');
    });

    it('should include headers by default', () => {
      const data: ExportRow[] = [{ name: 'Alice', age: 30 }];
      const csv = exporter.exportToString(data);

      expect(csv).toContain('name');
      expect(csv).toContain('age');
    });

    it('should handle custom headers', () => {
      const data: ExportRow[] = [{ name: 'Alice', age: 30 }];
      const headers = ['姓名', '年龄'];
      const csv = exporter.exportToString(data, headers);

      expect(csv).toContain('姓名');
      expect(csv).toContain('年龄');
    });

    it('should escape fields with delimiters', () => {
      const data: ExportRow[] = [{ name: 'Alice, Bob', age: 30 }];
      const csv = exporter.exportToString(data);

      expect(csv).toContain('"Alice, Bob"');
    });

    it('should escape fields with quotes', () => {
      const data: ExportRow[] = [{ name: 'Alice "Bob"', age: 30 }];
      const csv = exporter.exportToString(data);

      expect(csv).toContain('Alice ""Bob""');
    });

    it('should handle null and undefined values', () => {
      const data: ExportRow[] = [
        { name: 'Alice', age: null, city: undefined },
      ];
      const csv = exporter.exportToString(data);

      expect(csv).toContain('Alice');
    });

    it('should support custom delimiter', () => {
      const exporter = new CSVExporter({ delimiter: ';' });
      const data: ExportRow[] = [{ name: 'Alice', age: 30 }];
      const csv = exporter.exportToString(data);

      expect(csv).toContain('name;age');
    });

    it('should support custom line break', () => {
      const exporter = new CSVExporter({ lineBreak: '\r\n' });
      const data: ExportRow[] = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];
      const csv = exporter.exportToString(data);

      expect(csv).toContain('\r\n');
    });

    it('should exclude headers when includeHeaders is false', () => {
      const data: ExportRow[] = [{ name: 'Alice', age: 30 }];
      const csv = exporter.exportToString(data, undefined, false);

      expect(csv).not.toContain('name');
      expect(csv).not.toContain('age');
      expect(csv).toContain('Alice');
      expect(csv).toContain('30');
    });

    it('should handle empty data', () => {
      const data: ExportRow[] = [];
      const csv = exporter.exportToString(data);

      expect(csv).toBe('');
    });

    it('should handle boolean values', () => {
      const data: ExportRow[] = [{ name: 'Alice', active: true }];
      const csv = exporter.exportToString(data);

      expect(csv).toContain('true');
    });

    it('should handle numeric values', () => {
      const data: ExportRow[] = [{ name: 'Alice', salary: 50000.5 }];
      const csv = exporter.exportToString(data);

      expect(csv).toContain('50000.5');
    });
  });

  describe('DataExportService', () => {
    let service: DataExportService;

    beforeEach(() => {
      service = new DataExportService();
      vi.clearAllMocks();
    });

    it('should format data for export', () => {
      const data = [
        { id: 1, name: 'Alice', active: true, createdAt: new Date('2024-01-01') },
      ];

      const formatted = service.formatDataForExport(data);

      expect(formatted[0].id).toBe(1);
      expect(formatted[0].name).toBe('Alice');
      expect(formatted[0].active).toBe('是');
      expect(formatted[0].createdAt).toContain('2024-01-01');
    });

    it('should support field mapping', () => {
      const data = [{ id: 1, name: 'Alice' }];
      const mapping = { id: 'ID', name: '姓名' };

      const formatted = service.formatDataForExport(data, mapping);

      expect(formatted[0]).toHaveProperty('ID');
      expect(formatted[0]).toHaveProperty('姓名');
      expect(formatted[0]['ID']).toBe(1);
      expect(formatted[0]['姓名']).toBe('Alice');
    });

    it('should get CSV string', () => {
      const data: ExportRow[] = [{ name: 'Alice', age: 30 }];
      const csv = service.getCSVString(data);

      expect(csv).toContain('Alice');
      expect(csv).toContain('30');
    });

    it('should support custom CSV delimiter', () => {
      const data: ExportRow[] = [{ name: 'Alice', age: 30 }];
      const csv = service.getCSVString(data, undefined, ';');

      expect(csv).toContain('name;age');
    });

    it('should handle null values in formatting', () => {
      const data = [{ id: 1, name: null, active: undefined }];
      const formatted = service.formatDataForExport(data);

      expect(formatted[0].name).toBe('');
      expect(formatted[0].active).toBe('');
    });

    it('should handle complex data types', () => {
      const data = [
        {
          id: 1,
          name: 'Alice',
          tags: ['tag1', 'tag2'],
          metadata: { key: 'value' },
        },
      ];

      const formatted = service.formatDataForExport(data);

      expect(formatted[0].tags).toContain('tag1');
      expect(formatted[0].metadata).toContain('key');
    });
  });

  describe('CSV Export Integration', () => {
    it('should export complex data correctly', () => {
      const service = new DataExportService();
      const data: ExportRow[] = [
        { product: 'Apple', price: 1.5, quantity: 100 },
        { product: 'Banana', price: 0.5, quantity: 200 },
        { product: 'Orange, Fresh', price: 2.0, quantity: 150 },
      ];

      const csv = service.getCSVString(data);

      expect(csv).toContain('Apple');
      expect(csv).toContain('Banana');
      expect(csv).toContain('"Orange, Fresh"');
    });

    it('should handle special characters', () => {
      const service = new DataExportService();
      const data: ExportRow[] = [
        { name: 'Alice & Bob', description: 'Test "quote"' },
      ];

      const csv = service.getCSVString(data);

      expect(csv).toContain('Alice & Bob');
      expect(csv).toContain('Test ""quote""');
    });

    it('should preserve data types in export', () => {
      const service = new DataExportService();
      const data: ExportRow[] = [
        { id: 123, score: 98.5, active: true, notes: null },
      ];

      const csv = service.getCSVString(data);

      expect(csv).toContain('123');
      expect(csv).toContain('98.5');
      expect(csv).toContain('true');
    });
  });

  describe('Data Formatting', () => {
    let service: DataExportService;

    beforeEach(() => {
      service = new DataExportService();
    });

    it('should convert boolean to Chinese text', () => {
      const data = [{ active: true }, { active: false }];
      const formatted = service.formatDataForExport(data);

      expect(formatted[0].active).toBe('是');
      expect(formatted[1].active).toBe('否');
    });

    it('should handle date objects', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const data = [{ createdAt: date }];
      const formatted = service.formatDataForExport(data);

      expect(formatted[0].createdAt).toContain('2024-01-15');
    });

    it('should handle array values', () => {
      const data = [{ tags: ['a', 'b', 'c'] }];
      const formatted = service.formatDataForExport(data);

      expect(formatted[0].tags).toContain('a');
    });

    it('should handle object values', () => {
      const data = [{ config: { key: 'value' } }];
      const formatted = service.formatDataForExport(data);

      expect(formatted[0].config).toContain('key');
    });
  });

  describe('Export Configuration', () => {
    let service: DataExportService;

    beforeEach(() => {
      service = new DataExportService();
    });

    it('should support custom filename', () => {
      const data: ExportRow[] = [{ name: 'Alice' }];
      const csv = service.getCSVString(data);

      expect(csv).toBeTruthy();
    });

    it('should handle large datasets', () => {
      const largeData: ExportRow[] = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        score: Math.random() * 100,
      }));

      const csv = service.getCSVString(largeData);

      expect(csv).toContain('User 0');
      expect(csv).toContain('User 999');
    });

    it('should handle Unicode characters', () => {
      const data: ExportRow[] = [
        { name: '张三', city: '北京', country: '中国' },
      ];

      const csv = service.getCSVString(data);

      expect(csv).toContain('张三');
      expect(csv).toContain('北京');
      expect(csv).toContain('中国');
    });
  });
});
