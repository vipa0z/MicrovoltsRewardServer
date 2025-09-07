const EventShop  = require('../services/EventShopService');
const {logger} = require('../util/logger');

exports.getEventShop = async (req, res) => { 
    const playerId = req.user.id;
    if (!playerId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const shop = new EventShop(playerId);
        const shopItems = await shop.getShopItems();
        res.status(200).json({
            success: true,
            message: "Shop items loaded successfully",
            data: shopItems
        });
             
    } catch (error) {
        console.log(`Error getting shop items: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

exports.purchaseEventItem = async (req, res) => {
    const playerId = req.user.id;
    const itemName = req.body.itemName;
    const playerNickname = req.user.nickname;
    
    if (!playerId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!itemName) {
        return res.status(400).json({ error: 'Item Name is required' });
    }
    
    try {
        const shop = new EventShop(playerId,playerNickname);
        const result = await shop.buyItem(itemName);
        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                item: result.item,
                currencyAmount: result.currencyAmount
                }
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                error: result.error 
            });
        }
    } catch (error) {
        logger.error(`Error buying item: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
