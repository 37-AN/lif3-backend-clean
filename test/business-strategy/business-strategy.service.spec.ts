import { BusinessStrategyService } from '../../src/modules/business-strategy/business-strategy.service';
import { BusinessStrategy } from '../../src/modules/business-strategy/business-strategy.interface';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

jest.mock('child_process', () => ({ spawn: jest.fn() }));

const mockChromaClient = {
  getCollection: jest.fn().mockResolvedValue({
    get: jest.fn().mockResolvedValue({ documents: [JSON.stringify({ currentMRR: '0' })] }),
    upsert: jest.fn().mockResolvedValue(undefined),
  }),
};

describe('BusinessStrategyService', () => {
  let service: BusinessStrategyService;
  let configService: ConfigService;

  beforeEach(async () => {
    configService = new ConfigService();
    service = new BusinessStrategyService(configService);
    service['chromaClient'] = mockChromaClient;
    service['collection'] = await mockChromaClient.getCollection();
    service['isInitialized'] = true;
  });

  it('should get strategy from ChromaDB', async () => {
    const result = await service.getStrategy();
    expect(result).toHaveProperty('currentMRR', '0');
  });

  it('should update strategy in ChromaDB', async () => {
    const data: BusinessStrategy = { currentMRR: '1', targetMRR: '2', timeline: 'now', immediateFocus: 'focus', serviceOfferings: [], targetMarket: [], focus: '', technology: '', target: '', revenueModel: '', competitiveAdvantages: [], generated: '' };
    const ok = await service.updateStrategy(data);
    expect(ok).toBe(true);
  });

  it('should call MCP sync and resolve on success', async () => {
    const { spawn } = require('child_process');
    const mockStdout = { on: jest.fn((event, cb) => { if (event === 'data') cb('{"result":{"content":[{"type":"text","text":"ok"}]}}\n'); }), end: jest.fn() };
    const mockProcess = { stdout: mockStdout, stderr: { on: jest.fn() }, stdin: { write: jest.fn(), end: jest.fn() }, on: jest.fn((event, cb) => { if (event === 'close') cb(0); }), kill: jest.fn() };
    spawn.mockReturnValue(mockProcess);
    await expect(service.syncToMCP({} as any)).resolves.toBeUndefined();
  });

  it('should call MCP sync and reject on error', async () => {
    const { spawn } = require('child_process');
    const mockStdout = { on: jest.fn(), end: jest.fn() };
    const mockProcess = { stdout: mockStdout, stderr: { on: jest.fn() }, stdin: { write: jest.fn(), end: jest.fn() }, on: jest.fn((event, cb) => { if (event === 'close') cb(1); }), kill: jest.fn() };
    spawn.mockReturnValue(mockProcess);
    await expect(service.syncToMCP({} as any)).rejects.toThrow('MCP sync failed');
  });
}); 