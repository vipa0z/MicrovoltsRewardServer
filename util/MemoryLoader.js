const fs = require('fs').promises;
const path = require('path');
const {logger} = require('./logger');
const { CATEGORY_CONFIGS } = require('../data/categoryMappings');
const allItemsPath = path.join(__dirname, '..', 'data', 'itemInfo.json');
class MemoryLoader {
    static items = {
        wheel_items_data: [],
        shop_items_data: [],
        hours_reward_data: [],
        achievements_data: []
    }
    static allItems = [];
 


    static async loadAllItemsIntoMemory() {
        try {
            const data = await fs.readFile(allItemsPath, "utf8");
    
            const items = JSON.parse(data);
    
            if (!Array.isArray(items)) {
                throw new Error("❌ Items file must be a JSON array at the top level.");
            }
            this.allItems = items.map((item, idx) => {
                const newItem = {};
    
                for (const key in item) {
                    if (!Object.prototype.hasOwnProperty.call(item, key)) continue;
    
                    if (key === "ii_time") {
                        newItem.itemDuration = item[key];
                    } else if (key.startsWith("ii_")) {
                        const camelCasePart = key
                            .substring(3)
                            .split("_")
                            .map(word =>
                                word
                                    ? word.charAt(0).toUpperCase() + word.slice(1)
                                    : ""
                            )
                            .join("");
                        const newKey = "item" + camelCasePart;
                        newItem[newKey] = item[key];
                    } else {
                        newItem[key] = item[key];
                    }
                }
    
                return newItem;
            });
    
            return this.allItems;
        } catch (err) {
            console.error("❌ Failed to load all items into memory:", err.message);
            logger.error("Failed to load all items into memory.", err);
            throw err;
        }
    }
    

    static async loadItemsIntoMemory(category) {
        try {
            const config = CATEGORY_CONFIGS[category];
            
            
            if (!config) {
                throw new Error(`Unknown category: ${category}`);
            }

            const configPath = path.join(__dirname, '..', 'data', 'configs', config.filename);
            const data = await fs.readFile(configPath, 'utf8');
            const parsedData = JSON.parse(data);

            // Achievement data
            if (category === 'achievements_data') {
                const achievementsArray = parsedData[config.key]; // 'achievements'
                if (!Array.isArray(achievementsArray)) {
                    throw new Error(`Invalid format in ${config.filename}. Expected array under key '${config.key}'`);
                }
            
                this.items[category] = achievementsArray;
                logger.success(`[✓] Loaded ${achievementsArray.length} achievements into memory`);
                return this.items[category];
            }
            

            if (!parsedData[config.key] || !Array.isArray(parsedData[config.key])) {
                throw new Error(`Invalid format in ${config.filename}. Expected array under key '${config.key}'`);
            }

            // Store items in memory
            this.items[config.key] = parsedData[config.key];
            logger.success(`[✓] Loaded ${this.items[config.key].length} ${config.key} into memory`);
            
            return this.items[config.key];
        } catch (error) {
            logger.error(`Error loading ${category} into memory: ${error}`);
            throw error;
        }
    }


    static getItems(category) {
        if (!this.items[category]) {
            logger.warn(`[!] Attempted to access non-existent category: ${category}`);
            return [];
        }
        return this.items[category];
    }
      static getAllItems() {
        if (!this.allItems) {
            logger.warn(`[!] no items`);
            return [];
        }
        return this.allItems
    }
    static getAchievementsData() {
        if (!this.items['achievements_data']) {
            logger.warn(`[!] Attempted to access non-existent category: ${category}`);
            return [];
        }
        return this.items['achievements_data'];
    }
    
 
    static getItemById(category, itemId) {
        if (!this.items[category]) {
            logger.warn(`[!] Attempted to access non-existent category: ${category}`);
            return null;
        }
        
        // Convert itemId to number for comparison if it's a string
        const id = typeof itemId === 'string' ? Number(itemId) : itemId;
        
        // Find item where ii_id matches (either as single value or in array)
        return this.items[category].find(item => {
            const ids = Array.isArray(item.ii_id) ? item.ii_id : [item.ii_id];
            return ids.includes(id);
        }) || null;
    }

 
    static async reloadCategory(category) {
        try {
            await this.loadItemsIntoMemory(category);
            logger.info(`[✓] Reloaded ${category} into memory`);
            return true;
        } catch (error) {
            logger.error(`Error reloading ${category}: ${error.message}`);
            return false;
        }
    }
}

module.exports = MemoryLoader;