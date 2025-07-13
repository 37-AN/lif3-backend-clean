import { Injectable, Logger } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DocumentMetadata, DocumentCategory } from './interfaces/rag.interface';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  async processFile(
    filePath: string,
    fileName: string,
    userId: string,
    metadata?: Partial<DocumentMetadata>
  ): Promise<{ content: string; metadata: DocumentMetadata }> {
    try {
      const fileExtension = path.extname(fileName).toLowerCase();
      const fileStats = await fs.stat(filePath);
      
      let content = '';
      let category = this.determineCategory(fileName, fileExtension);

      switch (fileExtension) {
        case '.pdf':
          content = await this.extractPdfContent(filePath);
          break;
        case '.docx':
          content = await this.extractDocxContent(filePath);
          break;
        case '.txt':
        case '.md':
          content = await this.extractTextContent(filePath);
          break;
        case '.json':
          content = await this.extractJsonContent(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      const processedMetadata: DocumentMetadata = {
        source: filePath,
        fileName,
        fileType: fileExtension.slice(1),
        uploadedAt: new Date(),
        chunkIndex: 0,
        totalChunks: 0,
        tokenCount: 0,
        userId,
        tags: metadata?.tags || [],
        category: metadata?.category || category,
        ...metadata
      };

      return {
        content: this.cleanContent(content),
        metadata: processedMetadata
      };

    } catch (error) {
      this.logger.error(`Failed to process file ${fileName}: ${error.message}`);
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  private async extractPdfContent(filePath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  private async extractDocxContent(filePath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${error.message}`);
    }
  }

  private async extractTextContent(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  private async extractJsonContent(filePath: string): Promise<string> {
    try {
      const jsonContent = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(jsonContent);
      
      // Convert JSON to readable text format
      return this.jsonToText(parsed);
    } catch (error) {
      throw new Error(`JSON extraction failed: ${error.message}`);
    }
  }

  private jsonToText(obj: any, depth = 0): string {
    const indent = '  '.repeat(depth);
    let text = '';

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        text += `${indent}[${index}]: ${this.jsonToText(item, depth + 1)}\n`;
      });
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object') {
          text += `${indent}${key}:\n${this.jsonToText(value, depth + 1)}`;
        } else {
          text += `${indent}${key}: ${value}\n`;
        }
      }
    } else {
      text += `${obj}`;
    }

    return text;
  }

  private determineCategory(fileName: string, fileExtension: string): DocumentCategory {
    const name = fileName.toLowerCase();
    
    // Financial statement keywords
    if (name.includes('balance') || name.includes('income') || name.includes('statement') || 
        name.includes('financial') || name.includes('p&l') || name.includes('profit')) {
      return DocumentCategory.FINANCIAL_STATEMENT;
    }
    
    // Investment report keywords
    if (name.includes('investment') || name.includes('portfolio') || name.includes('fund') ||
        name.includes('research') || name.includes('analysis')) {
      return DocumentCategory.INVESTMENT_REPORT;
    }
    
    // Market research keywords
    if (name.includes('market') || name.includes('trend') || name.includes('sector') ||
        name.includes('industry') || name.includes('outlook')) {
      return DocumentCategory.MARKET_RESEARCH;
    }
    
    // Business plan keywords
    if (name.includes('business') || name.includes('plan') || name.includes('strategy') ||
        name.includes('model') || name.includes('proposal')) {
      return DocumentCategory.BUSINESS_PLAN;
    }
    
    // Transaction records
    if (name.includes('transaction') || name.includes('trade') || name.includes('record') ||
        name.includes('history') || name.includes('log')) {
      return DocumentCategory.TRANSACTION_RECORD;
    }
    
    // Regulatory documents
    if (name.includes('regulation') || name.includes('compliance') || name.includes('policy') ||
        name.includes('legal') || name.includes('regulatory')) {
      return DocumentCategory.REGULATORY_DOC;
    }
    
    return DocumentCategory.GENERAL;
  }

  private cleanContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/ {2,}/g, ' ') // Reduce multiple spaces
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
      .trim();
  }

  async validateFile(file: Express.Multer.File): Promise<boolean> {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.md', '.json'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      throw new Error(`File type ${fileExtension} not supported`);
    }
    
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }
    
    return true;
  }

  async saveUploadedFile(file: Express.Multer.File, userId: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'storage', 'uploads', userId);
    await fs.mkdir(uploadDir, { recursive: true });
    
    const timestamp = Date.now();
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${safeFileName}`;
    const filePath = path.join(uploadDir, fileName);
    
    await fs.writeFile(filePath, file.buffer);
    
    return filePath;
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      this.logger.warn(`Failed to delete file ${filePath}: ${error.message}`);
    }
  }
}