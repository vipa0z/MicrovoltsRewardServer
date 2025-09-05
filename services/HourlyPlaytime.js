class HourlyPlaytimeReward {
    constructor(player) {
        this.player = player;
        this.REWARD_INTERVAL = Number(process.env.HOURLY_PLAYTIME_REWARD_INTERVAL) || 2; 
        this.currentTotal = this.player.total_play_time;
        this.lastChecked = this.player.last_checked_play_time ?? this.currentTotal;
    }

    async checkAndReward() {
        const delta = this.currentTotal - this.lastChecked;
    
        if (delta >= this.REWARD_INTERVAL) {
          const rewards = Math.floor(delta / this.REWARD_INTERVAL);
          await this.giveReward(rewards);
    
        //   Reset internal tracker (discard leftover time)
                 //   this could be modified to allow players to keep their progress past the last checked time.
                 //    but yeah thats how elmo did it (might change later)
          this.player.last_checked_play_time = this.currentTotal;
    
          // save the new lastChecked data 
          this.savePlayer();
        }
      }

      async giveReward(reward) {

        await giftBox.create({
            ii_id:reward,
            timestamp:Date.now(),
            accountId:this.player.AccountID,
            subject: "Hourly Playtime Reward",
            sender: process.env.PSERVER_NAME+"'s Reward System" ||"Microbolt's Reward System"
        });
        
      }

}
