const db = require('../util/db');

class Player {
    constructor(playerId) {
        this.playerId = playerId;
    }
    // Map a raw DB row (Pascal/snake mix) to camelCase
    static mapUserRow(row) {
        if (!row) return null;
        return {
            accountId: row.AccountID ?? row.accountId,
            username: row.Username ?? row.username,
            password: row.Password ?? row.password,
            nickname: row.Nickname ?? row.nickname,
            grade: row.Grade ?? row.grade,
            level: row.Level ?? row.level,
            playtime: row.Playtime ?? row.playtime ?? row.dailyHoursPlayed ?? row.DailyHoursPlayed,
            wheelSpinsClaimed: row.WheelSpinsClaimed ?? row.wheelSpinsClaimed,

            // Core combat stats
            totalKills: row.Kills ?? row.kills ?? row.total_kills,
            totalDeaths: row.Deaths ?? row.deaths ?? row.total_deaths,

            // Weapon-specific kills (try multiple common variations)
            meleeKills: row.MeleeKills ?? row.meleeKills ?? row.melee_kills,
            rifleKills: row.RifleKills ?? row.rifleKills ?? row.rifle_kills,
            shotgunKills: row.ShotgunKills ?? row.shotgunKills ?? row.shotgun_kills,
            sniperKills: row.SniperKills ?? row.sniperKills ?? row.sniper_kills,
            bazookaKills: row.BazookaKills ?? row.bazookaKills ?? row.bazooka_kills,
            grenadeKills: row.GrenadeLauncherKills ?? row.grenadeLauncherKills ?? row.grenade_launcher_kills,
            gatlingKills: row.GatlingGunKills ?? row.gatlingGunKills ?? row.gatling_gun_kills,

            // Economy
            rtSpent: row.RTSpent ?? row.rtSpent ?? row.rt_spent,
            mpSpent: row.MPSpent ?? row.mpSpent ?? row.mp_spent,
        };
    }

    static async findUserByUsername(username) {
        const rows = await db.query('SELECT * FROM users WHERE Username = ?', [username]);
        return rows && rows.length ? Player.mapUserRow(rows[0]) : null;
    }
    
    static async findUserByNickname(nickname) {
        const rows = await db.query('SELECT * FROM users WHERE Nickname = ?', [nickname]);
        return rows && rows.length ? Player.mapUserRow(rows[0]) : null;
    }

    static async findUserById(accountId) {
        const rows = await db.query('SELECT * FROM users WHERE AccountID = ?', [accountId]);
        return rows && rows.length ? Player.mapUserRow(rows[0]) : null;
    }

    static async createUser(username, password, nickname, grade = 1) {   // if grade is not provided, default to 1
        await db.query(
            'INSERT INTO users (Username, Password, Nickname, Grade, level) VALUES (?, ?, ?, ?, ?)',
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
            // Select all columns so we can support a variety of schemas/namings
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

    static async updatePlaytime(playerId, newPlaytime) {
        try {
            const result = await db.query(
                'UPDATE users SET dailyHoursPlayed = ? WHERE AccountID = ? LIMIT 1',
                [newPlaytime, playerId]
            );
            return result && result.affectedRows > 0;
        } catch (err) {
            console.error(`[DB ERROR] updatePlaytime:`, err);
            throw err;
        } 
    }

    static async checkPlayerAvailability(identifier) {
        const rows = await db.query(
            `SELECT 
                 CASE 
                    WHEN Username = ? THEN 'username' 
                    WHEN NickName = ? THEN 'nickname' 
                 END AS takenField
             FROM users
             WHERE Username = ? OR NickName = ?
             LIMIT 1`,
            [identifier, identifier, identifier, identifier]
        );
        return rows.length > 0 ? rows[0].takenField : null;
    }
    
}

module.exports = Player;