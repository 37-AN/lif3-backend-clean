import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pipeline } from '@xenova/transformers';
import { get_encoding } from 'tiktoken';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  DocumentChunk,
  DocumentMetadata,
  SemanticSearchOptions,
  SearchResult,
  RAGResponse,
  DocumentProcessingResult,
  DocumentCategory,
  RAGConfig
} from './interfaces/rag.interface';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class RAGService implements OnModuleInit {
  private readonly logger = new Logger(RAGService.name);
  private chromaClient: any;
  private collection: any;
  private embeddingPipeline: any;
  private tokenizer: any;
  private isInitialized = false;

  private readonly config: RAGConfig = {
    chunkSize: 500,
    chunkOverlap: 50,
    maxTokens: 4000,
    embeddingModel: 'Xenova/all-MiniLM-L6-v2',
    collectionName: 'lif3_financial_docs',
    persistPath: './storage/chromadb'
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService
  ) {}

  async onModuleInit() {
    try {
      await this.initializeRAGSystem();
      this.logger.log('RAG Service initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize RAG Service: ${error.message}`, error.stack);
      this.logger.warn('RAG Service will continue without ChromaDB - vector storage disabled');
      this.isInitialized = false;
    }
  }

  private async initializeRAGSystem(): Promise<void> {
    try {
      // Initialize ChromaDB client
      const chromadb = await import('chromadb');
      this.chromaClient = new chromadb.ChromaClient();

      // Initialize tokenizer
      this.tokenizer = get_encoding('cl100k_base');

      // Initialize embedding pipeline (lazy-loaded on first use)
      // this.embeddingPipeline = await pipeline('feature-extraction', this.config.embeddingModel);

      // Create or get collection
      await this.initializeCollection();

      // Ensure storage directory exists
      await fs.mkdir(path.dirname(this.config.persistPath), { recursive: true });

      this.isInitialized = true;
      
      this.loggerService.logIntegration({
        service: 'RAG_CHROMADB',
        action: 'INITIALIZE',
        status: 'SUCCESS',
        timestamp: new Date(),
        metadata: {
          collectionName: this.config.collectionName,
          embeddingModel: this.config.embeddingModel,
          persistPath: this.config.persistPath
        }
      });
    } catch (error) {
      this.loggerService.logIntegration({
        service: 'RAG_CHROMADB',
        action: 'INITIALIZE',
        status: 'FAILED',
        errorMessage: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  private async initializeCollection(): Promise<void> {
    try {
      // Import the default embedding function
      const { DefaultEmbeddingFunction } = await import('@chroma-core/default-embed');
      const embedFunction = new DefaultEmbeddingFunction();

      // Try to get existing collection
      this.collection = await this.chromaClient.getCollection({
        name: this.config.collectionName,
        embeddingFunction: embedFunction
      });
    } catch (error) {
      // Create new collection if it doesn't exist
      const { DefaultEmbeddingFunction } = await import('@chroma-core/default-embed');
      const embedFunction = new DefaultEmbeddingFunction();
      
      this.collection = await this.chromaClient.createCollection({
        name: this.config.collectionName,
        embeddingFunction: embedFunction,
        metadata: {
          'hnsw:space': 'cosine',
          description: 'LIF3 Financial Dashboard document embeddings'
        }
      });
      this.logger.log(`Created new ChromaDB collection: ${this.config.collectionName}`);
    }
  }

  async processDocument(
    content: string,
    metadata: Partial<DocumentMetadata>
  ): Promise<DocumentProcessingResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        chunksCreated: 0,
        documentId: '',
        error: 'RAG Service not initialized - ChromaDB unavailable',
        metadata: {} as DocumentMetadata
      };
    }

    const startTime = Date.now();

    try {
      // Generate document ID
      const documentId = crypto.randomUUID();

      // Clean and prepare content
      const cleanContent = this.cleanContent(content);

      // Split into chunks
      const chunks = await this.createDocumentChunks(cleanContent, {
        ...metadata,
        uploadedAt: new Date(),
        userId: metadata.userId || 'system'
      } as DocumentMetadata);

      // Generate embeddings and store
      const embeddings: number[][] = [];
      const chunkContents: string[] = [];
      const chunkMetadata: any[] = [];
      const chunkIds: string[] = [];

      for (const chunk of chunks) {
        const embedding = await this.generateEmbedding(chunk.content);
        embeddings.push(embedding);
        chunkContents.push(chunk.content);
        chunkMetadata.push({
          ...chunk.metadata,
          documentId,
          chunkId: chunk.id
        });
        chunkIds.push(chunk.id);
      }

      // Store in ChromaDB
      await this.collection.add({
        ids: chunkIds,
        embeddings: embeddings,
        documents: chunkContents,
        metadatas: chunkMetadata
      });

      const duration = Date.now() - startTime;

      this.loggerService.logIntegration({
        service: 'RAG_CHROMADB',
        action: 'PROCESS_DOCUMENT',
        status: 'SUCCESS',
        duration,
        recordsProcessed: chunks.length,
        timestamp: new Date(),
        metadata: {
          documentId,
          chunksCreated: chunks.length,
          fileName: metadata.fileName,
          fileType: metadata.fileType,
          category: metadata.category
        }
      });

      return {
        success: true,
        chunksCreated: chunks.length,
        documentId,
        metadata: chunks[0].metadata
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.loggerService.logIntegration({
        service: 'RAG_CHROMADB',
        action: 'PROCESS_DOCUMENT',
        status: 'FAILED',
        duration,
        errorMessage: error.message,
        timestamp: new Date(),
        metadata: {
          fileName: metadata.fileName,
          fileType: metadata.fileType
        }
      });

      return {
        success: false,
        chunksCreated: 0,
        documentId: '',
        error: error.message,
        metadata: {} as DocumentMetadata
      };
    }
  }

  async semanticSearch(options: SemanticSearchOptions): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      this.logger.warn('Semantic search requested but RAG Service not initialized');
      return [];
    }

    const startTime = Date.now();

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(options.query);

      // Prepare filters
      const whereClause: any = {};
      if (options.filters) {
        if (options.filters.fileType) whereClause.fileType = options.filters.fileType;
        if (options.filters.category) whereClause.category = options.filters.category;
        if (options.filters.userId) whereClause.userId = options.filters.userId;
        if (options.filters.tags?.length) whereClause.tags = { $in: options.filters.tags };
      }

      // Query ChromaDB
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: options.limit || 10,
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
        include: ['documents', 'metadatas', 'distances']
      });

      // Process results
      const searchResults: SearchResult[] = [];
      
      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          const distance = results.distances?.[0]?.[i] || 1;
          const similarity = 1 - distance; // Convert distance to similarity
          
          if (similarity >= (options.threshold || 0.7)) {
            const chunk: DocumentChunk = {
              id: results.ids?.[0]?.[i] || '',
              content: results.documents[0][i] || '',
              metadata: (results.metadatas?.[0]?.[i] as unknown as DocumentMetadata) || {} as DocumentMetadata
            };

            searchResults.push({
              chunk,
              similarity,
              relevance: this.calculateRelevance(options.query, chunk.content, similarity)
            });
          }
        }
      }

      // Sort by relevance
      searchResults.sort((a, b) => b.relevance - a.relevance);

      const duration = Date.now() - startTime;

      this.loggerService.logIntegration({
        service: 'RAG_CHROMADB',
        action: 'SEMANTIC_SEARCH',
        status: 'SUCCESS',
        duration,
        recordsProcessed: searchResults.length,
        timestamp: new Date(),
        metadata: {
          query: options.query,
          resultsFound: searchResults.length,
          threshold: options.threshold || 0.7,
          filters: options.filters
        }
      });

      return searchResults;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.loggerService.logIntegration({
        service: 'RAG_CHROMADB',
        action: 'SEMANTIC_SEARCH',
        status: 'FAILED',
        duration,
        errorMessage: error.message,
        timestamp: new Date(),
        metadata: {
          query: options.query
        }
      });

      throw error;
    }
  }

  private async createDocumentChunks(
    content: string,
    metadata: DocumentMetadata
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    const tokens = this.tokenizer.encode(content);
    
    const chunkSizeInTokens = this.config.chunkSize;
    const overlapInTokens = this.config.chunkOverlap;
    
    let startIdx = 0;
    let chunkIndex = 0;
    
    while (startIdx < tokens.length) {
      const endIdx = Math.min(startIdx + chunkSizeInTokens, tokens.length);
      const chunkTokens = tokens.slice(startIdx, endIdx);
      const chunkText = this.tokenizer.decode(chunkTokens);
      
      // Clean chunk text
      const cleanChunkText = chunkText.trim();
      if (cleanChunkText.length < 50) { // Skip very small chunks
        startIdx = endIdx;
        continue;
      }
      
      const chunk: DocumentChunk = {
        id: crypto.randomUUID(),
        content: cleanChunkText,
        metadata: {
          ...metadata,
          chunkIndex,
          totalChunks: 0, // Will be updated after processing
          tokenCount: chunkTokens.length
        }
      };
      
      chunks.push(chunk);
      chunkIndex++;
      
      // Move start position with overlap
      startIdx = endIdx - overlapInTokens;
    }
    
    // Update total chunks count
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = chunks.length;
    });
    
    return chunks;
  }

  private async initializeEmbeddingPipeline(): Promise<void> {
    if (!this.embeddingPipeline) {
      try {
        this.embeddingPipeline = await pipeline('feature-extraction', this.config.embeddingModel);
        this.logger.log('Embedding pipeline initialized successfully');
      } catch (error) {
        this.logger.error(`Failed to initialize embedding pipeline: ${error.message}`);
        throw error;
      }
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Initialize embedding pipeline if not already done
      await this.initializeEmbeddingPipeline();
      
      const result = await this.embeddingPipeline(text, {
        pooling: 'mean',
        normalize: true
      });
      
      // Extract the embedding array
      return Array.from(result.data);
    } catch (error) {
      this.logger.error(`Failed to generate embedding: ${error.message}`);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  private cleanContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/ {2,}/g, ' ') // Reduce multiple spaces
      .trim();
  }

  private calculateRelevance(query: string, content: string, similarity: number): number {
    // Basic relevance calculation combining similarity and keyword matching
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    let keywordMatches = 0;
    for (const word of queryWords) {
      if (contentWords.some(cWord => cWord.includes(word) || word.includes(cWord))) {
        keywordMatches++;
      }
    }
    
    const keywordScore = keywordMatches / queryWords.length;
    return (similarity * 0.8) + (keywordScore * 0.2);
  }

  async getCollectionStats(): Promise<any> {
    if (!this.isInitialized) {
      return {
        totalDocuments: 0,
        collectionName: this.config.collectionName,
        embeddingModel: this.config.embeddingModel,
        chunkSize: this.config.chunkSize,
        isInitialized: false,
        status: 'ChromaDB unavailable'
      };
    }

    try {
      const count = await this.collection.count();
      return {
        totalDocuments: count,
        collectionName: this.config.collectionName,
        embeddingModel: this.config.embeddingModel,
        chunkSize: this.config.chunkSize,
        isInitialized: this.isInitialized
      };
    } catch (error) {
      this.logger.error(`Failed to get collection stats: ${error.message}`);
      throw error;
    }
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    if (!this.isInitialized) {
      this.logger.warn('Document deletion requested but RAG Service not initialized');
      return false;
    }

    try {
      // Query to find all chunks of this document
      const results = await this.collection.get({
        where: { documentId }
      });

      if (results.ids && results.ids.length > 0) {
        await this.collection.delete({
          ids: results.ids
        });

        this.loggerService.logIntegration({
          service: 'RAG_CHROMADB',
          action: 'DELETE_DOCUMENT',
          status: 'SUCCESS',
          timestamp: new Date(),
          metadata: {
            documentId,
            chunksDeleted: results.ids.length
          }
        });

        return true;
      }

      return false;
    } catch (error) {
      this.loggerService.logIntegration({
        service: 'RAG_CHROMADB',
        action: 'DELETE_DOCUMENT',
        status: 'FAILED',
        errorMessage: error.message,
        timestamp: new Date(),
        metadata: { documentId }
      });

      throw error;
    }
  }
}