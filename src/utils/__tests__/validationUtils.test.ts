import { z } from 'zod';
import { ValidationUtils, createAsyncValidator, validateForm } from '../validationUtils';

describe('ValidationUtils', () => {
  describe('email validation', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@gmail.com',
        'firstname.lastname@company.org',
      ];

      validEmails.forEach(email => {
        expect(ValidationUtils.isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        '',
        'test space@example.com',
      ];

      invalidEmails.forEach(email => {
        expect(ValidationUtils.isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('password validation', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'Passw0rd!',
        'MySecure123!',
        'Complex@Pass1',
        'StrongP@ssw0rd',
      ];

      strongPasswords.forEach(password => {
        const result = ValidationUtils.isValidPassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'password',      // no uppercase, numbers, symbols
        'PASSWORD',      // no lowercase, numbers, symbols
        '12345678',      // no letters, symbols
        'Pass123',       // no symbols
        'Pass!',         // too short
        '',              // empty
        'Aa1!',          // too short
      ];

      weakPasswords.forEach(password => {
        const result = ValidationUtils.isValidPassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should provide specific error messages for password issues', () => {
      const result = ValidationUtils.isValidPassword('short');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('file validation', () => {
    const createMockFile = (name: string, size: number, type: string): File => {
      const file = new File([''], name, { type });
      Object.defineProperty(file, 'size', { value: size });
      return file;
    };

    it('should validate correct file types and sizes', () => {
      const validFile = createMockFile('invoice.pdf', 1024 * 1024, 'application/pdf'); // 1MB PDF
      const result = ValidationUtils.validateFile(validFile);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files that are too large', () => {
      const largeFile = createMockFile('huge.pdf', 20 * 1024 * 1024, 'application/pdf'); // 20MB
      const result = ValidationUtils.validateFile(largeFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid file types', () => {
      const invalidFile = createMockFile('script.exe', 1024, 'application/octet-stream');
      const result = ValidationUtils.validateFile(invalidFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('amount validation', () => {
    it('should validate positive amounts', () => {
      const validAmounts = [100, '100', 0.01, '0.01', 999999.99];
      
      validAmounts.forEach(amount => {
        const result = ValidationUtils.isValidAmount(amount);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid amounts', () => {
      const invalidAmounts = [-100, 0, NaN, 'invalid', 10000000]; // too large
      
      invalidAmounts.forEach(amount => {
        const result = ValidationUtils.isValidAmount(amount);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('currency validation', () => {
    it('should validate supported currencies', () => {
      expect(ValidationUtils.isValidCurrency('USD')).toBe(true);
      expect(ValidationUtils.isValidCurrency('EUR')).toBe(true);
      expect(ValidationUtils.isValidCurrency('GBP')).toBe(true);
    });

    it('should reject unsupported currencies', () => {
      expect(ValidationUtils.isValidCurrency('XYZ')).toBe(false);
      expect(ValidationUtils.isValidCurrency('')).toBe(false);
      expect(ValidationUtils.isValidCurrency('invalid')).toBe(false);
    });
  });

  describe('required field validation', () => {
    it('should validate non-empty values', () => {
      const validValues = ['test', 123, true, [], {}];
      
      validValues.forEach(value => {
        const result = ValidationUtils.isRequired(value);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject empty or null values', () => {
      const invalidValues = [null, undefined, '', '   '];
      
      invalidValues.forEach(value => {
        const result = ValidationUtils.isRequired(value);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('string length validation', () => {
    it('should validate string within length limits', () => {
      const result = ValidationUtils.validateStringLength('hello', 3, 10);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject strings too short', () => {
      const result = ValidationUtils.validateStringLength('hi', 5);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 5 characters');
    });

    it('should reject strings too long', () => {
      const result = ValidationUtils.validateStringLength('very long string', 0, 5);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('no more than 5 characters');
    });
  });

  describe('URL validation', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://www.example.com',
        'https://example.com/path',
        'ftp://files.example.com',
      ];

      validUrls.forEach(url => {
        expect(ValidationUtils.isValidUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'http://',
        '',
        'example.com',
        'www.example.com',
      ];

      invalidUrls.forEach(url => {
        expect(ValidationUtils.isValidUrl(url)).toBe(false);
      });
    });
  });

  describe('phone number validation', () => {
    it('should validate correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '(123) 456-7890',
        '123-456-7890',
        '+44 20 1234 5678',
      ];

      validPhones.forEach(phone => {
        expect(ValidationUtils.isValidPhoneNumber(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        'abc-def-ghij',
        '',
        '123-456',
      ];

      invalidPhones.forEach(phone => {
        expect(ValidationUtils.isValidPhoneNumber(phone)).toBe(false);
      });
    });
  });

  describe('date validation', () => {
    it('should validate correct date strings', () => {
      const validDates = [
        '2024-01-15',
        '2024-12-31',
        '2024-06-30',
      ];

      validDates.forEach(date => {
        const result = ValidationUtils.isValidDate(date);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid date strings', () => {
      const invalidDates = [
        'invalid-date',
        '2024-13-01',
        '2024-02-30',
        '',
      ];

      invalidDates.forEach(date => {
        const result = ValidationUtils.isValidDate(date);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('UUID validation', () => {
    it('should validate correct UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      ];

      validUUIDs.forEach(uuid => {
        expect(ValidationUtils.isValidUUID(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456',
        '',
        '123e4567-e89b-12d3-a456-426614174000-extra',
      ];

      invalidUUIDs.forEach(uuid => {
        expect(ValidationUtils.isValidUUID(uuid)).toBe(false);
      });
    });
  });

  describe('HTML sanitization', () => {
    it('should sanitize HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = ValidationUtils.sanitizeHtml(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello World');
    });

    it('should preserve safe content', () => {
      const input = 'Just plain text';
      const result = ValidationUtils.sanitizeHtml(input);
      
      expect(result).toBe(input);
    });
  });

  describe('hex color validation', () => {
    it('should validate correct hex colors', () => {
      const validColors = ['#ff0000', '#00FF00', '#0000ff', '#123abc'];
      
      validColors.forEach(color => {
        expect(ValidationUtils.isValidHexColor(color)).toBe(true);
      });
    });

    it('should reject invalid hex colors', () => {
      const invalidColors = ['red', '#xyz', '#12345', 'ff0000'];
      
      invalidColors.forEach(color => {
        expect(ValidationUtils.isValidHexColor(color)).toBe(false);
      });
    });
  });

  describe('array validation', () => {
    it('should validate arrays with sufficient length', () => {
      const result = ValidationUtils.validateArrayMinLength([1, 2, 3], 2);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject arrays with insufficient length', () => {
      const result = ValidationUtils.validateArrayMinLength([1], 3);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('invoice number validation', () => {
    it('should validate correct invoice numbers', () => {
      const validNumbers = ['INV-2024-001', '2024-INV-123', 'INVOICE-001'];
      
      validNumbers.forEach(number => {
        const result = ValidationUtils.isValidInvoiceNumber(number);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid invoice numbers', () => {
      const invalidNumbers = ['', 'a', '1234567890123456789012345678901234567890'];
      
      invalidNumbers.forEach(number => {
        const result = ValidationUtils.isValidInvoiceNumber(number);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('tax rate validation', () => {
    it('should validate correct tax rates', () => {
      const validRates = [0, 0.05, 0.1, 0.25];
      
      validRates.forEach(rate => {
        const result = ValidationUtils.isValidTaxRate(rate);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid tax rates', () => {
      const invalidRates = [-0.1, 101.5, NaN];
      
      invalidRates.forEach(rate => {
        const result = ValidationUtils.isValidTaxRate(rate);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });
});

describe('validateForm function', () => {
  it('should validate form data against Zod schema', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });

    const validData = { name: 'John', age: 25 };
    const result = validateForm(validData, schema);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.data).toEqual(validData);
  });

  it('should return validation errors for invalid data', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });

    const invalidData = { name: '', age: -5 };
    const result = validateForm(invalidData, schema);
    
    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    expect(result.data).toBeUndefined();
  });
});

describe('createAsyncValidator function', () => {
  it('should create async validator that resolves', async () => {
    const validationFn = jest.fn().mockResolvedValue(true);
    const validator = createAsyncValidator(validationFn, 'Error message');
    
    const result = await validator('test-value');
    
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(validationFn).toHaveBeenCalledWith('test-value');
  });

  it('should create async validator that rejects', async () => {
    const validationFn = jest.fn().mockResolvedValue(false);
    const validator = createAsyncValidator(validationFn, 'Custom error');
    
    const result = await validator('test-value');
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Custom error');
  });

  it('should handle async validator errors', async () => {
    const validationFn = jest.fn().mockRejectedValue(new Error('Async error'));
    const validator = createAsyncValidator(validationFn, 'Error message');
    
    const result = await validator('test-value');
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Error message');
  });
}); 