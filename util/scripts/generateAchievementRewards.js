const fs = require("fs");

// -----------------------------
// 1️⃣ Level Achievements Setup
// -----------------------------
const levels = Array.from({ length: 95 }, (_, i) => i + 10);

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

// ✅ Correct battery
const batteryItem = {
  itemId: 4305006,
  itemName: "1,000 Battery"
};

// MP per level
const mpMap = {};
levels.forEach(level => {
  mpMap[level] = level * 1000; // e.g. Lvl 10 = 10,000 MP
});

// Battery quantity logic for levels
function getLevelBattery(level) {
  if ([20, 30, 40, 50, 60, 70, 80, 90, 100].includes(level)) return 10;
  if (level >= 10 && level <= 19) return 5;
  if (level >= 21 && level <= 29) return 5;
  if (level >= 31 && level <= 39) return 7;
  if (level >= 41 && level <= 49) return 7;
  if (level >= 51 && level <= 59) return 5;
  if (level >= 61 && level <= 69) return 7;
  if (level >= 71 && level <= 79) return 5;
  if (level >= 81 && level <= 89) return 7;
  if (level >= 91 && level <= 99) return 5;
  if (level >= 101 && level <= 104) return 7;
  return 5;
}

// Special items
const specialItems = {
  50: [{ itemId: 4383140, itemName: "Green Wreath Crown (Remake)" }],
  60: [{ itemId: 4382950, itemName: "Silver Wreath Crown" }],
  70: [
    { itemId: 4382950, itemName: "Golden Wreath Crown" },
    { itemId: 5336562, itemName: "Coupon Box" },
    { itemId: 4308103, itemName: "10 Coins" }],
  // 80: [{ itemId: 9999000, itemName: "Silver Death Scythe" }],

};

// Coin + coupon ranges
const coinCouponLevels = [
  { start: 51, end: 59 },
  { start: 61, end: 69 },
  { start: 71, end: 79 },
  { start: 81, end: 89 }
];

const coinCouponItems = [
  { itemId: 5336100, itemName: "Random Coupon BOX(P)" },
  { itemId: 4308102, itemName: "5 Coins" },
  { itemId: 4308103, itemName: "10 Coins" }
];

// Generate level achievements
const levelAchievements = levels.map(level => {
  const rewards = [];

  // ✅ MP (lookup real itemId)
  const mpValue = mpMap[level];
  const mpItemId = mpItems[mpValue];
  if (mpItemId) {
    rewards.push({
      itemId: mpItemId,
      itemName: `${mpValue} MP`,
      quantity: 1
    });
  }

  // ✅ Battery
  const batteryQty = getLevelBattery(level);
  if (batteryQty > 0) {
    rewards.push({ ...batteryItem, quantity: batteryQty });
  }

  // ✅ Special items
  if (specialItems[level]) {
    specialItems[level].forEach(item => rewards.push({ ...item, quantity: 1 }));
  }

  // ✅ Coin + coupons
  coinCouponLevels.forEach(range => {
    if (level >= range.start && level <= range.end) {
      coinCouponItems.forEach(item => rewards.push({ ...item, quantity: 1 }));
    }
  });

  return {
    name: `Level Up ${level}`,
    achievementSlug: `level-up-${level}`,
    description: `Reach level ${level}`,
    requirements: { level },
    rewards
  };
});

const weaponCategories = [
  { key: "RifleKills", name: "Sharpshooter" },
  { key: "ShotgunKills", name: "Spray & Pray" },
  { key: "SniperKills", name: "Eagle Eye" },
  { key: "BazookaKills", name: "Rocket Rider" },
  { key: "GrenadeKills", name: "Bomba" },
  { key: "GatlingKills", name: "Killing Spree" },
  { key: "Kills", name: "Total Slayer" } // This is the 'Total Slayer' category
];

