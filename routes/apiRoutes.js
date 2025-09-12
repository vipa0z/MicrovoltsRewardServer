const express = require('express');
const router = express.Router();
const configController = require("../controllers/configController")
const wheelController = require('../controllers/wheelController');
const shopController = require('../controllers/eventShopController');
const authController = require("../controllers/authController")
const dailyPlaytimeController = require('../controllers/dailyPlaytimeController');
const { authUser, authAdmin } = require('../middlewares/auth');
const achievements = require('../controllers/achievementsController');

const registerAdminRoutes = () => {
    //auth    
    router.post('/register-staff', authAdmin, authController.registerStaffMember)

    // config 
    router.post('/config/wheel', authAdmin, configController.configureItems('wheel_items_data'));
    router.post('/config/shop', authAdmin, configController.configureItems('shop_items_data'));
    router.post('/config/achievements', authAdmin, configController.configureItems('achievements_data'));
    router.post('/config/daily-chest', authAdmin, configController.configureItems('playtime_draw_data')); 
}


const registerUserRoutes = () => {
    router.post('/register', authController.register)
    router.post('/login', authController.login)

    // wheel
    router.get('/wheel/items', authUser, wheelController.getWheelItems);
    router.post('/wheel/draw', authUser, wheelController.drawWheel);

    // shop
    router.get('/shop/items', authUser, shopController.getEventShop);
    router.post('/shop/buy', authUser, shopController.purchaseEventItem);

    //achievements
    router.get('/self/achievements', authUser, achievements.getSelfAchievements); // achievements for current user (includes progress/data not shown to other players)
    router.post('/achievements/claim', authUser, achievements.claimAchievement);
    // view other player achievements
    router.get('/:nickname/achievements', authUser, achievements.getSocialAchievements); // claimed only
    


    //daily chest
    router.get('/daily-chest/progress', authUser, dailyPlaytimeController.getDailyPlaytimeProgress);
    router.post('/daily-chest/draw', authUser, dailyPlaytimeController.drawDailyPlaytimeReward);

}







module.exports = { registerAdminRoutes, registerUserRoutes, router };