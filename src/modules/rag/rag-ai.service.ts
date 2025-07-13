import { Injectable, Logger } from '@nestjs/common';
import { get_encoding } from 'tiktoken';
import { RAGService } from './rag.service';
import { ClaudeAIService } from '../integrations/claude-ai.service';
import { LoggerService } from '../../common/logger/logger.service';
import {
  SemanticSearchOptions,
  RAGResponse,
  DocumentCategory,
  SearchResult
} from './interfaces/rag.interface';
import { RAGQueryDto, AnalyzeDocumentDto } from './dto/rag.dto';

@Injectable()
export class RAGAIService {
  private readonly logger = new Logger(RAGAIService.name);
  private tokenizer: any;

  constructor(
    private readonly ragService: RAGService,
    private readonly claudeAIService: ClaudeAIService,
    private readonly loggerService: LoggerService
  ) {
    this.tokenizer = get_encoding('cl100k_base');
  }

  async generateRAGResponse(queryDto: RAGQueryDto): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      // 1. Perform semantic search to get relevant context
      const searchOptions: SemanticSearchOptions = {
        query: queryDto.query,
        limit: queryDto.contextChunks || 5,
        threshold: 0.7,
        filters: {
          category: queryDto.category,
          userId: 'system' // TODO: Get from auth context
        }
      };

      const searchResults = await this.ragService.semanticSearch(searchOptions);

      if (searchResults.length === 0) {
        return {
          response: 'I couldn\'t find any relevant information in the knowledge base to answer your question. Please try rephrasing your query or upload relevant documents.',
          sources: [],
          contextUsed: '',
          tokenCount: 0,
          confidence: 0
        };
      }

      // 2. Build context from search results
      const { context, sources } = await this.buildContext(
        searchResults,
        queryDto.maxContextTokens || 4000
      );

      // 3. Create enhanced prompt with context
      const enhancedPrompt = this.createFinancialRAGPrompt(
        queryDto.query,
        context,
        queryDto.domain
      );

      // 4. Generate response using Claude AI
      const claudeResponse = await this.claudeAIService.generateFinancialAnalysis({
        query: enhancedPrompt,
        context: {
          userProfile: { risk_tolerance: 'moderate' },
          currentPortfolio: {},
          goals: []
        }
      });

      // 5. Calculate confidence based on source relevance
      const confidence = this.calculateConfidence(searchResults, claudeResponse.response);

      const duration = Date.now() - startTime;

      this.loggerService.logIntegration({
        service: 'RAG_AI',
        action: 'GENERATE_RESPONSE',
        status: 'SUCCESS',
        duration,
        timestamp: new Date(),
        metadata: {
          query: queryDto.query,
          sourcesUsed: sources.length,
          contextTokens: this.tokenizer.encode(context).length,
          confidence
        }
      });

