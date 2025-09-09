require('dotenv').config();
const path = require("path")
const { logger } = require("./util/logger")
const express = require('express');
const cors = require('cors');
const chalk = require('chalk');
const ConfigValidator = require('./util/ConfigValidator')
const db = require('./database/connection')
const MemoryLoader = require('./util/MemoryLoader');

// Import routes
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const errorHandler = require('./middlewares/error');




// Security middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

// Logging middleware
// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.ENVIRONMENT,

    });
});

// API routes
app.use('/api/', apiRoutes);
app.use(errorHandler);

app.set('view engine', 'ejs');

// Set the views folder (default is './views')
app.set('views', path.join(__dirname, 'views'));

// Serve static assets 
app.use(express.static(path.join(__dirname, 'public')));

// health check
app.get('/', (req, res) => {
    return res.send("<html><body style='text-align: center;background-color:#f0f0;'><h1>MicroVolts Rewards Server</h1> </body></html>")
});



// Database connection and server startup
const DB_PORT = process.env.DB_PORT || 3305; // default port is 3306
const PORT = process.env.PORT || 4000;


function printUsage() {
    console.log(chalk.magenta("[+] MVO Scripts Menu"))
    console.log("──────────────────────────────────────────────────────────────")
    console.log(`\nUsage:\n` +
        `  node server.js [--populate] [--create-admin <username> <password>]\n` +
        `  node server.js [-h] [--help]\n\n` +
        `Options:\n` +
        `  --populate            Run DB migrations/updates before starting.\n` +
        `  --create-admin        Create initial admin user with given <username> and <password>.\n` +
        `                       Username: alphanumeric, >=3 chars.\n` +
        `                       Password: >=6 chars, include a symbol.\n` +
        `  --help                Show this help message.\n`);
}

async function startServer() {
    try {
        // 0. Handle --help early and exit BEFORE any DB connection/logging
        if (process.argv.includes('--help') || process.argv.includes('-h')) {
            printUsage();
            process.exit(0);
        }

        // 1. Test Database Connection

        // 2. Handle --populate flag
        if (process.argv.includes('--populate')) {
            console.log(chalk.magenta("[+] MVO Scripts Menu"))
            console.log("──────────────────────────────────────────────────────────────")
            console.log(chalk.blue('   --populate flag detected. Running database population script...'));
            await require('./util/scripts/dbUpdater').run();
            console.log(chalk.green('   Database population script finished.'));
        }
        if (process.argv.includes('--create-admin')) {
            console.log(chalk.red('   --create-admin flag detected. Running admin creation script...'));
            const argv = process.argv || [];
            const idx = argv.indexOf('--create-admin');
            const username = (idx !== -1 && idx + 1 < argv.length) ? argv[idx + 1] : undefined;
            const password = (idx !== -1 && idx + 2 < argv.length) ? argv[idx + 2] : undefined;
            if (!username || !password) {
                console.warn(chalk.yellow('[!] --create-admin requires two arguments: <username> <password>'));
                printUsage();
                process.exit(1);
            }
            await require('./util/dbUpdater').ensureAdminUser(username, password);
            console.log(chalk.green('[+] Admin creation script finished.'));
        }
        console.log("\n")
        console.log(chalk.magenta('[+] Initialising MVO Rewards Server'));
        console.log("──────────────────────────────────────────────────────────────")

        const skipValidation = process.env.DISABLE_ITEM_VALIDATION === 'true';

        // 3. Load items into memory
        if (skipValidation) {
            console.log(chalk.yellow('[!] Item validation is disabled. Loading all configs directly into memory.'))
        } else {
            await MemoryLoader.loadAllItemsIntoMemory();
        }


        // 4. Validate and load config files
        const categories = ["wheel_items_data", "shop_items_data", "achievements_data", "hourly_items"];
        for (const category of categories) {
            if (!skipValidation) {
                await ConfigValidator.validateConfigFileOnStartup(category);
            }
            await MemoryLoader.loadItemsIntoMemory(category);
        }
        const rows = await db.query('SELECT 1');
        if (!rows || !rows.length || rows[0]['1'] !== 1) {
            throw new Error('Database connection failed: SELECT 1 did not return 1.');
        }
       logger.success(` established connection to ${process.env.DB_NAME}\n`);

        // 5. Start the server
        app.listen(PORT, () => {
            console.log("──────────────────────────────────────────────────────────────");
            console.log(chalk.white(`🔥 Server started on port ${PORT}, Environment: ${process.env.ENVIRONMENT || process.env.NODE_ENV || 'development'}`));
        });

    } catch (error) {
        console.error(chalk.red('❌ Failed to start server:'), error);
        process.exit(1);
    }
}

startServer();

module.exports = app;