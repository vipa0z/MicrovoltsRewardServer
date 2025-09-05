const Achievements = require("../services/achievements")
const Player = require("../services/Player")
exports.getSelfAchievements = async (req , res) => {
 const playerId = req.user.id;
 const playerNickName = req.user.nickname;
    try {
        const achievements = new Achievements(playerId,playerNickName)
        const achievementData = await achievements.getAchievements()
        res.status(200).json({
            success: true,
            data: achievementData
        })
    } catch (error) {
       console.error(error)
        return res.status(500).json({
            success: false,
            error: "internal server error"
        })       
    }
}
exports.getSocialAchievements = async (req , res) => {
    const playerNickName = req.params.nickname;
    if (!playerNickName) {
        return res.status(400).json({
            success: false,
            error: "Missing nickname parameter"
        })
    }
    const doesPlayerExist = await Player.findUserByNickname(playerNickName)
    if (!doesPlayerExist) {
        return res.status(404).json({
            success: false,
            error: "Player not found"
        })
    }
    try {
        const socialAchievements = await Achievements.getSocialAchievements(playerNickName)
       
        res.status(200).json({
            success: true,
            data: socialAchievements
        })
    } catch (error) {
       console.error(error)
        return res.status(500).json({
            success: false,
            error: "internal server error"
        })       
    }
}
exports.claimAchievement = async (req , res) => {
    const achievementSlug = req.body.achievementSlug;
    const playerId = req.user.id;
    const playerNickName = req.user.nickname;
    if (!achievementSlug) {
        return res.status(400).json({
            success: false,
            error: "Missing achievement slug"
        })
    }
    try {
        const achievements = new Achievements(playerId,playerNickName)
        const achievementData = await achievements.claimAchievement(achievementSlug)
        if (!achievementData.error) {
            return res.status(200).json({
                success: achievementData.success,
                data: {message: achievementData.message, achievement: achievementData.achievement}
            })
        } else {
            return res.status(400).json({
                success: achievementData.success,
                error: achievementData.error
            })
        }
    } catch (error) {
       console.error(error)
        return res.status(500).json({
            success: false,
            error: "internal server error"
        })       
    }
}