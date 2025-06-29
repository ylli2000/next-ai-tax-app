import { FormatUtils, formatHelpers } from '../formatUtils';

describe('FormatUtils', () => {
  it('should format currency', () => {
    expect(FormatUtils.formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
    expect(FormatUtils.formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
    expect(FormatUtils.formatCurrency(-1234.56, 'USD')).toBe('-$1,234.56');
  });

  it('should format numbers', () => {
    expect(FormatUtils.formatNumber(1234.56)).toBe('1,234.56');
    expect(FormatUtils.formatNumber(0)).toBe('0');
    expect(FormatUtils.formatNumber(999999)).toBe('999,999');
  });

  it('should format percentages', () => {
    expect(FormatUtils.formatPercentage(10)).toBe('10%');
    expect(FormatUtils.formatPercentage(100)).toBe('100%');
  });

  it('should format file size', () => {
    expect(FormatUtils.formatFileSize(512)).toBe('512 B');
    expect(FormatUtils.formatFileSize(1024)).toBe('1 KB');
    expect(FormatUtils.formatFileSize(1024 * 1024)).toBe('1 MB');
  });

  it('should format phone number', () => {
    expect(FormatUtils.formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    expect(FormatUtils.formatPhoneNumber('+11234567890')).toBe('+1 (123) 456-7890');
    expect(FormatUtils.formatPhoneNumber('invalid')).toBe('');
  });

  it('should format to title/sentence case', () => {
    expect(FormatUtils.toTitleCase('hello world')).toBe('Hello World');
    expect(FormatUtils.toSentenceCase('hello world')).toBe('Hello world');
  });

  it('should format camel/snake/kebab to readable', () => {
    expect(FormatUtils.camelCaseToReadable('helloWorld')).toBe('Hello World');
    expect(FormatUtils.snakeCaseToReadable('hello_world')).toBe('Hello World');
    expect(FormatUtils.kebabCaseToReadable('hello-world')).toBe('Hello World');
  });

  it('should truncate text', () => {
    expect(FormatUtils.truncateText('This is a very long text', 10)).toBe('This is...');
    expect(FormatUtils.truncateText('short', 10)).toBe('short');
  });

  it('should format address', () => {
    expect(FormatUtils.formatAddress({ street: '123 Main', city: 'NY' })).toBe('123 Main, NY');
    expect(FormatUtils.formatAddress({})).toBe('');
  });

  it('should get initials', () => {
    expect(FormatUtils.getInitials('John Doe')).toBe('JD');
    expect(FormatUtils.getInitials('Mary Jane Smith')).toBe('MJ');
    expect(FormatUtils.getInitials('')).toBe('');
  });

  it('should format status badge', () => {
    expect(FormatUtils.formatStatusBadge('pending')).toBe('Pending');
    expect(FormatUtils.formatStatusBadge('completed')).toBe('Completed');
  });

  it('should format invoice number', () => {
    expect(FormatUtils.formatInvoiceNumber(1)).toBe('INV-000001');
    expect(FormatUtils.formatInvoiceNumber('123')).toBe('INV-000123');
  });

  it('should format tax ID', () => {
    expect(FormatUtils.formatTaxId('123456789')).toBe('12-3456789');
    expect(FormatUtils.formatTaxId('12-3456789')).toBe('12-3456789');
    expect(FormatUtils.formatTaxId('12345')).toBe('1234-5');
  });

  it('should format credit card', () => {
    expect(FormatUtils.formatCreditCard('1234567890123456')).toBe('**** **** **** 3456');
    expect(FormatUtils.formatCreditCard('12345')).toBe('*234 5');
  });
});

describe('formatHelpers', () => {
  it('should expose helper functions and work', () => {
    expect(typeof formatHelpers.currency).toBe('function');
    expect(formatHelpers.currency(1234.56)).toBe('A$1,234.56');
    expect(typeof formatHelpers.number).toBe('function');
    expect(formatHelpers.number(1234.56)).toBe('1,234.56');
    expect(typeof formatHelpers.percentage).toBe('function');
    expect(formatHelpers.percentage(0.25)).toBe('0.25%');
    expect(typeof formatHelpers.fileSize).toBe('function');
    expect(formatHelpers.fileSize(1024)).toBe('1 KB');
    expect(typeof formatHelpers.phone).toBe('function');
    expect(formatHelpers.phone('1234567890')).toBe('(123) 456-7890');
    expect(typeof formatHelpers.truncate).toBe('function');
    expect(formatHelpers.truncate('long text here', 9)).toBe('long t...');
    expect(typeof formatHelpers.initials).toBe('function');
    expect(formatHelpers.initials('John Doe')).toBe('JD');
  });
}); 