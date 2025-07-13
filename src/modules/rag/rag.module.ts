import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { LoggerModule } from '../../common/logger/logger.module';
import { RAGController } from './rag.controller';
import { RAGService } from './rag.service';
import { RAGAIService } from './rag-ai.service';
import { DocumentService } from './document.service';
import { ClaudeAIService } from '../integrations/claude-ai.service';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
      },
      fileFilter: (req, file, callback) => {
        const allowedTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/markdown',
          'application/json'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('Invalid file type'), false);
        }
      }
    })
  ],
  controllers: [RAGController],
  providers: [
    RAGService,
    RAGAIService,
    DocumentService,
    ClaudeAIService
  ],
  exports: [RAGService, RAGAIService, DocumentService]
})
export class RAGModule {}