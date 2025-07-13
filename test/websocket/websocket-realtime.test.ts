import { Test, TestingModule } from '@nestjs/testing';
import { WebSocketGateway } from '../../src/modules/websocket/websocket.gateway';
import { LoggerService } from '../../src/common/logger/logger.service';
import { MockWebSocketClient, TestDataGenerator, LIF3_TEST_CONSTANTS, PerformanceMonitor } from '../setup';
import { Server, Socket } from 'socket.io';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

describe('WebSocket Real-time Functionality - LIF3 Dashboard', () => {
  let gateway: WebSocketGateway;
  let loggerService: LoggerService;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;
  let mockWinstonLogger: any;

  beforeEach(async () => {
    mockWinstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn()
    };

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: {
        adapter: {
          rooms: {
            get: jest.fn().mockReturnValue(new Set(['socket1', 'socket2']))
          }
        }
      }
    } as any;

    mockSocket = {
      id: 'test_socket_123',
      handshake: {
        address: '127.0.0.1',
        headers: {
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        auth: {
          token: 'valid_jwt_token'
        }
      },
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      rooms: new Set(['user_ethan_barnes'])
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebSocketGateway,
        LoggerService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockWinstonLogger
        }
      ]
    }).compile();

    gateway = module.get<WebSocketGateway>(WebSocketGateway);
    loggerService = module.get<LoggerService>(LoggerService);
    
    // Set the server instance
    (gateway as any).server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('WebSocket Connection Management', () => {
    test('Handle successful client connection with authentication', async () => {
      await gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.join).toHaveBeenCalledWith('user_ethan_barnes');
      expect(mockSocket.emit).toHaveBeenCalledWith('connection_success', {
        message: 'Connected to LIF3 real-time updates',
        userId: 'ethan_barnes',
        timestamp: expect.any(Date)
      });
    });

    test('Reject connection without valid token', async () => {
      const invalidSocket = {
        ...mockSocket,
        handshake: {
          ...mockSocket.handshake,
          auth: {},
          headers: {}
        }
      } as Socket;

      await gateway.handleConnection(invalidSocket);

      expect(invalidSocket.disconnect).toHaveBeenCalled();
    });

    test('Handle client disconnection cleanup', () => {
      // Simulate connection first
      (gateway as any).connectedUsers.set('test_socket_123', mockSocket);
      (gateway as any).userSessions.set('test_socket_123', {
        id: 'ethan_barnes',
        email: 'ethan@43v3r.ai',
        name: 'Ethan Barnes',
        role: 'USER'
      });

      gateway.handleDisconnect(mockSocket as Socket);

      expect((gateway as any).connectedUsers.has('test_socket_123')).toBe(false);
      expect((gateway as any).userSessions.has('test_socket_123')).toBe(false);
    });

    test('Track connection performance metrics', async () => {
      const startTime = Date.now();
      
      await gateway.handleConnection(mockSocket as Socket);
      
      const connectionTime = Date.now() - startTime;
      expect(connectionTime).toBeLessThan(1000); // Should connect in < 1 second
    });
  });

  describe('Financial Data Broadcasting', () => {
    test('Broadcast balance update in real-time', async () => {
      const balanceData = {
        accountId: 'liquid_cash',
        previousBalance: LIF3_TEST_CONSTANTS.LIQUID_CASH,
        newBalance: LIF3_TEST_CONSTANTS.LIQUID_CASH + 5000,
        changeAmount: 5000,
        changePercent: 5.6,
        currency: 'ZAR',
        timestamp: new Date()
      };

      await gateway.broadcastBalanceUpdate('ethan_barnes', balanceData);

      expect(mockServer.to).toHaveBeenCalledWith('user_ethan_barnes');
      expect(mockServer.emit).toHaveBeenCalledWith('balance_update', {
        type: 'balance_update',
        data: balanceData,
        timestamp: expect.any(Date)
      });
    });

    test('Broadcast transaction added notification', async () => {
      const transaction = TestDataGenerator.generateTransaction({
        amount: 1500,
        currency: 'ZAR',
        description: 'Grocery shopping',
        category: 'food',
        type: 'expense'
      });

      await gateway.broadcastTransactionAdded('ethan_barnes', transaction);

      expect(mockServer.to).toHaveBeenCalledWith('user_ethan_barnes');
      expect(mockServer.emit).toHaveBeenCalledWith('transaction_added', {
        type: 'transaction_added',
        data: transaction,
        timestamp: expect.any(Date)
      });
    });

    test('Broadcast goal progress update toward R1.8M', async () => {
      const goalData = {
        goalId: 'net_worth_target',
        goalName: 'Net Worth R1.8M',
        currentAmount: 250000, // R250k milestone
        targetAmount: LIF3_TEST_CONSTANTS.TARGET_NET_WORTH,
        progress: 13.9, // Slight progress from 13.3%
        previousProgress: LIF3_TEST_CONSTANTS.GOAL_PROGRESS,
        milestoneReached: true,
        milestone: 'R250,000'
      };

      await gateway.broadcastGoalProgress('ethan_barnes', goalData);

      expect(mockServer.to).toHaveBeenCalledWith('user_ethan_barnes');
      expect(mockServer.emit).toHaveBeenCalledWith('goal_progress', {
        type: 'goal_progress',
        data: goalData,
        timestamp: expect.any(Date)
      });
    });

    test('Broadcast 43V3R business revenue notification', async () => {
      const revenueData = {
        amount: 1000,
        currency: 'ZAR',
        source: 'consulting',
        description: 'AI strategy consultation',
        dailyTarget: LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET,
        progress: 20.5, // 1000/4881 * 100
        mrrImpact: 30330 // 1000 * 30.33 days
      };

      await gateway.broadcast43V3RRevenue('ethan_barnes', revenueData);

      expect(mockServer.to).toHaveBeenCalledWith('user_ethan_barnes');
      expect(mockServer.emit).toHaveBeenCalledWith('business_revenue', {
        type: 'business_revenue',
        data: revenueData,
        timestamp: expect.any(Date)
      });
    });

    test('Broadcast milestone achievement celebration', async () => {
      const milestoneData = {
        type: 'NET_WORTH_MILESTONE',
        title: 'R250,000 Net Worth Achieved!',
        amount: 250000,
        progress: 13.9,
        previousMilestone: 200000,
        nextMilestone: 300000,
        celebration: true,
        message: 'Congratulations! You\'ve reached another step toward R1.8M!'
      };

      await gateway.broadcastMilestoneAchieved('ethan_barnes', milestoneData);

      expect(mockServer.to).toHaveBeenCalledWith('user_ethan_barnes');
      expect(mockServer.emit).toHaveBeenCalledWith('milestone_achieved', {
        type: 'milestone_achieved',
        data: milestoneData,
        timestamp: expect.any(Date)
      });
    });

    test('Broadcast sync status for integrations', async () => {
      const syncData = {
        service: 'GOOGLE_DRIVE',
        status: 'SUCCESS',
        operation: 'DAILY_BRIEFING_CREATED',
        fileId: 'drive_file_123',
        fileName: 'LIF3_Daily_Command_Center_2025-07-05.md',
        recordsProcessed: 3,
        duration: 1500
      };

      await gateway.broadcastSyncStatus('ethan_barnes', syncData);

      expect(mockServer.to).toHaveBeenCalledWith('user_ethan_barnes');
      expect(mockServer.emit).toHaveBeenCalledWith('sync_status', {
        type: 'sync_status',
        data: syncData,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('WebSocket Event Handling', () => {
    test('Handle subscription to financial updates', async () => {
      const subscriptionData = {
        types: ['balance_update', 'transaction_added', 'goal_progress']
      };

      const result = await gateway.handleSubscribeFinancialUpdates(
        subscriptionData,
        mockSocket as Socket
      );

      expect(mockSocket.join).toHaveBeenCalledWith('financial_balance_update');
      expect(mockSocket.join).toHaveBeenCalledWith('financial_transaction_added');
      expect(mockSocket.join).toHaveBeenCalledWith('financial_goal_progress');
      expect(result.types).toEqual(subscriptionData.types);
    });

    test('Handle balance update request', async () => {
      const requestData = { accountId: 'liquid_cash' };

      const result = await gateway.handleRequestBalanceUpdate(
        requestData,
        mockSocket as Socket
      );

      expect(mockSocket.emit).toHaveBeenCalledWith('balance_update', {
        netWorth: 239625,
        liquidCash: 88750,
        investments: 142000,
        businessEquity: 8875,
        lastUpdated: expect.any(Date)
      });
      expect(result.message).toBe('Balance update sent');
    });

    test('Handle ping/pong heartbeat mechanism', () => {
      const result = gateway.handlePing(mockSocket as Socket);

      expect(result.message).toBe('pong');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.serverTime).toBeGreaterThan(0);
    });

    test('Measure WebSocket latency', async () => {
      const mockClient = new MockWebSocketClient();
      await mockClient.connect();

      const startTime = Date.now();
      mockClient.emit('ping');
      const endTime = Date.now();
      const latency = endTime - startTime;

      expect(latency).toBeLessThan(500); // < 500ms requirement
      expect(mockClient.connected).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    test('Handle multiple concurrent connections', async () => {
      const connections = [];
      const connectionCount = 10;

      for (let i = 0; i < connectionCount; i++) {
        const socket = {
          ...mockSocket,
          id: `socket_${i}`,
          emit: jest.fn(),
          join: jest.fn()
        };
        connections.push(socket);
      }

      const { result, duration } = await PerformanceMonitor.measure(
        'multiple_connections',
        async () => {
          const promises = connections.map(socket => 
            gateway.handleConnection(socket as Socket)
          );
          return await Promise.all(promises);
        }
      );

      expect(duration).toBeLessThan(5000); // Handle 10 connections in < 5 seconds
      expect(result).toHaveLength(connectionCount);
    });

    test('Broadcast performance to multiple users', async () => {
      const userIds = ['user1', 'user2', 'user3', 'user4', 'user5'];
      const balanceData = { amount: 1000, currency: 'ZAR' };

      const { duration } = await PerformanceMonitor.measure(
        'multiple_broadcasts',
        async () => {
          const broadcasts = userIds.map(userId => 
            gateway.broadcastBalanceUpdate(userId, balanceData)
          );
          return await Promise.all(broadcasts);
        }
      );

      expect(duration).toBeLessThan(1000); // Broadcast to 5 users in < 1 second
    });

    test('Memory usage tracking for WebSocket connections', () => {
      const initialConnections = gateway.getConnectedUserCount();
      
      // Simulate adding connections
      for (let i = 0; i < 100; i++) {
        (gateway as any).connectedUsers.set(`socket_${i}`, {});
        (gateway as any).userSessions.set(`socket_${i}`, { id: `user_${i}` });
      }

      const finalConnections = gateway.getConnectedUserCount();
      expect(finalConnections - initialConnections).toBe(100);

      // Cleanup
      (gateway as any).connectedUsers.clear();
      (gateway as any).userSessions.clear();
    });

    test('WebSocket message throttling', async () => {
      const messages = [];
      const messageCount = 50;

      // Simulate rapid message sending
      for (let i = 0; i < messageCount; i++) {
        messages.push({
          type: 'balance_update',
          data: { amount: i * 100 },
          timestamp: new Date()
        });
      }

      const { duration } = await PerformanceMonitor.measure(
        'message_throttling',
        async () => {
          for (const message of messages) {
            await gateway.broadcastBalanceUpdate('ethan_barnes', message.data);
          }
        }
      );

      // Should handle 50 messages efficiently
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('Handle WebSocket connection errors gracefully', async () => {
      const errorSocket = {
        ...mockSocket,
        emit: jest.fn().mockRejectedValue(new Error('Connection lost')),
        disconnect: jest.fn()
      };

      // Should not throw error, should handle gracefully
      await expect(
        gateway.handleConnection(errorSocket as Socket)
      ).resolves.not.toThrow();
    });

    test('Handle broadcast failures', async () => {
      // Mock server.to to throw error
      (mockServer.to as jest.Mock).mockImplementation(() => {
        throw new Error('Broadcast failed');
      });

      // Should handle error gracefully without crashing
      await expect(
        gateway.broadcastBalanceUpdate('ethan_barnes', { amount: 1000 })
      ).resolves.not.toThrow();
    });

    test('Handle invalid message formats', async () => {
      const invalidData = {
        malformedData: true,
        amount: 'invalid',
        currency: null
      };

      // Should handle invalid data gracefully
      await expect(
        gateway.broadcastBalanceUpdate('ethan_barnes', invalidData)
      ).resolves.not.toThrow();
    });

    test('Force disconnect user for security reasons', async () => {
      const userId = 'ethan_barnes';
      const reason = 'SECURITY_VIOLATION';

      // Add user session first
      (gateway as any).connectedUsers.set('socket_123', mockSocket);
      (gateway as any).userSessions.set('socket_123', { id: userId });

      await gateway.disconnectUser(userId, reason);

      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('Real-time Financial Updates Integration', () => {
    test('End-to-end real-time transaction flow', async () => {
      // 1. Client connects
      await gateway.handleConnection(mockSocket as Socket);

      // 2. Client subscribes to financial updates
      await gateway.handleSubscribeFinancialUpdates(
        { types: ['transaction_added', 'balance_update'] },
        mockSocket as Socket
      );

      // 3. New transaction is added (simulated)
      const transaction = TestDataGenerator.generateTransaction({
        amount: 500,
        description: 'Coffee purchase',
        type: 'expense'
      });

      // 4. Broadcast transaction and balance update
      await gateway.broadcastTransactionAdded('ethan_barnes', transaction);
      await gateway.broadcastBalanceUpdate('ethan_barnes', {
        newBalance: LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH - 500,
        changeAmount: -500
      });

      // 5. Verify notifications were sent
      expect(mockServer.emit).toHaveBeenCalledWith('transaction_added', 
        expect.objectContaining({
          type: 'transaction_added',
          data: transaction
        })
      );
      expect(mockServer.emit).toHaveBeenCalledWith('balance_update',
        expect.objectContaining({
          type: 'balance_update',
          data: expect.objectContaining({
            changeAmount: -500
          })
        })
      );
    });

    test('Real-time 43V3R revenue tracking workflow', async () => {
      // 1. Connect and subscribe
      await gateway.handleConnection(mockSocket as Socket);
      await gateway.handleSubscribeFinancialUpdates(
        { types: ['business_revenue', 'goal_progress'] },
        mockSocket as Socket
      );

      // 2. Log business revenue
      const revenueData = {
        amount: 2000,
        source: 'AI consultation',
        dailyTarget: LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET,
        progress: (2000 / LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET) * 100
      };

      // 3. Broadcast revenue and goal updates
      await gateway.broadcast43V3RRevenue('ethan_barnes', revenueData);

      // Check if milestone is reached (41% of daily target)
      if (revenueData.progress > 40) {
        await gateway.broadcastMilestoneAchieved('ethan_barnes', {
          type: 'DAILY_REVENUE_MILESTONE',
          title: '40% Daily Revenue Target Achieved!',
          amount: revenueData.amount,
          progress: revenueData.progress
        });
      }

      // 4. Verify real-time updates
      expect(mockServer.emit).toHaveBeenCalledWith('business_revenue',
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 2000,
            progress: expect.any(Number)
          })
        })
      );
    });
  });

  describe('WebSocket Logging and Monitoring', () => {
    test('Log WebSocket events for audit trail', async () => {
      await gateway.handleConnection(mockSocket as Socket);

      // Verify connection logging
      expect(mockWinstonLogger.info).toHaveBeenCalledWith('WEBSOCKET_EVENT',
        expect.objectContaining({
          type: 'WEBSOCKET_EVENT',
          event: 'CONNECTION_ESTABLISHED'
        })
      );
    });

    test('Track WebSocket performance metrics', async () => {
      const startTime = Date.now();
      
      await gateway.handleConnection(mockSocket as Socket);
      await gateway.broadcastBalanceUpdate('ethan_barnes', { amount: 1000 });
      
      const totalTime = Date.now() - startTime;
      
      // WebSocket operations should be very fast
      expect(totalTime).toBeLessThan(100); // < 100ms for connection + broadcast
    });

    test('Monitor active connections and sessions', () => {
      // Add some test connections
      (gateway as any).connectedUsers.set('socket1', {});
      (gateway as any).connectedUsers.set('socket2', {});
      (gateway as any).userSessions.set('socket1', { id: 'user1' });
      (gateway as any).userSessions.set('socket2', { id: 'user2' });

      const connectionCount = gateway.getConnectedUserCount();
      const sessions = gateway.getUserSessions();

      expect(connectionCount).toBe(2);
      expect(sessions.size).toBe(2);
      expect(sessions.get('socket1')).toEqual({ id: 'user1' });
    });
  });
});