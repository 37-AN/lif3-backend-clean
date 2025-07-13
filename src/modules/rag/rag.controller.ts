import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';
import { AuditLogGuard } from '../../common/guards/audit-log.guard';
import { LogIntegrationEvent } from '../../common/decorators/audit-log.decorator';
import { RAGService } from './rag.service';
import { RAGAIService } from './rag-ai.service';
import { DocumentService } from './document.service';
import {
  UploadDocumentDto,
  SemanticSearchDto,
  RAGQueryDto,
  AnalyzeDocumentDto
} from './dto/rag.dto';
import {
  RAGResponse,
  SearchResult,
  DocumentProcessingResult
} from './interfaces/rag.interface';

@ApiTags('RAG & Semantic Search')
@Controller('rag')
@UseInterceptors(LoggingInterceptor)
@ApiBearerAuth()
export class RAGController {
  constructor(
    private readonly ragService: RAGService,
    private readonly ragAIService: RAGAIService,
    private readonly documentService: DocumentService
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload and process a document for semantic search' })
  @ApiResponse({ status: 201, description: 'Document processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format or processing error' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuditLogGuard)
  @LogIntegrationEvent('Document uploaded for RAG processing')
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto
  ): Promise<DocumentProcessingResult> {
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }

    try {
      // Validate file
      await this.documentService.validateFile(file);

      // TODO: Get userId from authentication context
      const userId = 'system';

      // Save uploaded file
      const filePath = await this.documentService.saveUploadedFile(file, userId);

      // Process file content
      const { content, metadata } = await this.documentService.processFile(
        filePath,
        file.originalname,
        userId,
        {
          category: uploadDto.category,
          tags: uploadDto.tags,
          ...uploadDto.metadata
        }
      );

      // Process document through RAG system
      const result = await this.ragService.processDocument(content, metadata);

      // Clean up temporary file
      await this.documentService.deleteFile(filePath);

      return result;

    } catch (error) {
      throw new HttpException(
        `Document processing failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('search')
  @ApiOperation({ summary: 'Perform semantic search across uploaded documents' })
  @ApiResponse({ status: 200, description: 'Search results returned successfully' })
  @UseGuards(AuditLogGuard)
  @LogIntegrationEvent('Semantic search performed')
  async semanticSearch(@Body() searchDto: SemanticSearchDto): Promise<SearchResult[]> {
    try {
      const searchOptions = {
        query: searchDto.query,
        limit: searchDto.limit,
        threshold: searchDto.threshold,
        includeMetadata: searchDto.includeMetadata,
        filters: {
          fileType: searchDto.fileType,
          category: searchDto.category,
          tags: searchDto.tags
        }
      };

      return await this.ragService.semanticSearch(searchOptions);

    } catch (error) {
      throw new HttpException(
        `Semantic search failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('query')
  @ApiOperation({ summary: 'Ask a question using RAG-enhanced AI response' })
  @ApiResponse({ status: 200, description: 'AI response generated with document context' })
  @UseGuards(AuditLogGuard)
  @LogIntegrationEvent('RAG-enhanced AI query processed')
  async ragQuery(@Body() queryDto: RAGQueryDto): Promise<RAGResponse> {
    try {
      return await this.ragAIService.generateRAGResponse(queryDto);
    } catch (error) {
      throw new HttpException(
        `RAG query failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Perform AI-powered document analysis' })
  @ApiResponse({ status: 200, description: 'Document analysis completed' })
  @UseGuards(AuditLogGuard)
  @LogIntegrationEvent('Document analysis performed')
  async analyzeDocument(@Body() analyzeDto: AnalyzeDocumentDto): Promise<RAGResponse> {
    try {
      return await this.ragAIService.analyzeDocument(analyzeDto);
    } catch (error) {
      throw new HttpException(
        `Document analysis failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get RAG system statistics and health information' })
  @ApiResponse({ status: 200, description: 'System statistics retrieved' })
  async getStats(): Promise<any> {
    try {
      return await this.ragService.getCollectionStats();
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('document/:documentId')
  @ApiOperation({ summary: 'Delete a document and all its chunks from the vector store' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @UseGuards(AuditLogGuard)
  @LogIntegrationEvent('Document deleted from RAG system')
  async deleteDocument(@Param('documentId') documentId: string): Promise<{ success: boolean }> {
    try {
      const success = await this.ragService.deleteDocument(documentId);
      
      if (!success) {
        throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
      }

      return { success };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to delete document: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('financial/portfolio-analysis')
  @ApiOperation({ summary: 'Analyze portfolio documents and generate insights' })
  @ApiResponse({ status: 200, description: 'Portfolio analysis completed' })
  @UseGuards(AuditLogGuard)
  @LogIntegrationEvent('Portfolio analysis performed')
  async analyzePortfolio(
    @Body() queryDto: RAGQueryDto
  ): Promise<RAGResponse> {
    try {
      const enhancedQuery = {
        ...queryDto,
        query: `Analyze my investment portfolio based on the uploaded documents. ${queryDto.query}`,
        category: 'investment_report' as any,
        domain: 'portfolio_management'
      };

      return await this.ragAIService.generateRAGResponse(enhancedQuery);
    } catch (error) {
      throw new HttpException(
        `Portfolio analysis failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('financial/risk-assessment')
  @ApiOperation({ summary: 'Perform comprehensive risk assessment using uploaded documents' })
  @ApiResponse({ status: 200, description: 'Risk assessment completed' })
  @UseGuards(AuditLogGuard)
  @LogIntegrationEvent('Financial risk assessment performed')
  async performRiskAssessment(
    @Body() queryDto: RAGQueryDto
  ): Promise<RAGResponse> {
    try {
      const riskAnalysis = {
        analysisType: 'risk_assessment' as const,
        focusAreas: [
          'market_risk',
          'credit_risk',
          'liquidity_risk',
          'operational_risk',
          'regulatory_risk'
        ]
      };

      return await this.ragAIService.analyzeDocument(riskAnalysis);
    } catch (error) {
      throw new HttpException(
        `Risk assessment failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('financial/market-insights')
  @ApiOperation({ summary: 'Generate market insights from research documents' })
  @ApiResponse({ status: 200, description: 'Market insights generated' })
  @UseGuards(AuditLogGuard)
  @LogIntegrationEvent('Market insights analysis performed')
  async generateMarketInsights(
    @Body() queryDto: RAGQueryDto
  ): Promise<RAGResponse> {
    try {
      const enhancedQuery = {
        ...queryDto,
        query: `Based on the market research documents, provide insights on current market trends, opportunities, and potential threats. ${queryDto.query}`,
        category: 'market_research' as any,
        domain: 'market_analysis'
      };

      return await this.ragAIService.generateRAGResponse(enhancedQuery);
    } catch (error) {
      throw new HttpException(
        `Market insights generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('financial/compliance-check')
  @ApiOperation({ summary: 'Check compliance against regulatory documents' })
  @ApiResponse({ status: 200, description: 'Compliance check completed' })
  @UseGuards(AuditLogGuard)
  @LogIntegrationEvent('Compliance check performed')
  async checkCompliance(
    @Body() queryDto: RAGQueryDto
  ): Promise<RAGResponse> {
    try {
      const enhancedQuery = {
        ...queryDto,
        query: `Review the regulatory documents and assess compliance with current regulations. Identify any potential compliance issues or recommendations. ${queryDto.query}`,
        category: 'regulatory_doc' as any,
        domain: 'regulatory_compliance'
      };

      return await this.ragAIService.generateRAGResponse(enhancedQuery);
    } catch (error) {
      throw new HttpException(
        `Compliance check failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}