const killThresholds = [100, 500, 1500, 3000, 5000, 9000, 15000, 30000, 50000, 100000, 200000, 500000];
const coinCouponWeaponItems = [{ itemId: 5336100, itemName: "Random Coupon BOX(P)" }, { itemId: 4308102, itemName: "5 Coins" }, { itemId: 4308103, itemName: "10 Coins" }];
// const specialWeapon = { itemId: 9999001, itemName: "PLACEHOLDER REWARD WEAPON" };

// Define battery quantities for each kill threshold index
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

// Function to get battery quantity based on the kill threshold's index
function getWeaponBattery(index) {
  // Ensure the index is within the bounds of the array
  if (index >= 0 && index < weaponBatteryQuantities.length) {
    return weaponBatteryQuantities[index];
  }
  return 1; // Default to 1 battery if index is out of bounds
}

// Custom MP amounts for kill achievements
const killMpAmounts = {
  100: 100,    // 100 kills = 100 MP
  500: 1000,   // 500 kills = 1000 MP
  1000: 2000,  // 1000 kills = 2000 MP (adjusted from 1500 MP to use an existing mpItem key)
  1500: 3000,
  3000: 4000,
  5000: 5000,
  9000: 10000,
  15000: 20000,
  30000: 30000,
  50000: 50000,
  100000: 100000,
  200000: 150000,
  500000: 500000
};

const weaponAchievements = [];
weaponCategories.forEach(category => {
  killThresholds.forEach((threshold, index) => {
    const rewards = [];
    const displayNumber = Math.min(index + 1, 20); // Friendly name capped at 20

    let achievementName;
    let achievementSlug;
    let achievementDescription;

    // Standardized slug generation for all weapon categories
    const cleanedCategoryName = category.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    achievementSlug = `${cleanedCategoryName}-${displayNumber}`;

    // Determine name and description based on category
    if (category.key === "Kills") { // This is the "Total Slayer" category
      achievementName = `${category.name} - ${displayNumber}`;
      achievementDescription = `Achieve ${threshold} kills.`;
    } else { // For specific weapon categories
      const weaponTypeName = category.key.replace('Kills', ''); // Remove 'Kills' suffix
      achievementName = `${category.name} - ${displayNumber}`;
      achievementDescription = `Achieve ${threshold} kills with ${weaponTypeName}.`;
    }

    // ✅ MP reward based on new 'killMpAmounts'
    const mpValueForKill = killMpAmounts[threshold];
    const mpItemIdForKill = mpItems[mpValueForKill]; // Look up the itemId from the global mpItems map
    if (mpItemIdForKill) {
      rewards.push({
        itemId: mpItemIdForKill,
        itemName: `${mpValueForKill} MP`,
        quantity: 1
      });
    } else {
      console.warn(`No mpItem defined for ${mpValueForKill} MP (for ${threshold} kills). Check mpItems object.`);
    }

    // ✅ Battery reward (using the new progressive logic)
    rewards.push({ ...batteryItem, quantity: getWeaponBattery(index) });

    // Placeholder logic for other weapon rewards (as not fully specified in original snippet)
    if (threshold >= 100000) { // Example: award coin coupons for high kill counts
      coinCouponWeaponItems.forEach(item => rewards.push({ ...item, quantity: 1 }));
    }
    // if (threshold === 500000) { // Example: award special weapon for highest tier
    //   rewards.push({ ...specialWeapon, quantity: 1 });
    // }

    weaponAchievements.push({
      name: achievementName,
      achievementSlug: achievementSlug,
      description: achievementDescription, // Use the dynamically created description
      requirements: { [category.key]: threshold },
      rewards
    });
  });
});

// Combine all achievements before writing to file
const allAchievements = [...levelAchievements, ...weaponAchievements];

// Corrected file path for writing achievements_data.json
fs.writeFileSync("data/configs/achievements_data.json", JSON.stringify({ achievements: allAchievements }, null, 2));
console.log("✅ achievements.json generated successfully!");