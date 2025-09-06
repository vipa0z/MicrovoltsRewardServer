const db = require('../util/db');
const GiftBox = require('./GiftBox');
const MemoryLoader = require('../util/itemUtils/MemoryLoader');
const {logger} = require('../util/logger');

class EventShop {
    constructor (playerId) {
        this.playerId = playerId
        this.shopItems = MemoryLoader.getItems('shop_items');
    }
    async getShopItems() {
        try {
            const playerCurrencyAmount = await db.query('SELECT EventCurrency FROM users WHERE AccountID = ?', [this.playerId]);
            return { 
               items:this.shopItems,
               EventCurrency:playerCurrencyAmount[0].EventCurrency
                        };
        } catch (error) {
            console.log(`Error getting shop items: ${error.message}`);
            return { success: false, error: 'Failed to get shop items' };
        }
    }
    async buyItem(itemName) {
        try {
            // Get shop items from memory
            const shopItems = this.shopItems;
            
            // Find the item in the shop
            const item = shopItems.find(item => {
             
                return item.itemName === itemName;
            });
            console.log(item)

            if (!item) {
                return { success: false, error: 'Item not found in shop' };
            }
            // Check if player has enough currency
            const playerCurrencyAmount = (await db.query('SELECT EventCurrency FROM users WHERE AccountID = ?', [this.playerId]))[0]?.EventCurrency || 0;
            console.log(playerCurrencyAmount)
            console.log(item.price)
            if (playerCurrencyAmount < (item.price || 0)) {
                return { success: false, error: 'Not enough currency' };
            }
            console.log(item.itemId)
            const result = await GiftBox.sendReward(
                item,
                this.playerId,
                this.playerNickname,
                `You purchased ${item.itemName} from the shop.`,
                'ShopSys');
            
            const updatedCurrency = playerCurrencyAmount - (item.price || 0);
            await db.query('UPDATE users SET EventCurrency = ? WHERE AccountID = ?', [updatedCurrency, this.playerId]);

            return { 
                success: true, 
                message: `Successfully purchased ${item.itemName}`,
                item: item,
                currencyAmount: updatedCurrency
            };
        } catch (error) {
            console.log(`Error buying item: ${error.message}`);
            return { success: false, error: 'Failed to process purchase' };
        }
    }
}

module.exports = EventShop;