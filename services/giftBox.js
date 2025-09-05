const db   = require('../util/db')
const axios = require("axios")
const { getEmuToken } = require('../util/getEmuJwt');

class GiftBox {
    constructor(Nickname, playerId) {

        this.playerNickname = Nickname
        this.playerId =playerId
        this.timestamp = Math.floor(Date.now() / 1000);
        this.emuJWT = process.env.EMU_JWT_SECRET;
        this.emuApiUrl = process.env.EMU_API_URL;
    }

     static async sendReward(reward,playerId, playerNickname, message,sender) {
      const giftBox = new GiftBox(playerNickname, playerId);
      try {
          const result = await giftBox.sendMultipleRewardsToPlayerGiftBoxApi(
              reward.itemId,
              playerNickname,
              sender,
              message,

          );
          if (result.some(r => !r.success)) {
            console.log('failed to send rewards via API, Inserting directly to DB...')
            await giftBox.sendMultipleRewardsToPlayerGiftBox(reward.itemId, message, sender);          }
      } catch (error) {
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

  async sendMultipleRewardsToPlayerGiftBox(itemIds, message, sender) {
if (!Array.isArray(itemIds)) {
    itemIds = [itemIds];
}
    try {
  const values = itemIds.map(itemId => [itemId, this.timestamp, this.playerId, message, sender]);
    const placeholders = values.map(() => '(?, ?, ?, ?, ?)').join(', ');
  const sql = `
      INSERT INTO giftBox (itemId, timestamp, accountId, message, sender)
      VALUES ${placeholders}
  `;
  const result = await db.query(sql, values.flat());
    return result;

  } catch (err) {
      console.error("Failed to insert multiple gift box rewards:", err);
      return { error: 'Insert failed' };
  }
}
// using emu's /sendreward 
 async sendRewardToPlayerGiftBoxApi(itemId, message, sender) { 
  if (!Array.isArray(itemId)) {
    //transform to array
    itemId = [itemId];
  }
  try {
    const token = getEmuToken();
    const response = await axios.post(
      `${process.env.EMU_API_URL}/sendreward`,
      {
        Nickname: this.playerNickname,
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
    // console.error('Error sending reward to player gift box via API:', error);
    return { 
      error: 'Failed to send reward to player gift box via API',
      details: error.response?.data || error.message 
    };
  }
}
 async  sendSingleRewardToPlayerGiftBoxApi(itemId, message, sender, playerNickname) {
  try {
    // ✅ Get cached/new token
    const token = getEmuToken();

    const response = await axios.post(
      `${process.env.EMU_API_URL}/sendreward`,
      {
        Nickname: playerNickname,
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

 async  sendMultipleRewardsToPlayerGiftBoxApi(itemIds, message, playerNickname) {
  const token = getEmuToken();
  const results = [];

  console.log("Processing reward batch");
  if (!Array.isArray(itemIds)) {
    //transform to array
    itemIds = [itemIds];
  }
  for (const itemId of itemIds) {

    try {
      const res = await axios.post(
        `${process.env.EMU_API_URL}/sendreward`,
        {
          Nickname: String(playerNickname),
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