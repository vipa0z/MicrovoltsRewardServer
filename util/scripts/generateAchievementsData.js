const fs = require("fs");

// =============================================
// CONFIGURATION DATA
// =============================================

// -----ADD UNIQUE ITEMS TO SPECIFIC LEVELS HERE-----
const specialItems = {
  50: [{ itemId: 4383140, itemName: "Green Wreath Crown (Remake)" }],
  60: [{ itemId: 4382950, itemName: "Silver Wreath Crown" }],
  70: [
    { itemId: 4382950, itemName: "Golden Wreath Crown" },
    { itemId: 5336562, itemName: "Coupon Box" },
  ],
  // 80: [{ itemId: 999, itemName: "Silver Death Scythe" }],
};


// Coin rewards (available coin items) // unused: keep as reference
const coinItems = [
  { itemId: 5336100, itemName: "Random Coupon BOX(P)" },
  { itemId: 4308101, itemName: "1 Coin" },
  { itemId: 4308108, itemName: "2 Coins" },
  { itemId: 4308109, itemName: "3 Coins" },
  { itemId: 4308102, itemName: "5 Coins" },
  { itemId: 4308103, itemName: "10 Coins" }
];

// Coupon rewards (available coupon items) // unused: keep as reference
const couponItems = [
  { itemId: 4305019, itemName: "1 Coupon" },
  { itemId: 4306008, itemName: "2 Coupons" },
  { itemId: 4306009, itemName: "3 Coupons" },
  { itemId: 5336100, itemName: "Random Coupon BOX(P)" },
];

// Battery item definition
const batteryItem = {
  itemId: 4305006,
  itemName: "1,000 Battery"
};

// Weapon categories for kill achievements
const weaponCategories = [
  { key: "RifleKills", name: "Sharpshooter" },
  { key: "ShotgunKills", name: "Spray & Pray" },
  { key: "SniperKills", name: "Eagle Eye" },
  { key: "BazookaKills", name: "Rocket Rider" },
  { key: "GrenadeKills", name: "Bomba" },
  { key: "GatlingKills", name: "Killing Spree" },
  { key: "Kills", name: "Total Slayer" }
];

// Kill thresholds for weapon achievements
const killThresholds = [100, 500, 1500, 3000, 5000, 9000, 15000, 30000, 50000, 100000, 200000, 500000];

// Coin/coupon items for weapon achievements
const coinCouponWeaponItems = [
  { itemId: 5336100, itemName: "Random Coupon BOX(P)" },
  { itemId: 4308102, itemName: "5 Coins" },
  { itemId: 4308103, itemName: "10 Coins" }
];

// Battery quantities for each kill threshold
const weaponBatteryQuantities = [
  1,  // 100 kills
  2,  // 500 kills
  4,  // 1500 kills
  5,  // 3000 kills
  6,  // 5000 kills
  7,  // 9000 kills
  8,  // 15000 kills
  9,  // 30000 kills
  10, // 50000 kills
  10, // 100000 kills
  10, // 200000 kills
  10  // 500000 kills
];

// Custom MP amounts for kill achievements (progressive)
const killMpAmounts = {
  100: 100,     // 100 kills = 100 MP
  500: 500,     // 500 kills = 500 MP  
  1500: 1000,   // 1500 kills = 1000 MP
  3000: 2000,   // 3000 kills = 2000 MP
  5000: 3000,   // 5000 kills = 3000 MP
  9000: 4000,   // 9000 kills = 4000 MP
  15000: 5000,  // 15000 kills = 5000 MP
  30000: 6000,  // 30000 kills = 6000 MP
  50000: 7000,  // 50000 kills = 7000 MP
  100000: 10000,   // 100000 kills = 10000 MP
  200000: 20000,   // 200000 kills = 20000 MP
  500000: 50000    // 500000 kills = 50000 MP
};


