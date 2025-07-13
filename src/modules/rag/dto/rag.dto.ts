import { IsString, IsOptional, IsNumber, IsArray, IsEnum, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategory } from '../interfaces/rag.interface';

export class UploadDocumentDto {
  @ApiProperty({ description: 'Document category for better organization' })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiPropertyOptional({ description: 'Tags for document classification', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SemanticSearchDto {
  @ApiProperty({ description: 'Search query text' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Maximum number of results', minimum: 1, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Similarity threshold (0-1)', minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold?: number = 0.7;

  @ApiPropertyOptional({ description: 'Filter by file type' })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({ description: 'Filter by document category' })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiPropertyOptional({ description: 'Filter by tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Include detailed metadata in results' })
  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean = true;
}

export class RAGQueryDto {
  @ApiProperty({ description: 'Query for RAG-enhanced response' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Maximum context tokens to use', minimum: 100, maximum: 8000 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(8000)
  maxContextTokens?: number = 4000;

  @ApiPropertyOptional({ description: 'Number of relevant chunks to retrieve', minimum: 1, maximum: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  contextChunks?: number = 5;

  @ApiPropertyOptional({ description: 'Include conversation history for better context' })
  @IsOptional()
  @IsBoolean()
  includeHistory?: boolean = false;

  @ApiPropertyOptional({ description: 'Filter results by category' })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiPropertyOptional({ description: 'Focus on specific financial domain' })
  @IsOptional()
  @IsString()
  domain?: string;
}

export class AnalyzeDocumentDto {
  @ApiProperty({ description: 'Analysis type to perform' })
  @IsString()
  analysisType: 'summary' | 'key_insights' | 'financial_metrics' | 'risk_assessment' | 'recommendations';

  @ApiPropertyOptional({ description: 'Document ID to analyze' })
  @IsOptional()
  @IsString()
  documentId?: string;

  @ApiPropertyOptional({ description: 'Specific focus areas for analysis', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusAreas?: string[];

  @ApiPropertyOptional({ description: 'Include comparative analysis with other documents' })
  @IsOptional()
  @IsBoolean()
  comparative?: boolean = false;
}