const { run } = require('../util/updateDBHelpers');
const db = require('../util/db');
const fs = require('fs').promises;
const path = require('path');

// Mock all dependencies
jest.mock('../util/db');


describe('Database Population Tests', () => {
  let mockQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = jest.fn();
    db.query = mockQuery;
    
    // Mock process.exit to prevent actual exit
    jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    process.exit.mockRestore();
  });


      await run();

      expect(require('fs').promises.readFile).toHaveBeenCalledWith(
        expect.stringContaining('iteminfo.json'),
        'utf8'
      );


    it('should handle empty JSON file', async () => {
      
      mockQuery.mockResolvedValue([]);

      await run();

      expect(mockQuery).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT IGNORE INTO valid_items')
      );
    });

    it('should handle JSON file read error', async () => {
      

      await run();

      expect(mockQuery).toHaveBeenCalled(); // Should still attempt table creation
    });

    it('should batch insert large datasets', async () => {
      
      mockQuery.mockResolvedValue([]);

      await run();

      // Should make multiple batch calls
      expect(mockQuery).toHaveBeenCalledTimes(3); // 2 batches + table checks
    });
  });

  describe('ensureRewardFieldsExist', () => {
    it('should add missing reward columns', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // TABLE doesn't exist
        .mockResolvedValueOnce([]) // CREATE TABLE
        .mockResolvedValueOnce([]) // CREATE INDEX
        .mockResolvedValueOnce([]) // Check columns
        .mockResolvedValueOnce([]); // ALTER TABLE

      await run();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ALTER TABLE users')
      );
    });

    it('should skip adding columns when all exist', async () => {
      mockQuery
        .mockResolvedValueOnce([{ TABLE_NAME: 'valid_items' }]) // TABLE exists
        .mockResolvedValueOnce([
          { COLUMN_NAME: 'WheelSpinsClaimed' },
          { COLUMN_NAME: 'dailyPlayTime' },
          { COLUMN_NAME: 'dailySpinsClaimed' }
        ]); // All columns exist

      await run();

      expect(mockQuery).not.toHaveBeenCalledWith(
        expect.stringContaining('ALTER TABLE users')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(run()).resolves.not.toThrow();
    });

    it('should handle SQL errors in table creation', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // TABLE doesn't exist
        .mockRejectedValue(new Error('Table creation failed'));

      await expect(run()).resolves.not.toThrow();
    });
  });
});