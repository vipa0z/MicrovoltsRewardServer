// Test setup file
process.env.NODE_ENV = 'test';
process.env.USER_JWT_SECRET = 'test-user-secret';
process.env.ADMIN_JWT_SECRET = 'test-admin-secret';
process.env.MINIMUM_GRADE_TO_CONFIGURE = '5';
process.env.EMU_ADMIN_JWT = 'test-admin-jwt';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock database
jest.mock('../util/db', () => ({
  query: jest.fn()
}));

// Mock all services
jest.mock('../services/Player', () => ({
  findUserByUsername: jest.fn(),
  createUser: jest.fn()
}));

jest.mock('../services/Player', () => ({
  getPlayerById: jest.fn()
}));

jest.mock('../util/itemUtils/MemoryLoader', () => ({
  getItems: jest.fn(),
  reloadCategory: jest.fn(),
  loadAllItemsIntoMemory: jest.fn(),
  loadItemsIntoMemory: jest.fn()
}));

jest.mock('../util/itemUtils/ConfigValidator', () => ({
  validateItems: jest.fn(),
  validateConfigFileOnStartup: jest.fn(),
  CATEGORY_CONFIGS: {
    wheel_items: { key: 'wheel_items', filename: 'wheel_items.json' },
    shop_items: { key: 'shop_items', filename: 'shop_items.json' },
    hourly_items: { key: 'hourly_items', filename: 'hourly_reward_items.json' },
    achievements_data: { key: 'achievements_data', filename: 'achievements_data.json' }
  }
}));

jest.mock('../services/SpinningWheel', () => {
  return jest.fn().mockImplementation(() => ({
    spin: jest.fn(),
    checkEligibility: jest.fn(),
    drawWheel: jest.fn(),
    consumeSpin: jest.fn(),
    sendReward: jest.fn()
  }));
});

jest.mock('../services/giftBox', () => {
  return jest.fn().mockImplementation(() => ({
    sendRewardToPlayerGiftBox: jest.fn(),
    sendMultipleRewardsToPlayerGiftBox: jest.fn()
  }));
});

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn((token, secret, callback) => {
    let err = null;
    let user = null;
    if (token === 'mock-user-token' || token === 'mock-jwt-token') {
      user = { playerId: 1, Username: 'testuser', grade: 10 };
    } else if (token === 'mock-admin-token') {
      user = { playerId: 1, Username: 'testadmin', grade: 99 };
    } else {
      err = new Error('Invalid token');
    }

    if (callback) {
      return callback(err, user);
    }

    if (err) {
      throw err;
    }
    return user;
  }),
}));

// Increase timeout for async operations
jest.setTimeout(10000);

// Global test utilities
global.mockAuthToken = (payload, secret = 'test-user-secret') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, secret);
};

global.mockAdminToken = () => {
  return 'mock-admin-token';
};

global.mockUserToken = () => {
  return 'mock-user-token';
};

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});