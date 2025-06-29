import type { ExtractedInvoiceData } from '@/schema/aiSchema';
import type { Invoice } from '@/schema/invoiceSchema';
import { AIUtils } from '../aiUtils';

describe('AIUtils', () => {
  describe('processExtractionResponse', () => {
    it('should return error for invalid response', () => {
      const res = AIUtils.processExtractionResponse(null);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Invalid response/);
    });
    it('should process valid response', () => {
      const response = {
        invoiceNumber: 'INV-001',
        supplierName: 'Acme Inc.',
        subtotal: 100,
        taxAmount: 10,
        totalAmount: 110,
        currency: 'USD',
        invoiceDate: '2024-06-01',
        dueDate: '2024-07-01',
      };
      const res = AIUtils.processExtractionResponse(response);
      expect(res.success).toBe(true);
      expect(res.data?.invoiceNumber).toBe('INV-001');
      expect(res.data?.supplierName).toBe('Acme Inc.');
      expect(res.data?.subtotal).toBe(100);
      expect(res.data?.taxAmount).toBe(10);
      expect(res.data?.totalAmount).toBe(110);
      expect(res.data?.currency).toBe('USD');
      expect(res.data?.invoiceDate).toBe('2024-06-01');
      expect(res.data?.dueDate).toBe('2024-07-01');
    });
    it('should handle missing/invalid fields gracefully', () => {
      const response = { subtotal: 'not-a-number', invoiceDate: 'invalid-date' };
      const res = AIUtils.processExtractionResponse(response);
      expect(res.success).toBe(true);
      expect(res.data?.subtotal).toBeUndefined();
      expect(res.data?.invoiceDate).toBeUndefined();
    });
  });

  describe('extractString', () => {
    it('should extract valid string', () => {
      expect(AIUtils.extractString('hello')).toBe('hello');
      expect(AIUtils.extractString('  world  ')).toBe('world');
    });
    it('should return undefined for empty/invalid', () => {
      expect(AIUtils.extractString('')).toBeUndefined();
      expect(AIUtils.extractString('   ')).toBeUndefined();
      expect(AIUtils.extractString(null)).toBeUndefined();
      expect(AIUtils.extractString(undefined)).toBeUndefined();
    });
  });

  describe('extractNumber', () => {
    it('should extract valid number', () => {
      expect(AIUtils.extractNumber(123)).toBe(123);
      expect(AIUtils.extractNumber('123.45')).toBe(123.45);
      expect(AIUtils.extractNumber('  99.99  ')).toBe(99.99);
      expect(AIUtils.extractNumber('$100.50')).toBe(100.5);
    });
    it('should return undefined for invalid', () => {
      expect(AIUtils.extractNumber('abc')).toBeUndefined();
      expect(AIUtils.extractNumber(-1)).toBeUndefined();
      expect(AIUtils.extractNumber('')).toBeUndefined();
      expect(AIUtils.extractNumber(null)).toBeUndefined();
    });
  });

  describe('extractDateString', () => {
    it('should extract valid date string', () => {
      expect(AIUtils.extractDateString('2024-06-01')).toBe('2024-06-01');
      expect(AIUtils.extractDateString('2024-12-31')).toBe('2024-12-31');
    });
    it('should return undefined for invalid', () => {
      expect(AIUtils.extractDateString('not-a-date')).toBeUndefined();
      expect(AIUtils.extractDateString('')).toBeUndefined();
      expect(AIUtils.extractDateString(null)).toBeUndefined();
    });
  });

  describe('validateExtractionData', () => {
    const base: ExtractedInvoiceData = {
      invoiceNumber: 'INV-001',
      supplierName: 'Acme',
      subtotal: 100,
      taxAmount: 10,
      totalAmount: 110,
      currency: 'USD',
      invoiceDate: '2024-06-01',
      dueDate: '2024-07-01',
    };
    it('should be valid if all required fields present and correct', () => {
      const result = AIUtils.validateExtractionData(base);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
    it('should error if totalAmount missing', () => {
      const data = { ...base, totalAmount: undefined };
      const result = AIUtils.validateExtractionData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'totalAmount')).toBe(true);
    });
    it('should warn if supplierName missing', () => {
      const data = { ...base, supplierName: undefined };
      const result = AIUtils.validateExtractionData(data);
      expect(result.warnings.some(w => w.field === 'supplierName')).toBe(true);
    });
    it('should error if subtotal + taxAmount != totalAmount', () => {
      const data = { ...base, subtotal: 100, taxAmount: 10, totalAmount: 120 };
      const result = AIUtils.validateExtractionData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'CALCULATION_ERROR')).toBe(true);
    });
  });

  describe('suggestCategory', () => {
    const base: ExtractedInvoiceData = { supplierName: 'Acme Office Supplies' };
    it('should suggest OFFICE_SUPPLIES for office/supplies', () => {
      const res = AIUtils.suggestCategory(base);
      expect(res.suggestedCategory).toBe('OFFICE_SUPPLIES');
      expect(res.confidence).toBeGreaterThanOrEqual(0.8);
    });
    it('should suggest SOFTWARE_TECH for software/tech', () => {
      const res = AIUtils.suggestCategory({ supplierName: 'Best Software' });
      expect(res.suggestedCategory).toBe('SOFTWARE_TECH');
    });
    it('should suggest TRAVEL_TRANSPORT for hotel/travel', () => {
      const res = AIUtils.suggestCategory({ supplierName: 'Grand Hotel' });
      expect(res.suggestedCategory).toBe('TRAVEL_TRANSPORT');
    });
    it('should suggest UTILITIES for electric/gas', () => {
      const res = AIUtils.suggestCategory({ supplierName: 'City Electric' });
      expect(res.suggestedCategory).toBe('UTILITIES');
    });
    it('should use historical most common category', () => {
      const data: ExtractedInvoiceData = { supplierName: 'Acme' };
      const historical: Invoice[] = [
        { supplierName: 'Acme', category: 'SOFTWARE_TECH' } as Invoice,
        { supplierName: 'Acme', category: 'SOFTWARE_TECH' } as Invoice,
        { supplierName: 'Acme', category: 'OFFICE_SUPPLIES' } as Invoice,
      ];
      const res = AIUtils.suggestCategory(data, historical);
      expect(res.suggestedCategory).toBe('SOFTWARE_TECH');
      expect(res.confidence).toBeGreaterThan(0.6);
    });
    it('should default to OTHER if no match', () => {
      const res = AIUtils.suggestCategory({ supplierName: 'Unknown' });
      expect(res.suggestedCategory).toBe('OTHER');
    });
  });

  describe('generateCategoryReasoning', () => {
    it('should generate reasoning string', () => {
      const reason = AIUtils.generateCategoryReasoning('OFFICE_SUPPLIES', 'acme');
      expect(typeof reason).toBe('string');
      expect(reason.length).toBeGreaterThan(0);
    });
  });

  describe('formatForStorage', () => {
    it('should format extracted data for storage', () => {
      const data: ExtractedInvoiceData = {
        invoiceNumber: 'INV-001',
        supplierName: 'Acme',
        subtotal: 100,
        taxAmount: 10,
        totalAmount: 110,
        currency: 'USD',
        invoiceDate: '2024-06-01',
        dueDate: '2024-07-01',
      };
      const result = AIUtils.formatForStorage(data);
      expect(result.invoiceNumber).toBe('INV-001');
      expect(result.supplierName).toBe('Acme');
      expect(result.subtotal).toBe(100);
      expect(result.taxAmount).toBe(10);
      expect(result.totalAmount).toBe(110);
      expect(result.currency).toBe('USD');
      expect(result.invoiceDate).toBeInstanceOf(Date);
      expect(result.invoiceDate?.toISOString().slice(0, 10)).toBe('2024-06-01');
      expect(result.dueDate).toBeInstanceOf(Date);
      expect(result.dueDate?.toISOString().slice(0, 10)).toBe('2024-07-01');
    });
    it('should handle missing fields gracefully', () => {
      const data: ExtractedInvoiceData = {};
      const result = AIUtils.formatForStorage(data);
      expect(result).toBeDefined();
    });
  });

  describe('createExtractionPrompt', () => {
    it('should return system and user prompt', () => {
      const prompt = AIUtils.createExtractionPrompt();
      expect(prompt).toHaveProperty('system');
      expect(prompt).toHaveProperty('user');
      expect(typeof prompt.system).toBe('string');
      expect(typeof prompt.user).toBe('string');
    });
  });

  describe('validateConfiguration', () => {
    it('should return isValid and errors array', () => {
      const result = AIUtils.validateConfiguration();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
}); 