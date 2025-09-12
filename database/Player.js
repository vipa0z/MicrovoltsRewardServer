const db = require('./connection');

class Player {
    constructor(playerId) {
        this.playerId = playerId;
    }
    
    static mapUserRow(row) { // map PascalCase to camelCase
        if (!row) return null;
        return {
            accountId: row.AccountID ?? row.accountId,
            username: row.Username ?? row.username,
            password: row.Password ?? row.password,
            nickname: row.Nickname ?? row.NickName,
            grade: row.Grade ?? row.grade,
            level: row.Level ?? row.level,
            playtime: row.Playtime ?? row.playtime ?? row.dailyHoursPlayed ?? row.DailyHoursPlayed,
            wheelSpinsClaimed: row.WheelSpinsClaimed ?? row.wheelSpinsClaimed,

            totalKills: row.Kills ?? row.kills ?? row.total_kills,
            totalDeaths: row.Deaths ?? row.deaths ?? row.total_deaths,

            meleeKills: row.MeleeKills,
            rifleKills: row.RifleKills,
            shotgunKills: row.ShotgunKills,
            sniperKills: row.SniperKills,
            bazookaKills: row.BazookaKills,
            grenadeKills: row.GrenadeKills,
            gatlingKills: row.GatlingKills,

            rtSpent: row.RTSpent,
            mpSpent: row.MPSpent,
            twoHoursCounter: row.TwoHoursCounter,
        };
     
    }
    static mapAchievementRow(row) { // map PascalCase to camelCase
        if (!row) return null;
        return {
            accountId: row.AccountID ?? row.accountId,
            achievementSlug: row.AchievementSlug ?? row.achievementSlug,
        };
    }
    
    static async findUserByUsername(username) {
        const rows = await db.query('SELECT * FROM users WHERE Username = ?', [username]);
        return rows && rows.length ? Player.mapUserRow(rows[0]) : null;
    }
    
    static async findUserBynickname(nickname) {
        const rows = await db.query('SELECT * FROM users WHERE nickname = ?', [nickname]);
        return rows && rows.length ? Player.mapUserRow(rows[0]) : null;
    }

    static async findUserById(accountId) {
        const rows = await db.query('SELECT * FROM users WHERE AccountID = ?', [accountId]);
        return rows && rows.length ? Player.mapUserRow(rows[0]) : null;
    }

    static async createUser(username, password, nickname, grade = 1) {   // if grade is not provided, default to 1
        await db.query(
            'INSERT INTO users (Username, Password, nickname, Grade, level) VALUES (?, ?, ?, ?, ?)',
            [username, password, nickname, grade, 1]
        );
        return true;
    }

    static async getPlayerDetails(username) {
        const rows = await db.query('SELECT * FROM users WHERE Username = ?', [username]);
        if (!rows || rows.length === 0) {
            return null;
        }
        return Player.mapUserRow(rows[0]);
    }

    static async getPlayerById(playerId) {
        try {
            const rows = await db.query(
                'SELECT * FROM users WHERE AccountID = ? LIMIT 1',
                [playerId]
            );

            if (!rows || rows.length === 0) return null;

            return Player.mapUserRow(rows[0]);
        } catch (err) {
            console.error(`[DB ERROR] getPlayerById:`, err);
            throw err;
        } 
    }


    static async checkPlayerAvailability(identifier) {
        const rows = await db.query(
            `SELECT 
                 CASE 
                    WHEN Username = ? THEN 'username' 
                    WHEN nickname = ? THEN 'nickname' 
                 END AS takenField
             FROM users
             WHERE Username = ? OR nickname = ?
             LIMIT 1`,
            [identifier, identifier, identifier, identifier]
        );
        return rows.length > 0 ? rows[0].takenField : null;
    }
    //wheel
    static async getWheelData(playerId) {
        const rows = await db.query('SELECT WheelSpinsClaimed, Playtime FROM users WHERE AccountID = ? LIMIT 1', [playerId]);
        return rows.length > 0 ? {
            wheelSpinsClaimed: Player.mapUserRow(rows[0]).wheelSpinsClaimed,
            playtime: Player.mapUserRow(rows[0]).playtime
        } : null;
    }

    static async updateSpinsClaimed(playerId, spinsClaimed) {
        const rows = await db.query(
                        'UPDATE users SET WheelSpinsClaimed = ? WHERE AccountID = ? LIMIT 1',
                        [spinsClaimed, playerId]
                    );
                    return rows;
    }

    static async getPlayerAchievements(playerId) {
        const rows = await db.query(
          'SELECT * FROM player_achievements WHERE AccountId = ?',
          [playerId]
        );
      
        return rows
      }
    
    static async updatePlayerAchievements(achievementSlug, playerId) {
        const rows = await db.query(
                        'INSERT INTO player_achievements (AchievementSlug, AccountId) VALUES (?, ?)',
                        [achievementSlug, playerId]
                    );
                    return rows;
    }
    
    
    //daily playtime
    static async getDailyPlaytimeCounter(playerId) { 
        const rows = await db.query('SELECT TwoHoursCounter FROM users WHERE AccountID = ? LIMIT 1', [playerId]);
        const counter = Player.mapUserRow(rows[0]).twoHoursCounter
        return counter != null ? counter : 0;
    }
    
    static async resetDailyPlaytimeCounter(playerId) {
        try {
            const result = await db.query(
                'UPDATE users SET TwoHoursCounter = ? WHERE AccountID = ? LIMIT 1',
                [0, playerId]
            );
            return result && result.affectedRows > 0;
        } catch (err) {
            console.error(`[DB ERROR] resetDailyPlaytimeCounter:`, err);
            throw err;
        } 
    }
}

module.exports = Player;