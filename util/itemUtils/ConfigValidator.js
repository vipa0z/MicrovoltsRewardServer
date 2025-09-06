const db = require("../db");
const fs = require("fs").promises;
const path = require("path");
const chalk = require("chalk");
const {logger} = require('../logger')
const { CATEGORY_CONFIGS } = require('./categoryConfigs');

function extractItemIds(items) {
    const ids = [];
// check for arrays of itemId and unwrap them
    for (const wrapper of items) {
        const item = Array.isArray(wrapper) ? wrapper[0] : wrapper;

        if (!item) continue;

        if (Array.isArray(item.itemId)) {
            ids.push(...item.itemId);
        }
        else if (typeof item.itemId === "number") {
            ids.push(item.itemId);
        }
    }
    return ids.filter(id => typeof id === "number" && !isNaN(id));

}

//  Main item validator
async function validateItems(category, items, options = {}) {
    const allItems = await require("./MemoryLoader").getAllItems();
    const { saveIfValid = true, fromFile = false } = options;
    const config = CATEGORY_CONFIGS[category];
    if (!config) throw new Error(`Unknown category: ${category}`);

    const itemIds = extractItemIds(items);
    if (!itemIds.length) {
        return { success: true, validItemIds: [], skipped: true };
    }
    const validItemIds = allItems.map(row => row.itemId);
    const invalidItemIds = itemIds.filter(itemId => !validItemIds.includes(itemId));

    if (invalidItemIds.length > 0) {
        return { success: false, invalidItemIds };
    }

    if (saveIfValid && !fromFile) {
        const configPath = path.join(__dirname, "..", "..", "configs", config.filename);
        let fileData = { [config.key]: [] };

        try {
            const raw = await fs.readFile(configPath, "utf8");
            fileData = JSON.parse(raw);
            if (!Array.isArray(fileData[config.key])) {
                throw new Error(`Expected array in ${config.filename} under key ${config.key}`);
            }
        } catch (err) {
            if (err.code !== "ENOENT" && !(err instanceof SyntaxError)) throw err;
        }

        // Flatten array-wrapped items before saving
        const normalizedItems = items.map(item => Array.isArray(item) ? item[0] : item);
        fileData[config.key].push(...normalizedItems);

        await fs.writeFile(configPath, JSON.stringify(fileData, null, 4), "utf8");
        logger.info(`Saved ${normalizedItems.length} items to ${config.filename}`);
    }

    return { success: true, validItemIds };
}

async function validateConfigFileOnStartup(category) {
    const config = CATEGORY_CONFIGS[category];
    if (!config) throw new Error(`Unknown category: ${category}`);

    // Route achievements to a dedicated validator due to different structure
    if (category === 'achievements_data') {
        return await validateAchievementsOnStartup();
    }

    const configPath = path.join(__dirname, "..", "..", "configs", config.filename);

    try {
        let configData = {};
        let shouldWrite = false;

        // Try to read the file
        try {
            const raw = await fs.readFile(configPath, "utf8");
            if (!raw.trim()) {
                // Empty file
                logger.warn(`[!] ${config.filename} is empty. Initializing with empty '${config.key}' array.`);
                configData = { [config.key]: [] };
                shouldWrite = true; // only write when truly empty
            } else {
                try {
                    configData = JSON.parse(raw);
                } catch (parseErr) {
                    logger.warn(`[!] ${config.filename} contains invalid JSON. Will NOT overwrite. A backup will be created; please fix the file manually.`);
                    await backupFile(configPath, raw);
                    return { success: false, error: 'Invalid JSON' };
                }
            }
        } catch (err) {
            if (err.code === "ENOENT") {
                logger.warn(`[!] ${config.filename} does not exist. Creating...`);
                configData = { [config.key]: [] };
                shouldWrite = true;
            } else {
                throw err;
            }
        }

        // If missing or invalid, do not overwrite; just warn and validate against empty
        if (typeof configData !== 'object' || !configData.hasOwnProperty(config.key)) {
            logger.warn(`[!] ${config.filename} missing expected key '${config.key}'. File will be left untouched. Validation will proceed with an empty list.`);
            configData = { [config.key]: [] };
            // shouldWrite remains as-is (no auto-fix write)
        }

        if (shouldWrite) {
            await fs.writeFile(configPath, JSON.stringify(configData, null, 4), "utf8");
            logger.info(`[✓] Initialized '${config.filename}' with empty '${config.key}' array.`);
        }

        const keys = Object.keys(configData);
        if (keys.length > 1 || keys[0] !== config.key) {
            console.log(chalk.red(`Invalid structure in file: ${configPath}\nOnly the key '${config.key}' is allowed, but found: ${keys.join(", ")}`));
        }

        let items = configData[config.key];
        if (!Array.isArray(items)) {
            items = [items]; // wrap single object
        }

        items = items.map(item => Array.isArray(item) ? item[0] : item);
        for (const item of items) {
            const structureCheck = validateItemStructure(item,category);
            if (!structureCheck.valid) {
                logger.error(`[!] Field validation failed for an item in ${config.filename}: ${structureCheck.error}, \n[!] exiting....`);
                process.exit(1);
            }

            // normalize itemId to array to match runtime behavior
            item.itemId = Array.isArray(item.itemId) ? item.itemId : [item.itemId];
        }
        const result = await validateItems(category, items, { saveIfValid: false, fromFile: true });

        if (!result.success) {
            console.log(chalk.red(`[!] Invalid item IDs in ${config.filename}: ${result.invalidItemIds.join(", ")}`));
            process.exit(0)
        } else {
            console.log(chalk.green(`[✓] All item IDs in ${config.filename} are valid.`));
        }

        return result;

    } catch (err) {
        logger.error(`Error validating ${category} config: ${err.message}\n${err.stack}`);
        return { success: false, error: err.message };
    }
}

