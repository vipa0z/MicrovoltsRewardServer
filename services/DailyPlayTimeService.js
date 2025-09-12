const Player = require("../database/Player");
const MemmoryLoader = require("../util/MemoryLoader");
const GiftBox = require("./GiftBoxService");
const {logger} = require('../util/logger');
class DailyPlayTimeService {
    constructor(playerId, playernickname) {
      this.playerId = playerId
      this.playernickname = playernickname
      this.requiredPlaytimeInSeconds = process.env.DAILY_PLAYTIME_DRAW_TRIGGER * 3600;
      this.itemPool = MemmoryLoader.getItems('playtime_draw_data')
    }


async getProgression() {
   const eligibility = await this.checkEligibility();
   console.log(eligibility.progress)
    return {
        canDraw: eligibility.canDraw, 
        progress: eligibility.progress 
    };
}



async draw() {
  const progress = await this.checkEligibility();

  if (progress.canDraw) {
      const droppedItem = this.dropItem(this.itemPool);
      if (droppedItem) {
          logger.info('Dropped item:', droppedItem.droppedItemName);

          // Reset the counter after a successful draw
          await this.resetCounter();

          return {
              canDraw: true,
              progress: 0,                 // counter reset
              progressPercentage: "0%",    // optional
              droppedItem: droppedItem
          };
      }
      return null; // drop failed
  } else {
      logger.warn('Not enough playtime to draw');
      return {
          canDraw: false,
          progress: progress.progress,
          progressPercentage: `${progress.progressPercentage}%`
      };
  }
}
    async checkEligibility() {
      const counter = await Player.getDailyPlaytimeCounter(this.playerId);
      const safeCounter = Math.max(0, counter); // ensure non-negative
      if (counter === null || counter === undefined) {
          throw new Error(`counter not retrieved`);
      }
  
      const canDraw = safeCounter >= this.requiredPlaytimeInSeconds;
      const progressPercentage = Math.round((safeCounter / this.requiredPlaytimeInSeconds) * 100);
  
      return {
          canDraw,
          progress: safeCounter,            // progress in seconds
          progressPercentage            // display-friendly percentage
      };
  }


    dropItem(itemPool) {
       if (!itemPool || itemPool.length === 0) {
        return null;
       }
        // Calculate total weight
        const totalWeight = itemPool.reduce((sum, item) => sum + item.dropRate, 0);
        
        if (totalWeight === 0) {
          return null
        }
        
        const random = Math.random() * totalWeight;
        if (random < 0) random = 0 
        let currentWeight = 0;
        
        for (const item of itemPool) {
          currentWeight += item.dropRate;
          if (random <= currentWeight) {
            return {
              droppedItemName: item.itemName,
              droppedItemId: item.itemId
            };
          }
        }
        
        return null;
      }
  
  async claimReward(reward) {
        const droppedItem = { itemId: reward.droppedItemId };
        return await GiftBox.sendReward(droppedItem, this.playerId, this.playernickname, "Daily Playtime Reward", "ChestSys");
        
      }
      async resetCounter() {
        await Player.resetDailyPlaytimeCounter(this.playerId);
    }
}


module.exports = DailyPlayTimeService