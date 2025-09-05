const db = require('../util/db');
const giftBox = require('./giftBox');
const MemoryLoader = require('./MemoryLoader');
const logger = require('../util/logger');

class ShopService {
    constructor (playerId) {
        this.playerId = playerId
        this.shopItems = MemoryLoader.getItems('shop_items');
    }
    
    async buyItem(ii_id) {
        try {
            const playerCurrencyAmount = (await db.query('SELECT EventCurrencyAmount FROM players WHERE playerId = ?', [this.playerId]))[0]?.EventCurrencyAmount || 0;
            // Get shop items from memory
            const shopItems = this.shopItems;
            
            // Find the item in the shop
            const item = shopItems.find(item => {
                if (Array.isArray(item.ii_id)) {
                    return item.ii_id.includes(Number(ii_id));
                }
                return item.ii_id === Number(ii_id);
            });

            if (!item) {
                return { success: false, error: 'Item not found in shop' };
            }

            // Check if player has enough currency
            if (playerCurrencyAmount < (item.price || 0)) {
                return { success: false, error: 'Not enough currency' };
            }

            // Create reward service instance
            const giftBox = new giftBox(this.playerId);

            // Send reward to player
            let result;
            if (Array.isArray(item.ii_id)) {
                result = await giftBox.sendMultipleRewardsToPlayerGiftBox(
                    item.ii_id,
                    `You purchased ${item.itemName} from the shop.`,
                    `${process.env.EVENT_NAME} Shop`);
            } else {
                result = await giftBox.sendRewardToPlayerGiftBox(
                    item.ii_id,
                    `You purchased ${item.itemName} from the shop.`,
                    `${process.env.EVENT_NAME} Shop`
                );
            }
            
            const updatedCurrency = playerCurrencyAmount - (item.price || 0);
            await db.query('UPDATE players SET EventCurrencyAmount = ? WHERE playerId = ?', [updatedCurrency, this.playerId]);

            return { 
                success: true, 
                message: `Successfully purchased ${item.itemName}`,
                item: item,
                currencyAmount: updatedCurrency
            };
        } catch (error) {
            logger.error(`Error buying item: ${error.message}`);
            return { success: false, error: 'Failed to process purchase' };
        }
    }
}

module.exports = ShopService;