function run() {
  // =============================================
  // HELPER FUNCTIONS
  // =============================================
  // Battery quantity logic for levels
  function getLevelBattery(level) {
    if ([20, 30, 40, 50, 60, 70, 80, 90, 100].includes(level)) return 10;
    if (level >= 21 && level <= 29) return 5;
    if (level >= 31 && level <= 39) return 5;
    if (level >= 41 && level <= 49) return 5;
    if (level >= 51 && level <= 59) return 5;
    if (level >= 61 && level <= 69) return 5;
    if (level >= 71 && level <= 79) return 5;
    if (level >= 81 && level <= 89) return 5;
    if (level >= 91 && level <= 99) return 5;
    if (level >= 101 && level <= 104) return 7;
    return 5;
  }

  // Get coin rewards for specific level
  function getCoinRewardForLevel(level) {
    if (level >= 30 && level <= 44) {
      return [{ itemId: 4308108, itemName: "2 Coins" }];
    } else if (level >= 45 && level <= 100) {
      return [{ itemId: 4308109, itemName: "3 Coins" }];
    }
    return [];
  }

  // Get coupon rewards for specific level
  function getCouponRewardForLevel(level) {
    if (level >= 45 && level <= 49) {
      return [{ itemId: 4305019, itemName: "1 Coupon" }];
    } else if (level >= 51 && level <= 80) {
      return [{ itemId: 4306009, itemName: "3 Coupons" }];
    } else if (level >= 81 && level <= 89) {
      return [{ itemId: 5336100, itemName: "Random Coupon BOX(P)" }];
    }
    return [];
  }

  // Get battery quantity for weapon achievements based on kill threshold index
  function getWeaponBattery(index) {
    if (index >= 0 && index < weaponBatteryQuantities.length) {
      return weaponBatteryQuantities[index];
    }
    return 1; // Default fallback
  }

  // =============================================
  // LEVEL ACHIEVEMENTS GENERATION
  // =============================================

  const levels = Array.from({ length: 95 }, (_, i) => i + 10); // Levels 10-104
  // MP Items mapping (itemIds from json file)
  const mpItems = {
    100: 4600001,
    500: 4600005,
    1000: 4600010,
    2000: 4600020,
    3000: 4600030,
    3500: 4600035,
    4000: 4600040,
    5000: 4600050,
    6000: 4600060,
    7000: 4600070,
    8000: 4600080,
    9000: 4600090,
    10000: 4600100,
    20000: 4600200,
    30000: 4600300,
    50000: 4600500,
    100000: 4601000,
    150000: 4601500,
    500000: 4605000,
    1000000: 4610000
  };

  // MP mapping for each level (progressive rewards)
  function getLevelMpReward(level) {

    if (level >= 10 && level <= 14) {
      return 1000;
    }
    if (level >= 15 && level <= 19) {
      return 2000;
    }

    if (level >= 20 && level <= 29) {
      return 3000;
    }

    if (level >= 30 && level <= 39) {
      return 10000;
    }
    if (level >= 40 && level <= 49) {
      return 10000;
    }

    if (level === 50) {
      return 20000; // Milestone bonus for level 50
    }
    if (level >= 51 && level <= 59) {
      return 6000;
    }

    if (level === 60) {
      return 20000; // Milestone bonus for level 60
    }
    if (level >= 61 && level <= 69) {
      return 6000;
    }

    if (level === 70) {
      return 20000; // Milestone bonus for level 70
    }
    if (level >= 71 && level <= 79) {
      return 10000;
    }

    if (level === 80) {
      return 20000; // Milestone bonus for level 80
    }
    if (level >= 81 && level <= 89) {
      return 10000;
    }

    if (level === 90) {
      return 20000; // Milestone bonus for level 90
    }
    if (level >= 91 && level <= 99) {
      return 10000;
    }
    if (level === 100) {
      return 50000; // 50k
    }
    if (level >= 101 && level <= 104) {
      return 50000;
    }

    // Default fallback
    return 500;
  }

  const levelAchievements = levels.map(level => {
    const rewards = [];

    // 1. push LevelMpReward reward to rewards array
    const mpValue = getLevelMpReward(level);
    if (mpValue) {
      const mpItemId = mpItems[mpValue];
      if (mpItemId) {
        rewards.push({
          itemId: mpItemId,
          itemName: `${mpValue} MP`
        });
      } else {
        console.warn(`No mpItem found for level ${level} requesting ${mpValue} MP`);
      }
    }

    // 2. Add battery reward
    const batteryQty = getLevelBattery(level);
    if (batteryQty > 0) {
      rewards.push({ ...batteryItem, quantity: batteryQty });
    }

    // 3. Add coin rewards
    const coinRewards = getCoinRewardForLevel(level);
    coinRewards.forEach(coinReward => {
      rewards.push({ ...coinReward });
    });

    // 4. Add coupon rewards
    const couponRewards = getCouponRewardForLevel(level);
    couponRewards.forEach(couponReward => {
      rewards.push({ ...couponReward });
    });

    // 5. Add special items for specific levels
    if (specialItems[level]) {
      specialItems[level].forEach(item => {
        rewards.push({ ...item });
      });
    }

    return {
      name: `Level Up ${level}`,
      achievementSlug: `level-up-${level}`,
      description: `Reach level ${level}`,
      requirements: { level },
      rewards
    };
  });

  // =============================================
  // WEAPON ACHIEVEMENTS GENERATION
  // =============================================

  const weaponAchievements = [];

  weaponCategories.forEach(category => {
    killThresholds.forEach((threshold, index) => {
      const rewards = [];
      const displayNumber = Math.min(index + 1, 20); // Friendly name capped at 20

      // Generate names and descriptions
      const cleanedCategoryName = category.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const achievementSlug = `${cleanedCategoryName}-${displayNumber}`;
      const achievementName = `${category.name} - ${displayNumber}`;

      let achievementDescription;
      if (category.key === "Kills") {
        achievementDescription = `Achieve ${threshold} total kills.`;
      } else {
        const weaponTypeName = category.key.replace('Kills', '');
        achievementDescription = `Achieve ${threshold} kills with ${weaponTypeName}.`;
      }

      // 1. Add MP reward
      const mpValueForKill = killMpAmounts[threshold];
      const mpItemIdForKill = mpItems[mpValueForKill];
      if (mpItemIdForKill) {
        rewards.push({
          itemId: mpItemIdForKill,
          itemName: `${mpValueForKill} MP`
        });
      } else {
        console.warn(`No mpItem defined for ${mpValueForKill} MP (for ${threshold} kills). Check mpItems object.`);
      }

      // 2. Add battery reward
      rewards.push({
        ...batteryItem,
        quantity: getWeaponBattery(index)
      });

      // 3. Add coin/coupon rewards for high kill counts
      if (threshold >= 100000) {
        coinCouponWeaponItems.forEach(item => {
          rewards.push({ ...item });
        });
      }

      weaponAchievements.push({
        name: achievementName,
        achievementSlug: achievementSlug,
        description: achievementDescription,
        requirements: { [category.key]: threshold },
        rewards
      });
    });
  });

  // =============================================
  // FILE GENERATION
  // =============================================

  // Combine all achievements
  const allAchievements = [...levelAchievements, ...weaponAchievements];

  // Write to file
  fs.writeFileSync("data/configs/achievements_data.json", JSON.stringify({ achievements: allAchievements }, null, 2));
  console.log(`✅ Generated ${allAchievements.length} achievements successfully!`);
  console.log(`   - Level achievements: ${levelAchievements.length}`);
  console.log(`   - Weapon achievements: ${weaponAchievements.length}`);
  process.exit(0);
}
module.exports = { run }