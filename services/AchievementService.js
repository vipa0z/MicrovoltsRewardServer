const db = require("../database/connection")
const MemoryLoader = require("../util/MemoryLoader")
const Player = require("../database/Player")
const GiftBox = require("./GiftBoxService")

class Achievements {
  constructor(playerId, playernickname) {
    this.playerId = playerId
    this.playernickname = playernickname
  }

  // Add this function at the top of your AchievementService.js file
 normalizeKey(key) {
  if (!key || typeof key !== 'string') return '';
  
  return key
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ''); // Remove any remaining spaces
}

// Your existing getAchievements method
async getAchievements() {
  const playerStats = await Player.findUserById(this.playerId);
  const rawTemplates = MemoryLoader.getAchievementsData();
  const achievementTemplates = Array.isArray(rawTemplates)
    ? rawTemplates
    : rawTemplates?.achievements || [];

  // Build stat map (normalize keys so they match requirements)
  const statMap = {};
  for (const [statKey, statValue] of Object.entries(playerStats || {})) {
    statMap[this.normalizeKey(statKey)] = Number(statValue) || 0;
  }

  // Evaluate each achievement
  const evaluatedAchievements = achievementTemplates.map((template) => {
    const slug = this.normalizeKey(template.achievementSlug);
    
    // Requirements (numbers only)
    const requirements = Object.entries(template.requirements || {}).filter(
      ([, value]) => typeof value === "number"
    );
    
    // Progress for each requirement
    const progressDetails = requirements.map(([key, target]) => {
      const current = statMap[this.normalizeKey(key)] || 0;
      const percent = target > 0 ? Math.min(100, Math.floor((current / target) * 100)) : 0;
      return { key, current, target, percent };
    });
    
    // Aggregate status
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
        claimed: false,  // not tracked in DB
        unlocked,
        inProgress,
        overallPercent,
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
      // 1. Load player achievements (from DB)
      const playerAchievements = await Player.getPlayerAchievements(this.playerId);
  
      // 2. Check if already claimed
      if (playerAchievements.some(r => r.AchievementSlug === achievementSlug)) {
        return { success: false, message: "Achievement already claimed" };
      }
      // 3. Load achievement definition from JSON
      const allAchievements = MemoryLoader.getAchievementsData();
      const achievement = allAchievements.find(
        (ach) => ach.achievementSlug === achievementSlug
      );
  
      if (!achievement) {
        return { error: "Achievement not found" };
      }
  
      // 4. Verify requirements
      const player = await Player.getPlayerById(this.playerId);
      const unmetRequirements = Object.entries(achievement.requirements || {})
        .filter(([key, target]) => {
          const current = Number(player[key]) || 0;
          return current < target;
        });
  
      if (unmetRequirements.length > 0) {
        const messages = unmetRequirements.map(
          ([key, target]) => `${key} ${player[key] ?? 0}/${target}`
        );
        return { success: false, message: "Requirements not met: " + messages.join(", ") };
      }
  
      // 5. Grant rewards
      const rewardItemIds = achievement.rewards.map(r => r.itemId);
      await GiftBox.sendReward(
        rewardItemIds,
        this.playerId,
        this.playernickname,
        "Claim your Achievements rewards",
        "AchieveSys"
      );
  
      // 6. Mark achievement as claimed in DB
      await Player.updatePlayerAchievements(achievementSlug, this.playerId);
  
      return {
        success: true,
        message: "Achievement claimed successfully",
        achievement: {
          name: achievement.name,
          rewards: achievement.rewards,
        },
      };
    } catch (error) {
      console.error("Error claiming achievement:", error);
      throw error;
    }
  }
  
  


}
module.exports = Achievements