export interface DocumentChunk {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  embeddings?: number[];
}

export interface DocumentMetadata {
  source: string;
  fileName: string;
  fileType: string;
  uploadedAt: Date;
  chunkIndex: number;
  totalChunks: number;
  tokenCount: number;
  userId?: string;
  tags?: string[];
  category?: DocumentCategory;
}

export interface SemanticSearchOptions {
  query: string;
  limit?: number;
  threshold?: number;
  filters?: SearchFilters;
  includeMetadata?: boolean;
}

export interface SearchFilters {
  fileType?: string;
  source?: string;
  category?: DocumentCategory;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  userId?: string;
}

export interface SearchResult {
  chunk: DocumentChunk;
  similarity: number;
  relevance: number;
}

export interface RAGResponse {
  response: string;
  sources: DocumentChunk[];
  contextUsed: string;
  tokenCount: number;
  confidence: number;
}

export interface DocumentProcessingResult {
  success: boolean;
  chunksCreated: number;
  documentId: string;
  error?: string;
  metadata: DocumentMetadata;
}

export enum DocumentCategory {
  FINANCIAL_STATEMENT = 'financial_statement',
  INVESTMENT_REPORT = 'investment_report',
  MARKET_RESEARCH = 'market_research',
  BUSINESS_PLAN = 'business_plan',
  REGULATORY_DOC = 'regulatory_doc',
  TRANSACTION_RECORD = 'transaction_record',
  GENERAL = 'general'
}

export interface RAGConfig {
  chunkSize: number;
  chunkOverlap: number;
  maxTokens: number;
  embeddingModel: string;
  collectionName: string;
  persistPath: string;
}