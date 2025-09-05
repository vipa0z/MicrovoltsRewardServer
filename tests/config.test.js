const request = require('supertest');
const app = require('../server');
const fs = require('fs').promises;
const path = require('path');
const ConfigValidator = require('../util/itemUtils/ConfigValidator');
const MemoryLoader = require('../util/itemUtils/MemoryLoader');


jest.mock('../util/itemUtils/ConfigValidator');
jest.mock('../util/itemUtils/MemoryLoader');

describe('Configuration Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/config/wheel', () => {
    it('should successfully configure wheel items', async () => {
      const mockConfigData = { wheel_items: [] };
      const newItems = [
        {
          itemId: 12345,
          itemName: 'Epic Weapon',
          itemOption: 'PERM'
        }
      ];


      ConfigValidator.validateItems.mockResolvedValue({ success: true });
      MemoryLoader.reloadCategory.mockResolvedValue();

      const response = await request(app)
        .post('/api/config/wheel')
        .set('Authorization', 'Bearer admin-token')
        .send({ wheel_items: newItems });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('wheel_items');
      expect(response.body.data.items).toEqual(newItems);
    });

    it('should validate required fields', async () => {
      const invalidItems = [
        {
          itemName: 'Epic Weapon',
          itemOption: 'PERM'
          // Missing itemId
        }
      ];

      const response = await request(app)
        .post('/api/config/wheel')
        .set('Authorization', 'Bearer admin-token')
        .send({ wheel_items: invalidItems });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required field');
    });

    it('should validate itemId type', async () => {
      const invalidItems = [
        {
          itemId: 'invalid-string',
          itemName: 'Epic Weapon',
          itemOption: 'PERM'
        }
      ];

      const response = await request(app)
        .post('/api/config/wheel')
        .set('Authorization', 'Bearer admin-token')
        .send({ wheel_items: invalidItems });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('itemId must be an integer');
    });

    it('should handle invalid itemIds from validator', async () => {
      const mockConfigData = { wheel_items: [] };
      const newItems = [
        {
          itemId: 99999,
          itemName: 'Invalid Item',
          itemOption: 'PERM'
        }
      ];


      ConfigValidator.validateItems.mockResolvedValue({ 
        success: false, 
        invalidItemIds: [99999] 
      });

      const response = await request(app)
        .post('/api/config/wheel')
        .set('Authorization', 'Bearer admin-token')
        .send({ wheel_items: newItems });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.invalidItemIds).toEqual([99999]);
    });

    it('should handle file system errors', async () => {
      

      const response = await request(app)
        .post('/api/config/wheel')
        .set('Authorization', 'Bearer admin-token')
        .send({ wheel_items: [{ itemId: 12345, itemName: 'Test', itemOption: 'PERM' }] });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('File not found');
    });
  });

  describe('POST /api/config/shop', () => {
    it('should successfully configure shop items', async () => {
      const mockConfigData = { shop_items: [] };
      const newItems = [
        {
          itemId: [12345, 12346],
          itemName: 'Weapon Bundle',
          itemOption: '7D'
        }
      ];


      ConfigValidator.validateItems.mockResolvedValue({ success: true });
      MemoryLoader.reloadCategory.mockResolvedValue();

      const response = await request(app)
        .post('/api/config/shop')
        .set('Authorization', 'Bearer admin-token')
        .send({ shop_items: newItems });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('shop_items');
    });

    it('should handle array of itemIds', async () => {
      const mockConfigData = { shop_items: [] };
      const newItems = [
        {
          itemId: [1001, 1002, 1003],
          itemName: 'Item Bundle',
          itemOption: 'PERM'
        }
      ];


      ConfigValidator.validateItems.mockResolvedValue({ success: true });
      MemoryLoader.reloadCategory.mockResolvedValue();

      const response = await request(app)
        .post('/api/config/shop')
        .set('Authorization', 'Bearer admin-token')
        .send({ shop_items: newItems });

      expect(response.status).toBe(200);
      expect(response.body.data.items[0].itemId).toEqual([1001, 1002, 1003]);
    });
  });

  describe('POST /api/config/hourly', () => {
    it('should successfully configure hourly reward items', async () => {
      const mockConfigData = { hourly_items: [] };
      const newItems = [
        {
          itemId: 2001,
          itemName: 'Daily Reward',
          itemOption: '1D'
        }
      ];


      ConfigValidator.validateItems.mockResolvedValue({ success: true });
      MemoryLoader.reloadCategory.mockResolvedValue();

      const response = await request(app)
        .post('/api/config/hourly')
        .set('Authorization', 'Bearer admin-token')
        .send({ hourly_items: newItems });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('hourly_items');
    });
  });

  describe('POST /api/config/achievements', () => {
    it('should successfully configure achievement items', async () => {
      const mockConfigData = { achievements_data: [] };
      const newItems = [
        {
          itemId: 3001,
          itemName: 'Achievement Reward',
          itemOption: 'PERM'
        }
      ];


      ConfigValidator.validateItems.mockResolvedValue({ success: true });
      MemoryLoader.reloadCategory.mockResolvedValue();

      const response = await request(app)
        .post('/api/config/achievements')
        .set('Authorization', 'Bearer admin-token')
        .send({ achievements_data: newItems });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('achievements_data');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all config endpoints', async () => {
      const endpoints = [
        '/api/config/wheel',
        '/api/config/shop',
        '/api/config/hourly',
        '/api/config/achievements'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .post(endpoint)
          .send({ wheel_items: [{ itemId: 12345, itemName: 'Test', itemOption: 'PERM' }] });

        expect(response.status).toBe(401);
      }
    });
  });

  describe('Validation Edge Cases', () => {
    it('should reject nested arrays', async () => {
      const response = await request(app)
        .post('/api/config/wheel')
        .set('Authorization', 'Bearer admin-token')
        .send({ wheel_items: [[{ itemId: 12345, itemName: 'Test', itemOption: 'PERM' }]] });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Nested arrays are not allowed');
    });

    it('should reject null items', async () => {
      const response = await request(app)
        .post('/api/config/wheel')
        .set('Authorization', 'Bearer admin-token')
        .send({ wheel_items: [null] });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Each item must be a non-null object');
    });

    it('should reject unknown fields', async () => {
      const response = await request(app)
        .post('/api/config/wheel')
        .set('Authorization', 'Bearer admin-token')
        .send({ 
          wheel_items: [{ 
            itemId: 12345, 
            itemName: 'Test', 
            itemOption: 'PERM', 
            invalidField: 'value' 
          }] 
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Unknown field(s)');
    });
  });
});