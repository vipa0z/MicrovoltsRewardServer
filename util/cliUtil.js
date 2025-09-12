const chalk = require("chalk")
const ConfigValidator = require('./ConfigValidator')
const MemoryLoader = require('./MemoryLoader')
const db = require('../database/connection')
const { logger } = require('./logger')

function showBanner() {
  console.log(chalk.magentaBright(`
    |  \\/  | \\ \\ / /  / _ \\  
    | |\\/| |  \\ V /  | (_) | 
    |_|__|_|  _\\_/_   \\___/  
    _|"""""|_| """"|_|"""""| 
    \`-0-0-'  \`-0-0-'  \`-0-0-\` 
    `));
  console.log(chalk.magentaBright(`Rewards Server v 0.5`));
  console.log("──────────────────────────────────────────────────────────────")
}

function printUsage() {
  console.log(chalk.magenta("[+] MVO Scripts Menu"));
  console.log(`
Usage:
  node server.js [--populate] [--create-admin <username> <password>] [--help]

Options:
  --populate      Run DB migrations/updates before starting.
  --create-admin  Create initial admin user.
  --cache-reset   updates the cached itemsinfo file after changing ItemInfo.json.
  --generate-achievements   runs the generateAchievementData.js script.
  --generate-chest    runs the generateDailyChestItems.js script.
  --help          Show this help message.
    `);
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  return {
    help: args.includes('--help') || args.includes('-h'),
    populate: args.includes('--populate'),
    createAdmin: args.includes('--create-admin')
      ? {
        idx: args.indexOf('--create-admin'),
        username: args[args.indexOf('--create-admin') + 1],
        password: args[args.indexOf('--create-admin') + 2]
      }
      : null
  };
}
async function testDBConnection() {
  const rows = await db.query('SELECT 1');
  if (!rows || !rows.length || rows[0]['1'] !== 1) {
    throw new Error('Database connection failed: SELECT 1 did not return 1.');
  }
  logger.success(` established connection to ${process.env.DB_NAME}\n`);
}

async function validateAndLoadConfigs() {
  const skipValidation = process.env.DISABLE_ITEM_VALIDATION === 'true';
  if (skipValidation) {
    logger.warn('SKIP loading itemInfo.json')
  } else {
    await MemoryLoader.loadAndTransformItemsInfo();
  }
  const categories = ["wheel_items_data", "shop_items_data", "playtime_draw_data", "achievements_data"];
  for (const category of categories) {
    if (!skipValidation) {
      await ConfigValidator.validateConfigFileOnStartup(category);
    }
    await MemoryLoader.loadCategoryItemsIntoMemory(category);
  }

  if (skipValidation) {
    logger.warn('[!] Item validation is disabled. Loading all configs directly into memory.')
  }
  else {
    // load itemInfo.json if validation is enabled
    await MemoryLoader.loadAndTransformItemsInfo();
  }
}
module.exports = { showBanner, printUsage, parseCliArgs, testDBConnection, validateAndLoadConfigs };

