const request = require('supertest');
const app = require('../server');
const SpinningWheel = require('../services/SpinningWheel');
const MemoryLoader = require('../util/itemUtils/MemoryLoader');
const Player = require('../services/Player');

// Mock the services
jest.mock('../services/SpinningWheel');
jest.mock('../util/itemUtils/MemoryLoader');
jest.mock('../services/Player');

describe('Wheel Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/wheel/draw', () => {
    it('should successfully spin the wheel when eligible', async () => {
      const mockSpinResult = {
        success: true,
        itemName: 'Epic Weapon',
        remainingSpins: 4
      };

      SpinningWheel.prototype.spin.mockResolvedValue(mockSpinResult);

      const response = await request(app)
        .post('/api/wheel/draw')
        .set('Authorization', 'Bearer valid-token')
        .send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Epic Weapon');
      expect(response.body.data.remainingSpins).toBe(4);
    });

    it('should fail when player is not eligible to spin', async () => {
      const mockSpinResult = {
        success: false,
        error: 'You need 24 more hours to claim a spin',
        hoursUntilNextSpin: 24,
        remainingSpins: 0
      };

      SpinningWheel.prototype.spin.mockResolvedValue(mockSpinResult);

      const response = await request(app)
        .post('/api/wheel/draw')
        .set('Authorization', 'Bearer valid-token')
        .send();

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('You need 24 more hours to claim a spin');
      expect(response.body.hoursLeft).toBe(24);
    });

    it('should handle internal server errors', async () => {
      SpinningWheel.prototype.spin.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/wheel/draw')
        .set('Authorization', 'Bearer valid-token')
        .send();

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal Server Error');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/wheel/draw')
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/wheel/items', () => {
    it('should return wheel items and eligibility status', async () => {
      const mockWheelItems = [
        { itemId: 1, ii_name: 'Epic Weapon', probability: 0.1 },
        { itemId: 2, ii_name: 'Rare Armor', probability: 0.2 },
        { itemId: 3, ii_name: 'Common Item', probability: 0.7 }
      ];

      const mockEligibility = {
        canSpin: true,
        remainingSpins: 5,
        hoursUntilNextSpin: 0
      };

      MemoryLoader.getItems.mockReturnValue(mockWheelItems);
      SpinningWheel.prototype.checkEligibility.mockResolvedValue(mockEligibility);

      const response = await request(app)
        .get('/api/wheel/items')
        .set('Authorization', 'Bearer valid-token')
        .send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.wheelItems).toEqual(mockWheelItems);
      expect(response.body.data.canSpin).toBe(true);
      expect(response.body.data.remainingSpins).toBe(5);
    });

    it('should handle missing player ID', async () => {
      const response = await request(app)
        .get('/api/wheel/items')
        .send();

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should handle internal server errors', async () => {
      MemoryLoader.getItems.mockReturnValue([]);
      SpinningWheel.prototype.checkEligibility.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/wheel/items')
        .set('Authorization', 'Bearer valid-token')
        .send();

      expect(response.status).toBe(500);
    });
  });
});

describe('SpinningWheel Service', () => {
  let spinningWheel;

  beforeEach(() => {
    spinningWheel = new SpinningWheel(1);
    jest.clearAllMocks();
  });

  describe('checkEligibility', () => {
    it('should calculate eligibility correctly for new player', async () => {
      const mockPlayer = {
        Playtime: 0,
        WheelSpinsClaimed: 0
      };

      Player.getPlayerById.mockResolvedValue(mockPlayer);

      const result = await spinningWheel.checkEligibility();

      expect(result.canSpin).toBe(false);
      expect(result.remainingSpins).toBe(0);
      expect(result.hoursUntilNextSpin).toBe(160);
      expect(result.totalEligibleSpins).toBe(0);
      expect(result.claimedSpins).toBe(0);
    });

    it('should calculate eligibility for player with enough playtime', async () => {
      const mockPlayer = {
        Playtime: 576000, // 160 hours in seconds
        WheelSpinsClaimed: 0
      };

      Player.getPlayerById.mockResolvedValue(mockPlayer);

      const result = await spinningWheel.checkEligibility();

      expect(result.canSpin).toBe(true);
      expect(result.remainingSpins).toBe(1);
      expect(result.hoursUntilNextSpin).toBe(0);
      expect(result.totalEligibleSpins).toBe(1);
      expect(result.claimedSpins).toBe(0);
    });

    it('should calculate eligibility for player who has claimed spins', async () => {
      const mockPlayer = {
        Playtime: 1152000, // 320 hours in seconds
        WheelSpinsClaimed: 1
      };

      Player.getPlayerById.mockResolvedValue(mockPlayer);

      const result = await spinningWheel.checkEligibility();

      expect(result.canSpin).toBe(true);
      expect(result.remainingSpins).toBe(1);
      expect(result.hoursUntilNextSpin).toBe(0);
      expect(result.totalEligibleSpins).toBe(2);
      expect(result.claimedSpins).toBe(1);
    });
  });

  describe('drawWheel', () => {
    it('should return a random item from wheel items', () => {
      const mockItems = [
        { itemId: 1, ii_name: 'Epic Weapon' },
        { itemId: 2, ii_name: 'Rare Armor' },
        { itemId: 3, ii_name: 'Common Item' }
      ];

      MemoryLoader.getItems.mockReturnValue(mockItems);

      const result = spinningWheel.drawWheel();

      expect(mockItems).toContainEqual(result);
    });

    it('should throw error when no wheel items configured', () => {
      MemoryLoader.getItems.mockReturnValue([]);

      expect(() => spinningWheel.drawWheel()).toThrow('No wheel items configured');
    });
  });
});