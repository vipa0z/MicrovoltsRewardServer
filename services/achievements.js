const db = require("../util/db")
const MemoryLoader = require("../util/itemUtils/MemoryLoader")
const Player = require("./Player")
const GiftBox = require("./GiftBox")

class Achievements {
    constructor(playerId, playerNickName) {
        this.playerId = playerId
        this.playerNickName = playerNickName
    }

    async getAchievements() {
      // 1. Load player data
      const player = await Player.getPlayerById(this.playerId);
      if (!player) throw new Error("Player not found");
  
      // 2. Load player's achievement records from DB
      const playerAchievementRows = await db.query(
          `SELECT * FROM player_achievements WHERE accountId = ?`,
          [this.playerId]
      );
  
      // Build lookup for claimed/unlocked achievements
      const playerAchievementMap = new Map();
      for (const record of playerAchievementRows || []) {
          const key = String(record.achievementSlug || "").toLowerCase();
          playerAchievementMap.set(key, { claimed: record.claimed === 1, unlocked: record.unlocked === 1 });
      }
  
      // 3. Load achievement templates (from memory JSON)
      const rawTemplates = MemoryLoader.getAchievementsData();
      const achievementTemplates = Array.isArray(rawTemplates)
          ? rawTemplates
          : rawTemplates && Array.isArray(rawTemplates.achievements)
              ? rawTemplates.achievements
              : [];
  
      // 4. Normalize player stats for quick matching
      const statMap = {};
      for (const [statKey, statValue] of Object.entries(player)) {
          const normalizedKey = String(statKey).toLowerCase().replace(/[\s_]/g, "");
          statMap[normalizedKey] = Number(statValue) || 0;
      }
  
      // 5. Normalize helper
      const normalizeKey = (k) => String(k).toLowerCase().replace(/[\s_]/g, "");
  

      // 6. Evaluate each achievement
      const evaluatedAchievements = achievementTemplates.map((template) => {
          const slug = normalizeKey(template.achievementSlug);
          const record = playerAchievementMap.get(slug) || { claimed: false, unlocked: false };
  
          // Extract numeric requirements
          const requirements = Object.entries(template.requirements || {}).filter(
              ([, value]) => typeof value === "number"
          );
  
          // Calculate progress
          const progressDetails = requirements.map(([key, target]) => {
              const current = statMap[normalizeKey(key)] || 0;
              const percent = target > 0 ? Math.min(100, Math.floor((current / target) * 100)) : 0;
              return { key, current, target, percent };
          });
  
          const overallPercent = progressDetails.length
              ? Math.floor(progressDetails.reduce((sum, d) => sum + d.percent, 0) / progressDetails.length)
              : 0;
  
          const unlocked = progressDetails.length
              ? progressDetails.every((d) => d.percent === 100)
              : false;
  
          const inProgress = !unlocked && progressDetails.some((d) => d.percent > 0);
 
  
          return {
              slug,
              status: {
                  claimed: record.claimed,
                  unlocked,
                  inProgress,
                  overallPercent
              },
           
          };
      });
  
   
  
      return evaluatedAchievements;
  }
  
static async getSocialAchievements(nickName) {
    // resolve account by nickname
    const user = await db.query(`SELECT AccountID FROM users WHERE Nickname = ?`, [nickName])
    if (!user || user.length === 0) return []
    const accountId = user[0].AccountID || user[0].accountId
    const rows = await db.query(
        `SELECT * FROM player_achievements WHERE accountId = ?`,
        [accountId]
    )
    
    return rows.map(row => {
      
        return {
            achievementSlug: row.AchievementSlug,
            claimed: true
        }
    })
}
async getItemMetadata() {
    const raw = MemoryLoader.getAchievementsData()
    const allAchievements = Array.isArray(raw)
        ? raw
        : (raw && Array.isArray(raw.achievements))
            ? raw.achievements
            : []
    const allItems = await MemoryLoader.getAllItems()
    const byId = new Map((allItems || []).map(it => [it.itemId, it]))

    return (allAchievements || []).map(ach => ({
        ...ach,
        rewards: Array.isArray(ach.rewards) ? ach.rewards.map(r => ({
            ...r,
            meta: r && r.itemId ? byId.get(r.itemId) || null : null
        })) : []
    }))
}


 async claimAchievement(achievementSlug) {
  try {
 
    const normalizeKey = (k) => String(k).toLowerCase().replace(/[\s_]/g, "");
    
    // 3. Find achievement in file
    const evaluatedAchievements = MemoryLoader.getAchievementsData()
    const achievement = evaluatedAchievements.find(
      (ach) => normalizeKey(ach.achievementSlug) === normalizeKey(achievementSlug)
    );
    if (!achievement) {
      return { error: "Achievement not found" } 
    };
    

   // check if achievement is already claimed
   console.log('is claimed?')
   const existingRows = await db.query(
     `SELECT 1 FROM player_achievements WHERE AccountId = ? AND achievementSlug = ?`,
     [this.playerId, achievementSlug]
   );
   if (existingRows.length > 0) {
     return { success: false, message: "Achievement already claimed" };
   }
//. Send rewards via GiftBox
console.log('sending rewards via API...')
    // 8. Grant rewards
   const result = await GiftBox.sendReward(achievement.rewards.map(r => r.itemId),'Claim your Achievements rewards', 'AchieveSys',this.playerNickName,this.playerId);

   await db.query(
    `INSERT INTO player_achievements (accountId, achievementSlug)
    VALUES (?, ?)
   `,
    [this.playerId, achievementSlug]
  );

    
    // 10. Return response
    return {
      message: "Achievement claimed successfully",
      achievement: {
        name: achievement.name,
        rewards: achievement.rewards,
      },
    };
  } catch (error) {
    console.error("Error claiming achievement:", error);
    throw  error;
  }
}

static async getPlayerAchievementsDB () {
  const rows = await db.query(
    `SELECT * FROM player_achievements WHERE accountId = ?`,
    [this.playerId]
  );
  return rows;
}

}
module.exports = Achievements