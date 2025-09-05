const GiftBox = require('./GiftBox');
const db = require('../util/db');
const Player = require('./Player');
const MemoryLoader = require('../util/itemUtils/MemoryLoader');
const { logger } = require('../util/logger');

class SpinningWheel {
    constructor(playerId, playerNickName) {
        this.WHEEL_UNLOCK_PLAY_TIME = 160; // hours required per spin
        this.requiredPlaytimeInSeconds = this.WHEEL_UNLOCK_PLAY_TIME * 3600; // converts hours to seconds
       this.playerId = playerId
       this.playerNickName = playerNickName
    }

    // checks the players eligibility for a spin
    async checkEligibility() {
        const player = await Player.getPlayerById(this.playerId);
        // console.log("[DEBUG] Player row:", player);
        if (!player) {
            throw new Error(`Player not found for AccountID=${this.playerId}`);
        }
        

        // Calculate total eligible spins based on playtime, returns a canSpin boolean with either 0/1
        // playtime needed in seconds = 160 * 3600 = 576,000
        // if playtime / time needed = int -> reward with spin
        // 160/160 = 1, 320/160 = 2, 480/160 = 3...
        const totalEligibleSpins = Math.floor(player.playtime / this.requiredPlaytimeInSeconds);
        // Calculate available spins (eligible minus already claimed)
        const availableSpins = Math.max(0, totalEligibleSpins - player.wheelSpinsClaimed);

        let hoursUntilNextSpin = 0;
        if (availableSpins === 0) {
            // Player has claimed all available spins, calculate time until next threshold
            const nextThresholdPlaytime = this.requiredPlaytimeInSeconds * (player.wheelSpinsClaimed + 1);
            const playtimeNeeded = nextThresholdPlaytime - player.playtime;
            hoursUntilNextSpin = Math.max(0, Math.ceil(playtimeNeeded / 3600));
        }
        return {
            canSpin: availableSpins > 0,  // if 0, player can't spin if 1, player can spin :O
            remainingSpins: availableSpins,
            hoursUntilNextSpin: hoursUntilNextSpin,
            totalEligibleSpins: totalEligibleSpins,
            claimedSpins: Number(player.wheelSpinsClaimed)
        };
    }


    async consumeSpin(updatedClaimedWheelSpins) {
        try {
            const rows = await db.query(
                'UPDATE users SET WheelSpinsClaimed = ? WHERE AccountID = ? LIMIT 1',
                [updatedClaimedWheelSpins, this.playerId]
            );
            return rows;
        } catch (error) {
            logger.error(`Error consuming spin for player ${this.playerId}: ${error.message}`);
            throw error;
        }
    }

    drawWheel() {
        // Get wheel items from memory
        const items = MemoryLoader.getItems('wheel_items');
        if (!items || items.length === 0) {
            throw new Error("No wheel items configured");
        }

        // Select a random item from the wheel items
        const reward = items[Math.floor(Math.random() * items.length)];
        return reward;
    }


    async spin() {
        let eligibility = {}
        try {
            // if environment is development, give unlimited spins(for testing)
            if (process.env.ENVIRONMENT == 'development') {
              eligibility = {canSpin: true, remainingSpins: 5, hoursUntilNextSpin: 0, totalEligibleSpins: 1, claimedSpins: 0} // gives you unlimited spins(for testing)
            }
            else {
            //  console.log("[DEBUG] Checking eligibility for player",this.playerNickName," Environment: ", process.env.ENVIRONMENT)
             eligibility = await this.checkEligibility() 
            }
            if (!eligibility.canSpin) {
                return {
                    success: false,
                    error: `You need ${eligibility.hoursUntilNextSpin} more hours to claim a spin`,
                    hoursUntilNextSpin: eligibility.hoursUntilNextSpin,
                    remainingSpins: 0
                };
            }
            await this.consumeSpin(Number(eligibility.claimedSpins) + 1);
            
            const reward = this.drawWheel();
            const message = 'You won a reward from the Referal System!';
            const sender = 'ReferralSys';
            await GiftBox.sendReward(reward, this.playerId,this.playerNickName, message,sender)
            
            const updatedEligibility = await this.checkEligibility();

            return {
                success: true,
                itemName: reward.itemName,
                remainingSpins: updatedEligibility.remainingSpins
            };
        } catch (error) {
            console.log(error)
            logger.error(`Error during wheel spin for player ${this.playerNickName}: ${error.message}`);
            return {
                success: false,
                error: "An error occurred while processing your spin",
                remainingSpins: 0
            };
        }
    }
    
   

    }


module.exports = SpinningWheel;