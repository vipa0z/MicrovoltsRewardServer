require('dotenv').config();
const path = require("path")

const cors = require('cors');

// db
const db = require('./database/connection')
const { logger } = require("./util/logger")

// config utils
const cliUtil = require("./util/cliUtil")
const ConfigValidator = require('./util/ConfigValidator')
const MemoryLoader = require('./util/MemoryLoader');

// routes
const express = require('express');
const app = express();
app.use(express.json());
const { router, registerAdminRoutes, registerUserRoutes } = require('./routes/apiRoutes');
// Register routes
app.use('/api', router);
registerAdminRoutes(router);
registerUserRoutes(router);

const errorHandler = require('./middlewares/error');
app.use(errorHandler);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.ENVIRONMENT,

    });
});

// Security middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));




// views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


async function startServer() {
    cliUtil.showBanner();

    try {

        const cliArgs = cliUtil.parseCliArgs();

        if (cliArgs.help) {
            cliUtil.printUsage();
            process.exit(0);
        }

        if (cliArgs.populate) {
            await require('./util/scripts/dbUpdater').ensureRewardFieldsAndTables();
        }

        if (cliArgs.createAdmin) {
            const { username, password } = cliArgs.createAdmin;
            if (!username || !password) {
                cliUtil.printUsage();
                process.exit(1);
            }
            await require('./util/scripts/dbUpdater').ensureAdminUser(username, password);
        }



        await cliUtil.validateAndLoadConfigs();
        await cliUtil.testDBConnection();
        const PORT = process.env.PORT || 4000;

        app.listen(PORT, () => {

            console.log("──────────────────────────────────────────────────────────────");
            logger.info(`Server started on port ${PORT}, Environment: ${process.env.ENVIRONMENT || process.env.NODE_ENV || 'development'}`);
        });

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;