      return {
        response: claudeResponse.response,
        sources,
        contextUsed: context,
        tokenCount: this.tokenizer.encode(claudeResponse.response).length,
        confidence
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.loggerService.logIntegration({
        service: 'RAG_AI',
        action: 'GENERATE_RESPONSE',
        status: 'FAILED',
        duration,
        errorMessage: error.message,
        timestamp: new Date(),
        metadata: {
          query: queryDto.query
        }
      });

      throw new Error(`RAG response generation failed: ${error.message}`);
    }
  }

  async analyzeDocument(analyzeDto: AnalyzeDocumentDto): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      let searchQuery = '';
      let analysisPrompt = '';

      // Build search query and analysis prompt based on analysis type
      switch (analyzeDto.analysisType) {
        case 'summary':
          searchQuery = `document summary overview key points`;
          analysisPrompt = this.createDocumentSummaryPrompt();
          break;
        case 'key_insights':
          searchQuery = `insights findings conclusions recommendations`;
          analysisPrompt = this.createKeyInsightsPrompt(analyzeDto.focusAreas);
          break;
        case 'financial_metrics':
          searchQuery = `financial metrics numbers ratios performance indicators`;
          analysisPrompt = this.createFinancialMetricsPrompt();
          break;
        case 'risk_assessment':
          searchQuery = `risk assessment analysis threats opportunities`;
          analysisPrompt = this.createRiskAssessmentPrompt();
          break;
        case 'recommendations':
          searchQuery = `recommendations actions next steps suggestions`;
          analysisPrompt = this.createRecommendationsPrompt();
          break;
      }

      // Search for relevant content
      const searchOptions: SemanticSearchOptions = {
        query: searchQuery,
        limit: 10,
        threshold: 0.6,
        filters: analyzeDto.documentId ? { source: analyzeDto.documentId } : undefined
      };

      const searchResults = await this.ragService.semanticSearch(searchOptions);

      if (searchResults.length === 0) {
        throw new Error('No relevant content found for analysis');
      }

      // Build context
      const { context, sources } = await this.buildContext(searchResults, 6000);

      // Create final prompt
      const finalPrompt = `${analysisPrompt}\n\n<DOCUMENT_CONTENT>\n${context}\n</DOCUMENT_CONTENT>`;

      // Generate analysis
      const claudeResponse = await this.claudeAIService.generateFinancialAnalysis({
        query: finalPrompt,
        context: {
          userProfile: { risk_tolerance: 'moderate' },
          currentPortfolio: {},
          goals: []
        }
      });

      const confidence = this.calculateConfidence(searchResults, claudeResponse.response);
      const duration = Date.now() - startTime;

      this.loggerService.logIntegration({
        service: 'RAG_AI',
        action: 'ANALYZE_DOCUMENT',
        status: 'SUCCESS',
        duration,
        timestamp: new Date(),
        metadata: {
          analysisType: analyzeDto.analysisType,
          sourcesUsed: sources.length,
          confidence
        }
      });

      return {
        response: claudeResponse.response,
        sources,
        contextUsed: context,
        tokenCount: this.tokenizer.encode(claudeResponse.response).length,
        confidence
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.loggerService.logIntegration({
        service: 'RAG_AI',
        action: 'ANALYZE_DOCUMENT',
        status: 'FAILED',
        duration,
        errorMessage: error.message,
        timestamp: new Date(),
        metadata: {
          analysisType: analyzeDto.analysisType
        }
      });

      throw error;
    }
  }

  private async buildContext(
    searchResults: SearchResult[],
    maxTokens: number
  ): Promise<{ context: string; sources: any[] }> {
    let context = '';
    const sources = [];
    let tokenCount = 0;

    for (const result of searchResults) {
      const chunkText = `\n\n--- Source: ${result.chunk.metadata.fileName} ---\n${result.chunk.content}`;
      const chunkTokens = this.tokenizer.encode(chunkText).length;

      if (tokenCount + chunkTokens > maxTokens) {
        break;
      }

      context += chunkText;
      sources.push(result.chunk);
      tokenCount += chunkTokens;
    }

    return { context, sources };
  }

  private createFinancialRAGPrompt(query: string, context: string, domain?: string): string {
    const domainContext = domain ? `\nFocus specifically on: ${domain}` : '';
    
    return `You are a highly skilled financial advisor with access to relevant documents and research. 
Provide a comprehensive, accurate response based on the context provided below.

<QUERY>
${query}
</QUERY>

<GUIDELINES>
- Base your response primarily on the provided context
- If the context doesn't contain enough information, clearly state this
- Provide specific references to the source documents when making claims
- Focus on actionable insights and practical recommendations
- Consider South African financial context and regulations where relevant
- Use clear, professional language suitable for financial decision-making${domainContext}
</GUIDELINES>

<CONTEXT>
${context}
</CONTEXT>

Please provide a detailed response that addresses the query using the available context:`;
  }

  private createDocumentSummaryPrompt(): string {
    return `Analyze the provided document content and create a comprehensive summary that includes:

1. **Document Overview**: What type of document this is and its primary purpose
2. **Key Points**: The most important information and findings
3. **Main Topics**: Core subjects covered in the document
4. **Conclusions**: Any conclusions or outcomes presented
5. **Actionable Items**: Specific recommendations or next steps mentioned

Format your response clearly with appropriate headings and bullet points.`;
  }

  private createKeyInsightsPrompt(focusAreas?: string[]): string {
    const focusSection = focusAreas?.length 
      ? `\nPay special attention to these focus areas: ${focusAreas.join(', ')}`
      : '';

    return `Extract and analyze the key insights from the provided content:

1. **Strategic Insights**: High-level strategic observations and implications
2. **Financial Insights**: Key financial findings, trends, or metrics
3. **Market Insights**: Market conditions, opportunities, or trends
4. **Operational Insights**: Operational efficiency or process observations
5. **Risk Insights**: Potential risks or concerns identified${focusSection}

For each insight, provide:
- The insight itself
- Supporting evidence from the document
- Potential implications or impact
- Recommended actions if applicable`;
  }

  private createFinancialMetricsPrompt(): string {
    return `Identify and analyze all financial metrics and key performance indicators from the content:

1. **Revenue Metrics**: Revenue figures, growth rates, trends
2. **Profitability Metrics**: Profit margins, EBITDA, net income
3. **Financial Ratios**: Liquidity, leverage, efficiency ratios
4. **Performance Indicators**: ROI, ROE, other performance measures
5. **Market Metrics**: Market share, valuation metrics, multiples

For each metric:
- Present the specific values or percentages
- Provide context about what these numbers mean
- Compare to industry standards if mentioned
- Highlight any concerning or exceptional figures
- Suggest areas for improvement or further investigation`;
  }

  private createRiskAssessmentPrompt(): string {
    return `Conduct a comprehensive risk assessment based on the provided content:

1. **Financial Risks**: Credit risk, market risk, liquidity risk
2. **Operational Risks**: Process risks, technology risks, human capital risks
3. **Strategic Risks**: Competitive risks, regulatory risks, reputational risks
4. **Market Risks**: Economic risks, industry-specific risks

For each risk category:
- Identify specific risks mentioned or implied
- Assess the potential impact (High/Medium/Low)
- Evaluate the likelihood of occurrence
- Suggest mitigation strategies
- Prioritize risks by overall threat level`;
  }

  private createRecommendationsPrompt(): string {
    return `Based on the content provided, generate actionable recommendations:

1. **Immediate Actions**: What should be done in the next 30 days
2. **Short-term Strategy**: Actions for the next 3-6 months
3. **Long-term Planning**: Strategic initiatives for 6+ months
4. **Risk Mitigation**: Specific steps to address identified risks
5. **Performance Improvement**: Ways to enhance efficiency or profitability

For each recommendation:
- Clearly state the action required
- Explain the rationale based on the document content
- Identify who should be responsible
- Suggest timelines for implementation
- Outline expected outcomes or benefits`;
  }

  private calculateConfidence(searchResults: SearchResult[], response: string): number {
    if (searchResults.length === 0) return 0;

    // Calculate average similarity of sources used
    const avgSimilarity = searchResults.reduce((sum, result) => sum + result.similarity, 0) / searchResults.length;
    
    // Consider number of sources (more sources = higher confidence, up to a point)
    const sourcesFactor = Math.min(searchResults.length / 5, 1);
    
    // Basic response quality check (longer, more detailed responses get slight boost)
    const responseFactor = Math.min(response.length / 1000, 1) * 0.1;
    
    return Math.min((avgSimilarity * 0.7) + (sourcesFactor * 0.2) + responseFactor, 1);
  }
}