import { ExportField, ExportOptions } from '@/schema/exportSchema';
import { ExportUtils } from '../exportUtils';

describe('ExportUtils', () => {
  const sampleData = [
    {
      invoiceNumber: 'INV-001',
      supplierName: 'Acme',
      invoiceDate: '2024-06-01',
      dueDate: '2024-07-01',
      subtotal: 100,
      taxAmount: 10,
      totalAmount: 110,
      currency: 'AUD',
      categoryName: 'Office',
      status: 'COMPLETED',
      supplierAddress: '123 Main St',
      supplierTaxId: 'ABN123',
      taxRate: 10,
      createdAt: '2024-06-01',
      updatedAt: '2024-06-02',
    },
    {
      invoiceNumber: 'INV-002',
      supplierName: 'Beta',
      invoiceDate: '2024-06-05',
      dueDate: '2024-07-05',
      subtotal: 200,
      taxAmount: 20,
      totalAmount: 220,
      currency: 'AUD',
      categoryName: 'Travel',
      status: 'PENDING',
      supplierAddress: '456 Side St',
      supplierTaxId: 'ABN456',
      taxRate: 10,
      createdAt: '2024-06-05',
      updatedAt: '2024-06-06',
    },
  ];

  const fields: ExportField[] = ExportUtils.DEFAULT_INVOICE_FIELDS.map(f => ({ ...f, included: true }));
  const options: ExportOptions = ExportUtils.createExportOptions('CSV', fields);

  it('should create export options with defaults', () => {
    const opts = ExportUtils.createExportOptions('CSV');
    expect(opts.format).toBe('CSV');
    expect(opts.includeHeaders).toBe(true);
    expect(opts.dateFormat).toBe('DD/MM/YYYY');
    expect(opts.currency).toBe('AUD');
    expect(Array.isArray(opts.fields)).toBe(true);
  });

  it('should filter data by category', () => {
    const filtered = ExportUtils.filterData(sampleData, { categories: ['Office'] });
    expect(filtered.length).toBe(1);
    expect(filtered[0].categoryName).toBe('Office');
  });

  it('should filter data by date range', () => {
    const filtered = ExportUtils.filterData(sampleData, {
      dateRange: { from: new Date('2024-06-02'), to: new Date('2024-06-10') },
    });
    expect(filtered.length).toBe(1);
    expect(filtered[0].invoiceNumber).toBe('INV-002');
  });

  it('should transform data for export', () => {
    const transformed = ExportUtils.transformDataForExport(sampleData, fields, options);
    expect(transformed[0]['Invoice Number']).toBe('INV-001');
    expect(typeof transformed[0]['Subtotal']).toBe('string');
    expect(transformed[0]['Invoice Date']).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('should generate filename with prefix and format', () => {
    const filename = ExportUtils.generateFilename('test', 'CSV', new Date('2024-06-01T12:00:00Z'));
    expect(filename).toMatch(/^test_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-\d{3}\.csv$/);
  });

  it('should create valid CSV content', () => {
    const transformed = ExportUtils.transformDataForExport(sampleData, fields, options);
    const csv = ExportUtils.createCSVContent(transformed, options);
    expect(csv).toContain('Invoice Number');
    expect(csv).toContain('INV-001');
    expect(csv.split('\n').length).toBeGreaterThan(2);
  });

  it('should validate export options', () => {
    const valid = ExportUtils.validateExportOptions(options);
    expect(valid.isValid).toBe(true);
    const invalid = ExportUtils.validateExportOptions({ ...options, fields: [] });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });

  it('should merge export options', () => {
    const base = ExportUtils.createExportOptions('CSV');
    const merged = ExportUtils.mergeExportOptions(base, { currency: 'USD' });
    expect(merged.currency).toBe('USD');
    expect(merged.format).toBe('CSV');
  });
}); 