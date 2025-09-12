const GiftBox = require('./GiftBoxService');
const db = require('../database/connection');
const Player = require('../database/Player');
const MemoryLoader = require('../util/MemoryLoader');
const { logger } = require('../util/logger');

class SpinningWheel {
    constructor(playerId, playernickname) {
        this.playerId = playerId
        this.playernickname = playernickname
        this.WHEEL_DRAW_TRIGGER = process.env.WHEEL_DRAW_TRIGGER
        this.requiredPlaytimeInSeconds = this.WHEEL_DRAW_TRIGGER * 3600; // converts hours to seconds
        this.itemPool = MemoryLoader.getItems('wheel_items_data')
    }

    async checkEligibility() {
        const player = await Player.getWheelData(this.playerId)
        if (!player) {
            throw new Error(`Player not found for AccountID=${this.playerId}`);
        }


        // Calculate total eligible spins based on playtime, returns a canSpin boolean with either 0/1

        // playtime needed in seconds = 160 * 3600 = 576,000
        // if playtime / time needed = int -> reward with spin
        // 160/160 = 1, 320/160 = 2, 480/160 = 3...
        const totalEligibleSpins = Math.floor(player.playtime / this.requiredPlaytimeInSeconds);
        const availableSpins = Math.max(0, totalEligibleSpins - player.wheelSpinsClaimed);

        let hoursUntilNextSpin = 0;
        if (availableSpins === 0) {
            // calculate time until next threshold
            const nextThresholdPlaytime = this.requiredPlaytimeInSeconds * (player.wheelSpinsClaimed + 1);
            const playtimeNeeded = nextThresholdPlaytime - player.playtime;
            hoursUntilNextSpin = Math.max(0, Math.ceil(playtimeNeeded / 3600));
        }
        return {
            canSpin: availableSpins > 0,
            remainingSpins: availableSpins,
            hoursUntilNextSpin: hoursUntilNextSpin,
            totalEligibleSpins: totalEligibleSpins,
            claimedSpins: Number(player.wheelSpinsClaimed)
        };
    }


    async consumeSpin(updatedClaimedWheelSpins) {
        try {
            await Player.updateSpinsClaimed(this.playerId, updatedClaimedWheelSpins);
        } catch (error) {
            logger.error(`Error consuming spin for player ${this.playerId}: ${error.message}`);
            throw error;
        }
    }

    drawWheel() { 
        const itemPool = this.itemPool
        if (!itemPool || itemPool.length === 0) {
            throw new Error("No wheel itemPool configured");
        }
        // randomizer
        const reward = itemPool[Math.floor(Math.random() * itemPool.length)];
        return reward;
    }


    async spin() {
        let eligibility = {}
        try {
            // if environment is development, give unlimited spins
            if (process.env.ENVIRONMENT == 'development') {
                eligibility = { canSpin: true, remainingSpins: 5, hoursUntilNextSpin: 0, totalEligibleSpins: 1, claimedSpins: 0 } // gives you unlimited spins(for testing)
            }
            else {
                //  console.log("[DEBUG] Checking eligibility for player",this.playernickname," Environment: ", process.env.ENVIRONMENT)
                eligibility = await this.checkEligibility()
            }
            if (!eligibility.canSpin) {
                return {
                    error: `You need ${eligibility.hoursUntilNextSpin} more hours to claim a spin`,
                    hoursUntilNextSpin: eligibility.hoursUntilNextSpin,
                    remainingSpins: 0
                };
            }
            await this.consumeSpin(Number(eligibility.claimedSpins) + 1);

            const reward = this.drawWheel();
            const message = 'You won a reward from the Referal System!';
            const sender = 'ReferralSys';
            await GiftBox.sendReward(reward, this.playerId, this.playernickname, message, sender)

            const updatedEligibility = await this.checkEligibility();

            return {
                success: true,
                itemName: reward.itemName,
                remainingSpins: updatedEligibility.remainingSpins
            };
        } catch (error) {
            console.log(error)
            logger.error(`Error during wheel spin for player ${this.playernickname}: ${error.message}`);
            return {
                success: false,
                error: "An error occurred while processing your spin",
                remainingSpins: 0
            };
        }
    }

}

module.exports = SpinningWheel;