const express = require('express');
const router = express.Router();
const configController = require("../controllers/configController")
const wheelController = require('../controllers/referal_wheel');
const shopController = require('../controllers/event_shop');
const authController = require("../controllers/authController")
const { authUser, authAdmin } = require('../middlewares/auth');
const achievements = require('../controllers/achievements');
// auth routes
router.post('/register', authController.register)
router.post('/register-staff', authAdmin, authController.registerStaffMember)
router.post('/login', authController.login)

// config 
router.post('/config/wheel', authAdmin, configController.configureItems('wheel_items'));
router.post('/config/shop', authAdmin, configController.configureItems('shop_items'));
router.post('/config/hourly', authAdmin, configController.configureItems('hourly_items'));
router.post('/config/achievements', authAdmin, configController.configureItems('achievements_data'));

// wheel
router.get('/wheel/items', authUser, wheelController.getWheelItems);
router.post('/wheel/draw', authUser, wheelController.drawWheel);

// shop
router.get('/shop/items', authUser, shopController.getEventShop);
router.post('/shop/buy', authUser, shopController.purchaseEventItem);

//achievements
 
router.get('/self/achievements', authUser, achievements.getSelfAchievements); // achievements for current user (includes progress/data not shown to other players)
router.get('/:nickname/achievements', authUser, achievements.getSocialAchievements); // claimed only
router.post('/achievements/claim', authUser, achievements.claimAchievement);
 

module.exports = router;