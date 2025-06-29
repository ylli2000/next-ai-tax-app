import { ERROR_MESSAGES, UPLOAD_CONSTANTS } from './constants';
import { FormatUtils } from './formatUtils';

/**
 * File utility functions for handling file operations
 */
export class FileUtils {
  /**
   * Convert file to base64 string
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:image/jpeg;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Convert base64 string to file
   */
  static base64ToFile(base64: string, filename: string, mimeType: string): File {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], filename, { type: mimeType });
  }

  /**
   * Convert file to array buffer
   */
  static async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Convert file to text content
   */
  static async fileToText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex >= 0 ? filename.slice(lastDotIndex) : '';
  }

  /**
   * Get file name without extension
   */
  static getFileNameWithoutExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex >= 0 ? filename.slice(0, lastDotIndex) : filename;
  }

  /**
   * Check if file type is supported image
   */
  static isImageFile(file: File | string): boolean {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    
    if (typeof file === 'string') {
      const extension = this.getFileExtension(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(extension);
    }
    
    return imageTypes.includes(file.type);
  }

  /**
   * Check if file type is supported document
   */
  static isDocumentFile(file: File | string): boolean {
    const documentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (typeof file === 'string') {
      const extension = this.getFileExtension(file).toLowerCase();
      return ['.pdf', '.doc', '.docx'].includes(extension);
    }
    
    return documentTypes.includes(file.type);
  }

  /**
   * Check if file is PDF
   */
  static isPdfFile(file: File | string): boolean {
    if (typeof file === 'string') {
      return this.getFileExtension(file).toLowerCase() === '.pdf';
    }
    
    return file.type === 'application/pdf';
  }

  /**
   * Validate file against upload constraints
   */
  static validateFile(file: File): {
    isValid: boolean;
    error?: string;
  } {
    // Check file size
    if (file.size > UPLOAD_CONSTANTS.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `${ERROR_MESSAGES.FILE_TOO_LARGE} (${FormatUtils.formatFileSize(file.size)})`,
      };
    }

    // Check file type
    if (!(UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.INVALID_FILE_TYPE,
      };
    }

    // Check file extension
    const extension = this.getFileExtension(file.name).toLowerCase();
    if (!(UPLOAD_CONSTANTS.ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.INVALID_FILE_TYPE,
      };
    }

    return { isValid: true };
  }

  /**
   * Compress image file
   */
  static async compressImage(
    file: File,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      outputFormat?: string;
    } = {}
  ): Promise<File> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      outputFormat = 'image/jpeg',
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: outputFormat,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          outputFormat,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate file preview URL
   */
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke file preview URL
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Generate unique filename
   */
  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = this.getFileExtension(originalName);
    const nameWithoutExt = this.getFileNameWithoutExtension(originalName);
    
    return `${nameWithoutExt}_${timestamp}_${random}${extension}`;
  }

  /**
   * Sanitize filename for safe storage
   */
  static sanitizeFilename(filename: string): string {
    // Remove or replace unsafe characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '_') // Replace unsafe characters with underscore
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .trim()
      .substring(0, 255); // Limit length to 255 characters
  }

  /**
   * Check if browser supports file reading
   */
  static supportsFileReader(): boolean {
    return typeof FileReader !== 'undefined';
  }

  /**
   * Check if browser supports drag and drop
   */
  static supportsDragAndDrop(): boolean {
    const div = document.createElement('div');
    return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
  }

  /**
   * Get file metadata
   */
  static getFileMetadata(file: File): {
    name: string;
    size: number;
    type: string;
    lastModified: number;
    extension: string;
    sizeFormatted: string;
    isImage: boolean;
    isDocument: boolean;
    isPdf: boolean;
  } {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      extension: this.getFileExtension(file.name),
      sizeFormatted: FormatUtils.formatFileSize(file.size),
      isImage: this.isImageFile(file),
      isDocument: this.isDocumentFile(file),
      isPdf: this.isPdfFile(file),
    };
  }

  /**
   * Download file from URL
   */
  static downloadFile(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Download data as file
   */
  static downloadData(data: string | Blob, filename: string, mimeType: string = 'application/octet-stream'): void {
    const blob = typeof data === 'string' ? new Blob([data], { type: mimeType }) : data;
    const url = URL.createObjectURL(blob);
    this.downloadFile(url, filename);
    URL.revokeObjectURL(url);
  }

  /**
   * Convert CSV data to downloadable file
   */
  static downloadCsv(data: string[][], filename: string = 'export.csv'): void {
    const csvContent = data.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    this.downloadData(csvContent, filename, 'text/csv');
  }

  /**
   * Convert JSON data to downloadable file
   */
  static downloadJson(data: unknown, filename: string = 'export.json'): void {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadData(jsonContent, filename, 'application/json');
  }

  /**
   * Read file from input element
   */
  static async readFileFromInput(input: HTMLInputElement): Promise<File[]> {
    return new Promise((resolve, reject) => {
      if (!input.files) {
        reject(new Error('No files selected'));
        return;
      }

      const files = Array.from(input.files);
      resolve(files);
    });
  }

  /**
   * Create file input element
   */
  static createFileInput(options: {
    accept?: string;
    multiple?: boolean;
    onChange?: (files: File[]) => void;
  } = {}): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = options.accept || UPLOAD_CONSTANTS.DEFAULT_ALLOWED_TYPES_STRING;
    input.multiple = options.multiple || false;
    input.style.display = 'none';

    if (options.onChange) {
      input.addEventListener('change', async () => {
        try {
          const files = await this.readFileFromInput(input);
          options.onChange!(files);
        } catch (error) {
          console.error('Error reading files:', error);
        }
      });
    }

    return input;
  }

  /**
   * Trigger file selection dialog
   */
  static selectFiles(options: {
    accept?: string;
    multiple?: boolean;
  } = {}): Promise<File[]> {
    return new Promise((resolve, reject) => {
      const input = this.createFileInput({
        ...options,
        onChange: (files) => resolve(files),
      });

      // Add to DOM temporarily
      document.body.appendChild(input);
      input.click();
      
      // Clean up after selection
      setTimeout(() => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }, 1000);

      // Handle cancel (no files selected)
      input.addEventListener('cancel', () => {
        reject(new Error('File selection cancelled'));
      });
    });
  }

  /**
   * Extract text content from file (for supported formats)
   */
  static async extractTextContent(file: File): Promise<string> {
    if (file.type === 'text/plain') {
      return this.fileToText(file);
    }

    // For other file types, you might want to integrate with libraries
    // like pdf-parse for PDFs or mammoth for Word documents
    throw new Error(`Text extraction not supported for file type: ${file.type}`);
  }

  /**
   * Batch validate multiple files
   */
  static validateFiles(files: File[]): {
    valid: File[];
    invalid: Array<{ file: File; error: string }>;
  } {
    const valid: File[] = [];
    const invalid: Array<{ file: File; error: string }> = [];

    files.forEach((file) => {
      const validation = this.validateFile(file);
      if (validation.isValid) {
        valid.push(file);
      } else {
        invalid.push({ file, error: validation.error || 'Unknown error' });
      }
    });

    return { valid, invalid };
  }

  /**
   * Calculate total size of multiple files
   */
  static calculateTotalSize(files: File[]): number {
    return files.reduce((total, file) => total + file.size, 0);
  }

  /**
   * Sort files by various criteria
   */
  static sortFiles(
    files: File[], 
    criteria: 'name' | 'size' | 'type' | 'lastModified' = 'name',
    ascending: boolean = true
  ): File[] {
    const sorted = [...files].sort((a, b) => {
      let comparison = 0;
      
      switch (criteria) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'lastModified':
          comparison = a.lastModified - b.lastModified;
          break;
      }
      
      return ascending ? comparison : -comparison;
    });

    return sorted;
  }
}

/**
 * Common file operation helpers
 */
export const fileHelpers = {
  /**
   * Validate single file
   */
  validate: (file: File) => FileUtils.validateFile(file),
  
  /**
   * Get file metadata
   */
  getMetadata: (file: File) => FileUtils.getFileMetadata(file),
  
  /**
   * Create preview URL
   */
  createPreview: (file: File) => FileUtils.createPreviewUrl(file),
  
  /**
   * Revoke preview URL
   */
  revokePreview: (url: string) => FileUtils.revokePreviewUrl(url),
  
  /**
   * Check if file is image
   */
  isImage: (file: File) => FileUtils.isImageFile(file),
  
  /**
   * Check if file is PDF
   */
  isPdf: (file: File) => FileUtils.isPdfFile(file),
  
  /**
   * Download data as file
   */
  download: (data: string | Blob, filename: string, mimeType?: string) => 
    FileUtils.downloadData(data, filename, mimeType),
  
  /**
   * Convert file to base64
   */
  toBase64: (file: File) => FileUtils.fileToBase64(file),
  
  /**
   * Select files from dialog
   */
  select: (options?: { accept?: string; multiple?: boolean }) => FileUtils.selectFiles(options),
}; 