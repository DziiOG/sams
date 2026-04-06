const moduleNameMapper = {
  '^@sams/shared$': '<rootDir>/packages/shared/src/index.ts',
  '^@sams/shared/(.*)$': '<rootDir>/packages/shared/src/$1',
  '^@sams/gateway-service/(.*)$': '<rootDir>/packages/gateway-service/src/$1',
  '^@sams/orchestrator-service/(.*)$': '<rootDir>/packages/orchestrator-service/src/$1',
  '^@sams/sender-service/(.*)$': '<rootDir>/packages/sender-service/src/$1',
  '^@sams/ai-service/(.*)$': '<rootDir>/services/ai-service/src/$1',
  '^@sams/memory-service/(.*)$': '<rootDir>/services/memory-service/src/$1'
};

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/services'],
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['/dist/'],
  moduleNameMapper,
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.base.json' }]
  },
  collectCoverageFrom: [
    'packages/**/src/**/*.ts',
    'services/**/src/**/*.ts',
    '!**/*.module.ts',
    '!**/*.controller.ts',
    '!**/main.ts',
    '!**/index.ts'
  ]
};