async function validateAchievementsOnStartup() {
    const configPath = path.join(__dirname, "..", "..", "configs", "achievements_data.json");
    try {
        let raw = '';
        try {
            raw = await fs.readFile(configPath, 'utf8');
        } catch (err) {
            if (err.code === 'ENOENT') {
                logger.warn(`[!] achievements_data.json does not exist. Creating minimal structure {"achievements": {}}.`);
                const data = { achievements: {} };
                await fs.writeFile(configPath, JSON.stringify(data, null, 4), 'utf8');
                return { success: true, validItemIds: [], skipped: true };
            }
            throw err;
        }

        if (!raw.trim()) {
            logger.warn(`[!] achievements_data.json is empty. Initializing with {"achievements": {}}.`);
            const data = { achievements: {} };
            await fs.writeFile(configPath, JSON.stringify(data, null, 4), 'utf8');
            return { success: true, validItemIds: [], skipped: true };
        }

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            logger.warn(`[!] achievements_data.json contains invalid JSON. Will NOT overwrite; creating a backup and skipping validation.`);
            await backupFile(configPath, raw);
            return { success: false, error: 'Invalid JSON' };
        }

        if (typeof parsed !== 'object' || parsed === null) {
            logger.warn(`[!] achievements_data.json root must be an object. File will be left untouched.`);
            return { success: false, error: 'Root must be an object' };
        }

        const achievementsRoot = parsed.achievements;
        if (typeof achievementsRoot !== 'object' || achievementsRoot === null) {
            logger.warn(`[!] achievements_data.json missing 'achievements' object. File will be left untouched.`);
            return { success: false, error: "Missing 'achievements' object" };
        }

        const allItems = require('./MemoryLoader').getAllItems();
        const validItemIds = new Set(allItems.map(r => r.itemId));
        const invalidItemIds = new Set();

   
            for (const ach of achievementsRoot) {
                // Basic structure checks
                if (!ach || typeof ach !== 'object') {
                    logger.warn(`[!] Skipping non-object achievement entry in '${achievementsRoot}'.`);
                    continue;
                }
                if (typeof ach.achievementSlug !== 'string') {
                    logger.warn(`[!] Achievement missing valid 'achievementSlug' in '${achievementsRoot}'.`);
                }
                if (ach.rewards && Array.isArray(ach.rewards)) {
                    for (const reward of ach.rewards) {
                        if (!reward || typeof reward !== 'object') continue;
                        const ids = Array.isArray(reward.itemId) ? reward.itemId : [reward.itemId];
                        for (const id of ids) {
                            if (typeof id === 'number' && Number.isInteger(id)) {
                                if (!validItemIds.has(id)) invalidItemIds.add(id);
                            }
                        }
                    }
                }
            }
       

        if (invalidItemIds.size > 0) {
            console.log(chalk.red(`[!] Invalid reward item IDs in achievements_data.json: ${Array.from(invalidItemIds).join(', ')},`));
            return { success: false, invalidItemIds: Array.from(invalidItemIds) };
        }

        console.log(chalk.green(`[✓] All reward item IDs in achievements_data.json are valid.`));
        return { success: true, validItemIds: Array.from(validItemIds) };
    } catch (err) {
        logger.error(`Error validating achievements config: ${err.message}\n${err.stack}`);
        return { success: false, error: err.message };
    }
}

function validateItemStructure(entry, category) {
    let requiredFields = ['itemId', 'itemName', 'itemOption'];

    // shop items must include a price
    if (category === 'shop_items') {
        requiredFields.push('price');
    }

    const entryKeys = Object.keys(entry);
    const missing = requiredFields.filter(field => !(field in entry));
    if (missing.length > 0) {
        return { valid: false, error: `Missing required field(s): ${missing.join(', ')}` };
    }

    const unknown = entryKeys.filter(key => !requiredFields.includes(key));
    if (unknown.length > 0) {
        return { valid: false, error: `Unknown field(s): ${unknown.join(', ')}` };
    }

    const itemId = entry.itemId;
    if (
        !(
            (typeof itemId === 'number' && Number.isInteger(itemId)) ||
            (Array.isArray(itemId) && itemId.every(id => typeof id === 'number' && Number.isInteger(id)))
        )
    ) {
        return { valid: false, error: `Invalid itemId: must be an integer or array of integers.` };
    }

    if (typeof entry.itemName !== 'string') {
        return { valid: false, error: `Invalid itemName: must be a string.` };
    }
    if (typeof entry.itemOption !== 'string') {
        return { valid: false, error: `Invalid itemOption: must be a string.` };
    }

    if (category === 'shop_items' && typeof entry.price !== 'number') {
        return { valid: false, error: `Invalid price: must be a number.` };
    }

    return { valid: true };
}


module.exports = {
    validateItems,
    validateConfigFileOnStartup,
    validateItemStructure
};
