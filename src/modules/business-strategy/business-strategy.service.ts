import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { BusinessStrategy } from './business-strategy.interface';
import { spawn } from 'child_process';

const STRATEGY_DOC_ID = 'main-strategy';

@Injectable()
export class BusinessStrategyService implements OnModuleInit {
  private readonly logger = new Logger(BusinessStrategyService.name);
  private chromaClient: any;
  private collection: any;
  private isInitialized = false;

  private readonly collectionName = 'business_strategy';
  private readonly persistPath = './storage/chromadb';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const chromadb = await import('chromadb');
      this.chromaClient = new chromadb.ChromaClient();
      await this.initializeCollection();
      this.isInitialized = true;
      this.logger.log('BusinessStrategyService initialized with ChromaDB');
    } catch (error) {
      this.logger.error(`Failed to initialize ChromaDB: ${error.message}`);
      this.isInitialized = false;
    }
  }

  private async initializeCollection(): Promise<void> {
    try {
      // Import the default embedding function
      const { DefaultEmbeddingFunction } = await import('@chroma-core/default-embed');
      const embedFunction = new DefaultEmbeddingFunction();

      this.collection = await this.chromaClient.getCollection({
        name: this.collectionName,
        embeddingFunction: embedFunction
      });
    } catch (error) {
      // Create new collection if it doesn't exist
      const { DefaultEmbeddingFunction } = await import('@chroma-core/default-embed');
      const embedFunction = new DefaultEmbeddingFunction();
      
      this.collection = await this.chromaClient.createCollection({
        name: this.collectionName,
        embeddingFunction: embedFunction,
        metadata: {
          description: 'Business Strategy Data'
        }
      });
      this.logger.log(`Created new ChromaDB collection: ${this.collectionName}`);
    }
  }

  // Fetch the current business strategy from ChromaDB
  async getStrategy(): Promise<BusinessStrategy | null> {
    if (!this.isInitialized) return null;
    const results = await this.collection.get({ ids: [STRATEGY_DOC_ID] });
    if (results && results.documents && results.documents[0]) {
      try {
        return JSON.parse(results.documents[0]);
      } catch (e) {
        this.logger.error('Failed to parse business strategy document');
        return null;
      }
    }
    return null;
  }

  // Update (upsert) the business strategy in ChromaDB
  async updateStrategy(data: BusinessStrategy): Promise<boolean> {
    if (!this.isInitialized) return false;
    await this.collection.upsert({
      ids: [STRATEGY_DOC_ID],
      documents: [JSON.stringify(data)],
      metadatas: [{ updatedAt: new Date().toISOString() }]
    });
    return true;
  }

  // Tool-based MCP sync logic
  async syncToMCP(data: BusinessStrategy): Promise<void> {
    this.logger.log('Starting MCP sync (tool-based)...');
    return new Promise((resolve, reject) => {
      const mcpProcess = spawn('node', [
        // Path to the MCP business server
        './lif3-integrations/business-server.js'
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const callToolRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'call_tool',
        params: {
          name: 'update_business_strategy',
          arguments: { strategy: data }
        }
      };

      let output = '';
      let errorOutput = '';
      let resolved = false;

      mcpProcess.stdout.on('data', (chunk) => {
        output += chunk.toString();
        // Try to parse response and resolve
        try {
          const lines = output.split('\n').filter(Boolean);
          for (const line of lines) {
            const resp = JSON.parse(line);
            if (resp && resp.result && resp.result.content) {
              this.logger.log('MCP sync response: ' + JSON.stringify(resp.result.content));
              resolved = true;
              resolve();
              mcpProcess.kill();
              return;
            }
          }
        } catch (e) {
          // Ignore parse errors until complete
        }
      });

      mcpProcess.stderr.on('data', (chunk) => {
        errorOutput += chunk.toString();
      });

      mcpProcess.on('close', (code) => {
        if (!resolved) {
          this.logger.error('MCP sync process closed without success. Code: ' + code + ' Error: ' + errorOutput);
          reject(new Error('MCP sync failed'));
        }
      });

      mcpProcess.stdin.write(JSON.stringify(callToolRequest) + '\n');
      mcpProcess.stdin.end();
    });
  }
} 