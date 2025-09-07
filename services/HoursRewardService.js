class HourlyPlaytimeReward {
    constructor(playerId) {
      this.playerId = playerId
    }

    async checkEligibility() {
        const player = await Player.getPlayerById(this.playerId);
        if (!player) {
            throw new Error(`Player not found for AccountID=${this.playerId}`);
        }
        if (player.TwoHoursCounter < 7200) {
            return {
                canClaim: false,
                remainingHours: 7200 - player.TwoHoursCounter
            };
        }
        return {
            canClaim: true,
            remainingHours: 0
        };
    }


    getRandomReward() {
      for (const item of rewards.hours_reward_data) {
          if (Math.random() < item.dropRate) {
              return item;
          }
      }
      return null; // no drop this time
  }


  async draw () {
  const dropped = this.getRandomReward();
  if (dropped) {
    console.log('Dropped item:', dropped.itemName);
    return dropped;
  }
  else console.log('No drop this time');
  } 
  
  
  
  async claimReward() {


        await giftBox.create({
            ii_id:reward,
            timestamp:Date.now(),
            accountId:this.player.AccountID,
            subject: "Hourly Playtime Reward",
            sender: process.env.PSERVER_NAME+"'s Reward System" ||"Microbolt's Reward System"
        });
        
      }

}
