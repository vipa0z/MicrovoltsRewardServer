const fs = require("fs");

// -----------------------------
// 1️⃣ Level Achievements Setup
// -----------------------------
const levels = Array.from({ length: 95 }, (_, i) => i + 10);

// ✅ Real MP items (from your item dump)
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

// Battery quantity logic
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
  80: [{ itemId: 9999000, itemName: "Silver Death Scythe" }],

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

// -----------------------------
// 2️⃣ (Keep your Weapon achievements as is for now)
// -----------------------------

fs.writeFileSync("configs/achievements_data.json", JSON.stringify({ achievements: levelAchievements }, null, 2));
console.log("✅ achievements.json generated successfully (with real itemIds)!");
