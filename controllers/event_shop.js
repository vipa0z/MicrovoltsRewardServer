const ShopService = require('../services/ShopService');
const logger = require('../util/logger');

exports.getEventShop = async (req, res) => { 
    const playerId = req.user.playerId;
    if (!playerId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {

        // Get shop items from memory
        const shopItems = ShopService.shopItems.map(item => ({
            itemId: item.ii_id,
            name: item.ii_name,
            iconId: item.ii_icon_id,
            price: item.price,
        }));

        res.status(200).json({
            success: true,
            message: "Shop items loaded successfully",
            data: shopItems
        });
             
    } catch (error) {
        logger.error(`Error getting shop items: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

exports.postEventShop = async (req, res) => {
    const playerId = req.user.playerId;
    const itemId = req.body.itemId;
// add support for multiple items (buying sets)
    
    if (!playerId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!itemId) {
        return res.status(400).json({ error: 'Item ID is required' });
    }
    
    try {
        const shop = new ShopService(playerId);
        const result = await shop.buyItem(itemId);
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
