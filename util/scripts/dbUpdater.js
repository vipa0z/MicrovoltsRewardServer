const {logger} = require('../logger');
const db = require('../../database/connection');
const crypto = require('crypto');
const chalk = require('chalk');

function isValidUsername(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 3) return false;
  return /^[A-Za-z0-9]+$/.test(trimmed);
}

//  validate password policy
function isValidPassword(pw) {
  if (typeof pw !== 'string') return false;
  if (pw.length < 6) return false;
  // At least one non-alphanumeric symbol
  return /[^A-Za-z0-9]/.test(pw);
}

// Add columns if missing
async function ensureRewardFieldsExist() {
  console.log(chalk.green(' Updating Users Table'));

  const rows = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
     AND COLUMN_NAME IN ('WheelSpinsClaimed', 'TwoHoursCounter', 'dailySpinsClaimed', 'EventCurrency')`,
    [process.env.DB_NAME]
  );

  const existing = rows.map((r) => r.COLUMN_NAME);
  const toAdd = [];

  if (!existing.includes('WheelSpinsClaimed')) {
    toAdd.push(`ADD COLUMN WheelSpinsClaimed INT DEFAULT 0`);
    console.log('added wheel column 1.');
  }
  if (!existing.includes('dailySpinsClaimed')) {
    toAdd.push(`ADD COLUMN dailySpinsClaimed INT DEFAULT 0`);
    console.log('added daily column 1.');
  }
  if (!existing.includes('TwoHoursCounter')) {
    toAdd.push(`ADD COLUMN TwoHoursCounter INT DEFAULT 0`);
    console.log('added two hours counter column 1.');
  }
  if (!existing.includes('EventCurrency')) {
    toAdd.push(`ADD COLUMN EventCurrency INT DEFAULT 0`);
    console.log('added event currency column 1.');
  }
  if (toAdd.length > 0) {
    const query = `ALTER TABLE users ${toAdd.join(', ')}`;
    await db.query(query);
    logger.info('[+] Added missing reward columns:', toAdd);
  }


}

async function ensurePlayerAchievementsTable() {

  console.log(chalk.green(' Updating Player Achievements Table'));
  // Check if the table exists
  const res = await db.query(`
        SHOW TABLES LIKE 'player_achievements'
    `);

  if (res.length === 0) {
    console.log('Creating player_achievements table...');

    await db.query(`
            CREATE TABLE player_achievements ( 
                id INT PRIMARY KEY AUTO_INCREMENT,
                AchievementSlug VARCHAR(50) NOT NULL UNIQUE,
                AccountId INT NOT NULL,
                CONSTRAINT fk_user
                    FOREIGN KEY (AccountId) REFERENCES users(AccountID)
                    ON DELETE CASCADE
            )
        `);

    console.log("✅ Table 'player_achievements' created.");
  } else {
    console.log("✅ Table 'player_achievements' already exists.");
  }
}

// Create initial admin user if not exists
async function ensureAdminUser(username, password) {
  const USERNAME = (username || '').trim();
  const nickname = USERNAME;
  const GRADE = 7;
  const LEVEL = 1;

  if (!isValidUsername(USERNAME)) {
    throw new Error("Admin username does not meet policy: alphanumeric and at least 3 characters.");
  }

  // Check existing user by username
  const existing = await db.query('SELECT 1 FROM users WHERE Username = ? LIMIT 1', [USERNAME]);
  if (existing && existing.length > 0) {
    console.log(`✅ Admin user '${USERNAME}' already exists. Skipping creation.`);
    process.exit(1);
  }

  if (!isValidPassword(password)) {
    console.log(chalk.red('Admin password does not meet policy: at least 6 characters and include at least one symbol.'));
    process.exit(1);
  }

  const hashed = crypto.createHash('sha256').update(password).digest('hex');
  await db.query(
    'INSERT INTO users (Username, Password, nickname, Grade, level) VALUES (?, ?, ?, ?, ?)',
    [USERNAME, hashed, nickname, GRADE, LEVEL]
  );
  console.log(`✅ Created admin user '${USERNAME}' with grade ${GRADE}.`);
  process.exit(0);

}

exports.ensureRewardFieldsAndTables = async function () {
  try {
    await ensureRewardFieldsExist();
    await ensurePlayerAchievementsTable();

    // If requested via CLI, create initial admin: expects --create-admin <username> <password>
    if ((process.argv || []).includes('--create-admin')) {
      const argv = process.argv || [];
      const idx = argv.indexOf('--create-admin');
      const username = (idx !== -1 && idx + 1 < argv.length) ? argv[idx + 1] : undefined;
      const adminPass = (idx !== -1 && idx + 2 < argv.length) ? argv[idx + 2] : undefined;
      if (!username || !adminPass) {
        throw new Error("--create-admin requires two arguments: <username> <password>");
      }
      await ensureAdminUser(username, adminPass);
    }
    logger.info('columnbase update script finished successfully.');
    process.exit(0);
  } catch (err) {
    logger.error('Error running db updater:', err);
    process.exit(1);
  }
};

// Optionally export helpers
module.exports.ensureRewardFieldsExist = ensureRewardFieldsExist;
module.exports.ensurePlayerAchievementsTable = ensurePlayerAchievementsTable;
module.exports.ensureAdminUser = ensureAdminUser;