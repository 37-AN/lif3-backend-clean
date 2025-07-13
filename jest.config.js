module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/**/*.interface.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // M1 MacBook ARM64 optimization
  maxWorkers: '50%',
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  // LIF3 specific test categories
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1'
  },
  // Performance monitoring for M1 MacBook
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
      suiteName: 'LIF3 Financial Dashboard Tests'
    }],
    ['jest-html-reporter', {
      pageTitle: 'LIF3 Test Report',
      outputPath: 'test-results/test-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true
    }]
  ],
  // Financial data test precision
  testMatch: [
    '**/financial/**/*.test.ts',
    '**/logging/**/*.test.ts',
    '**/websocket/**/*.test.ts',
    '**/integrations/**/*.test.ts',
    '**/api/**/*.test.ts',
    '**/performance/**/*.test.ts',
    '**/security/**/*.test.ts',
    '**/e2e/**/*.test.ts',
    '**/monitoring/**/*.test.ts'
  ]
};