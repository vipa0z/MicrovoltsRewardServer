const db = require("../database/connection")
const MemoryLoader = require("../util/MemoryLoader")
const Player = require("../database/Player")
const GiftBox = require("./GiftBoxService")

class Achievements {
    constructor(playerId, playernickname) {
        this.playerId = playerId
        this.playernickname = playernickname
    }

    async getAchievements() {
      const player = await Player.getPlayerById(this.playerId);
      if (!player) throw new Error("Player not found");
  
      const playerAchievementRows = await this.getPlayerAchievements()
  
      // Build lookup for claimed/unlocked achievements
      const playerAchievementMap = new Map();
      for (const record of playerAchievementRows || []) {
          const key = String(record.achievementSlug || "").toLowerCase();
          playerAchievementMap.set(key, { claimed: record.claimed === 1, unlocked: record.unlocked === 1 });
      }
  
      // Load achievement templates (from memory JSON)
      const rawTemplates = MemoryLoader.getAchievementsData();
      const achievementTemplates = Array.isArray(rawTemplates)
          ? rawTemplates
          : rawTemplates && Array.isArray(rawTemplates.achievements)
              ? rawTemplates.achievements
              : [];
  
      const statMap = {};
      for (const [statKey, statValue] of Object.entries(player)) {
          statMap[statKey] = Number(statValue) || 0;
      }
  

      // Evaluate each achievement
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
  
static async getSocialAchievements(nickname) {
    const user = await db.query(`SELECT AccountID FROM users WHERE nickname = ?`, [nickname])
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
    const evaluatedAchievements = MemoryLoader.getAchievementsData()
    const achievement = evaluatedAchievements.find(
      (ach) => ach.achievementSlug === achievementSlug
    );
    if (!achievement) {
      return { error: "Achievement not found" } 
    };

   const existingRows = await db.query(
     `SELECT 1 FROM player_achievements WHERE AccountId = ? AND achievementSlug = ?`,
     [this.playerId, achievementSlug]
   );
   if (existingRows.length > 0) {
     return { success: false, message: "Achievement already claimed" };
   }

   const result = await GiftBox.sendReward(achievement.rewards.map(r => r.itemId),'Claim your Achievements rewards', 'AchieveSys',this.playernickname,this.playerId);

   await db.query(
    `INSERT INTO player_achievements (accountId, achievementSlug)
    VALUES (?, ?)
   `,
    [this.playerId, achievementSlug]
  );

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

 async getPlayerAchievements () {
  const rows = await db.query(
    `SELECT * FROM player_achievements WHERE accountId = ?`,
    [this.playerId]
  );
  return rows;
}

}
module.exports = Achievements