const CATEGORY_CONFIGS = require('../data/categoryMappings').CATEGORY_CONFIGS;
const MemoryLoader = require('../util/MemoryLoader');
const {logger} = require('../util/logger');
const fs = require('fs').promises;
const path = require('path');

exports.configureItems = function (category) {
    return async (req, res) => {
        try {
            const configMeta = CATEGORY_CONFIGS[category];
            if (!configMeta) {
                return res.status(400).json({ error: `Unknown category: ${category}` });
            }

            if (req.body === undefined) {
                return res.status(400).json({
                    error: `Missing request body. Send JSON (Content-Type: application/json) as either { "${configMeta.key}": [...] } or a top-level array of items.`
                });
            }

            // Category-specific validations
            if (configMeta.key === 'shop_items_data') {
                // Handle both array formats
                const itemsToCheck = Array.isArray(req.body) ? req.body : req.body.shop_items_data;
                if (Array.isArray(itemsToCheck)) {
                    for (const item of itemsToCheck) {
                        if (item.price === undefined) {
                            return res.status(400).json({
                                error: `Missing required field(s): price`
                            });
                        }
                    }
                }
            }

            if (configMeta.key === 'playtime_draw_data') {
                // Handle both array formats
                const itemsToCheck = Array.isArray(req.body) ? req.body : req.body.playtime_draw_data;
                if (Array.isArray(itemsToCheck)) {
                    for (const item of itemsToCheck) {
                        if (item.dropRate === undefined) {
                            return res.status(400).json({
                                error: `Missing required field(s): dropRate`
                            });
                        }
                    }
                }
            }

            let items = undefined;
            if (Array.isArray(req.body)) {
                items = req.body;
            } else if (req.body && Array.isArray(req.body[configMeta.key])) {
                items = req.body[configMeta.key];
            }

            if (!Array.isArray(items)) {
                return res.status(400).json({ 
                    error: `Expected '${configMeta.key}' to be an array of objects or the request body to be an array.` 
                });
            }

            const cleanedItems = [];
            for (const entry of items) {
                if (Array.isArray(entry)) {
                    return res.status(400).json({ 
                        error: "Nested arrays are not allowed. Each item should be a flat object." 
                    });
                }
                if (typeof entry !== 'object' || entry === null) {
                    return res.status(400).json({ 
                        error: "Each item must be a non-null object." 
                    });
                }

                const rawItemId = (entry.itemId !== undefined) ? entry.itemId : entry.ii_id;
                const rawItemName = (entry.itemName !== undefined) ? entry.itemName : entry.ii_name;
                const itemOption = entry.itemOption;

                const missing = [];
                if (rawItemId === undefined) missing.push('itemId (or ii_id)');
                if (rawItemName === undefined) missing.push('itemName (or ii_name)');
                if (itemOption === undefined) missing.push('itemOption');
                if (missing.length) {
                    return res.status(400).json({ 
                        error: `Missing required field(s): ${missing.join(', ')}` 
                    });
                }

                const toIntArray = (val) => {
                    if (typeof val === 'number' && Number.isInteger(val)) return [val];
                    if (Array.isArray(val) && val.every(id => typeof id === 'number' && Number.isInteger(id))) return val;
                    return null;
                };

                const itemIdArr = toIntArray(rawItemId);
                if (!itemIdArr) {
                    return res.status(400).json({ 
                        error: "itemId must be an integer or an array of integers." 
                    });
                }
                if (typeof rawItemName !== 'string') {
                    return res.status(400).json({ 
                        error: "itemName must be a string." 
                    });
                }
                if (typeof itemOption !== 'string') {
                    return res.status(400).json({ 
                        error: "itemOption must be a string." 
                    });
                }

                cleanedItems.push({
                    itemId: itemIdArr,
                    itemName: rawItemName,
                    itemOption,
                    // Copy over additional fields for specific categories
                    ...(entry.price !== undefined && { price: entry.price }),
                    ...(entry.dropRate !== undefined && { dropRate: entry.dropRate })
                });
            }

            const ConfigValidator = require('../util/ConfigValidator');

            const result = await ConfigValidator.validateItems(category, cleanedItems, {
                saveIfValid: false,
                fromFile: false,
            });

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid itemIds, please check your input.",
                    invalidItemIds: result.invalidItemIds
                });
            }

            const configData = MemoryLoader.getItems(configMeta.key);

            if (!Array.isArray(configData)) {
                return res.status(500).json({
                    error: `Invalid config structure. Expected '${configMeta.key}' to be an array.`
                });
            }

            const seen = new Set(
                configData.map(i => JSON.stringify(i)) // add existing items to "seen"
            );

            const uniqueNewItems = cleanedItems.filter(i => {
                const key = JSON.stringify(i); // full object signature
                if (seen.has(key)) return false; // skip if already in DB/config
                seen.add(key);
                return true;
            });

            if (uniqueNewItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: "All submitted items already exist."
                });
            }

            configData.push(...uniqueNewItems);

            const configPath = path.join(__dirname, "..", "configs", configMeta.filename);
            await fs.writeFile(
                configPath,
                JSON.stringify({ [configMeta.key]: configData }, null, 4),
                "utf8"
            );

            // Reload
            await MemoryLoader.reloadCategory(configMeta.key);

            return res.status(200).json({
                success: true,
                data: {
                    category: configMeta.key,
                    data: uniqueNewItems,
                },
                message: `${uniqueNewItems.length} new item(s) added (duplicates skipped).`
            });

        } catch (err) {
            console.error(`Error configuring ${category}:`, err);
            logger.error(`Error configuring ${category}:`, err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
};

// TODO: DEFAULT TO 30 PRICE IF NOT SPECIFIED
