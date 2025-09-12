const db   = require('../database/connection')
const axios = require("axios")
const { getEmuToken } = require('../util/getEmuJwt');

class GiftBox {
    constructor(nickname, playerId) {

        this.nickname = nickname
        this.playerId =playerId
        this.timestamp = Math.floor(Date.now() / 1000);
        this.emuJWT = process.env.EMU_JWT_SECRET;
        this.emuApiUrl = process.env.EMU_API_URL;
    }

     static async sendReward(reward, playerId, nickname, message, sender) {
      //reward = array of itemId
      const giftBox = new GiftBox(nickname, playerId);
      try {
        if (reward.length > 1) {
          const result = await giftBox.sendMultipleRewardsToPlayerGiftBoxApi(
              reward,
              nickname,
              message,
              sender,
          );
          if (result.some(r => !r.success)) {
            logger.warn('Failed to send rewards via API, Is the emu running? Inserting directly to DB...')
           return await giftBox.sendMultipleRewardsToPlayerGiftBox(reward, message, sender);          
        }
        return result;
      
          } 
          
        }
          catch (error) {
        console.error(error);
        return { error: 'Failed to send reward to player gift box' };
      }
    }


// directly save to DB
 async sendRewardToPlayerGiftBox(itemId, message, sender) {
    try {
    
    const result = await db.query(
      `INSERT INTO GiftBox (itemId, timestamp, accountId, message, sender) VALUES (?, ?, ?, ?, ?)`,
      [itemId, this.timestamp, this.playerId, message, sender]
    );
    
    return result
}
    
 catch (error) {
    console.error(error);
    return { error: 'Failed to send reward to player gift box' };
  }
}

  async sendMultipleRewardsToPlayerGiftBox(reward, message, sender) {
    console.log(reward)
if (!Array.isArray(reward)) {
    reward = [reward];
}
for (const itemId of reward) {
    try {
    const result = 
    await db.query(
      `INSERT INTO GiftBox (itemId, timestamp, accountId, message, sender) VALUES (?, ?, ?, ?, ?)`,
      [itemId, this.timestamp, this.playerId, message, sender]
    );
    
    return result
} catch (error) {
    console.error(error);
    return { error: 'Failed to send reward to player gift box' };
}
}
    
  }
// sending via  EMU API 
 async sendRewardToPlayerGiftBoxApi(itemId, message, sender) { 

  // convert single itemIds into array
  if (!Array.isArray(itemId)) {
    itemId = [itemId];
  }
  try {
    const token = getEmuToken();
    const response = await axios.post(
      `${process.env.EMU_API_URL}/sendreward`,
      {
        nickname: this.nickname,
        ItemID: String(itemId),
        Message: message,
        Sender: sender
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    return { 
      error: 'Failed to send reward to player gift box via API',
      details: error.response?.data || error.message 
    };
  }
}
 async  sendSingleRewardToPlayerGiftBoxApi(itemId, message, sender, nickname) {
  try {
    // ✅ Get cached/new token
    const token = getEmuToken();

    const response = await axios.post(
      `${process.env.EMU_API_URL}/sendreward`,
      {
        nickname: nickname,
        ItemID: String(itemId),
        Message: message,
        Sender: sender
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error sending reward to player gift box via API:', error);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

  delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

 async  sendMultipleRewardsToPlayerGiftBoxApi(itemIds, message, nickname) {
  const token = getEmuToken();
  const results = [];

  if (!Array.isArray(itemIds)) {
    //transform to array
    itemIds = [itemIds];
  }
  for (const itemId of itemIds) {

    try {
      const res = await axios.post(
        `${process.env.EMU_API_URL}/sendreward`,
        {
          nickname: String(nickname),
          ItemID: String(itemId),
          Message: String(message)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      results.push({ itemId, success: true, data: res.data });

    } catch (err) {
      console.error(`❌ Failed to send item ${itemId}`, err.response?.data || err.message);
      results.push({ itemId, success: false, error: err });
    }

    await this.delay(300); // <-- 300ms pause between requests
  }

  return results;
}
}

module.exports = GiftBox