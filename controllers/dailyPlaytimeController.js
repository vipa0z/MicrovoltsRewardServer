
const { logger } = require("../util/logger");
const DailyPlayTimeService = require('../services/DailyPlayTimeService');
exports.getDailyPlaytimeProgress = async (req, res) => {
  try {
    const playerId = req.user.id;
    const playernickname = req.user.nickname;
    const dailyPlayTimeService = new DailyPlayTimeService(playerId, playernickname)
    const progressData = await dailyPlayTimeService.getProgression();

    res.status(200).json({ success: true, data: progressData });

  } catch (err) {
    logger.error("Failed to fetch playtime draw progress", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.drawDailyPlaytimeReward = async (req, res) => {
  console.log('hit')
  try {
    const playerId = req.user.id;
    const playernickname = req.user.nickname;
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const dailyPlayTimeService = new DailyPlayTimeService(playerId, playernickname);
    const playerDrawAttempt = await dailyPlayTimeService.draw();
    const {canDraw, progress, progressPercentage, droppedItem} = playerDrawAttempt;
    
    if (canDraw) {

      try { 
        console.log(droppedItem)
        const itemClaimed = await dailyPlayTimeService.claimReward(droppedItem);
        console.log(itemClaimed)
        if (itemClaimed.success) {
          // 3. reset counter
          await dailyPlayTimeService.resetCounter();

          res.status(200).json({ success: true, data: {
            success: true,
            message: "Congratulations you won " + droppedItem.droppedItemName,
            progress: progress,
            progressPercentage: progressPercentage
          }});
        }
      
      } catch (err) {
        logger.error("Error during playtime draw claim", err);
        res.status(400).json({ success: false, error: "Server error" });
      }
    } 
   else { 
    return res.status(200).json({ 
        success: false,
        message: "Not enough playtime to draw a reward",
        data: {
            canDraw: false,
            progress: progress,
            progressPercentage: progressPercentage
        }
    });
}
    
  } catch (err) {
    logger.error("Error during playtime draw claim", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
