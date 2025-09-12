const SpinningWheel = require('../services/SpinningWheel');
const {winstonLogger, logger} = require('../util/logger');
const MemoryLoader = require('../util/MemoryLoader');
exports.drawWheel = async (req, res) => {
    const wheel = new SpinningWheel(req.user.id, req.user.nickname);

    try {
        const spinResult = await wheel.spin();
        
        if (spinResult.error) {
            return res.status(200).json({
                success:false,
                data:spinResult
            
            });
        }
        
        // save log 
          winstonLogger.info(`Player "${req.user.nickname}" won "${spinResult.itemName}"`);
       
        console.log(spinResult)
          return res.status(200).json({
            success: spinResult.success,
            data: {
                message: `Congratulations! You won ${spinResult.itemName}`,
                remainingSpins: spinResult.remainingSpins
            }
        });


    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });

    }
}
// API get
exports.getWheelItems = async (req, res) => {
    const playerInfo = {playerId:req.user.playerId,nickname:req.user.nickname}
    const wheel = new SpinningWheel(playerInfo)
    try {
    const eligibility = await wheel.checkEligibility();
    
        res.status(200).json( {
            success: true,
            data: {
                canSpin: eligibility.canSpin,
                remainingSpins: eligibility.remainingSpins,
                hoursUntilNextSpin: eligibility.hoursUntilNextSpin,
                wheelItems: MemoryLoader.getItems('wheel_items_data')
            }
        });
    } catch (err) {
        logger.error(`Error rendering wheel page for player ${playerId}: ${err.message}`);
        return res.render('error', {
            error: {
                message: "An error occurred while loading the wheel page"
            }
        });
    }
}



// GUI
// exports.renderWheelPage = async (req, res) => {
//     const playerId = req.user.playerId;
//     const wheel = new SpinningWheel(playerId);
//     const wheelItems = MemoryLoader.getItems('wheel_items_data');
//     try {
//            const eligibility = await wheel.checkEligibility();
//         // Render the wheel page with eligibility information
//         res.render('wheel', {
//             success: true,
//             canSpin: eligibility.canSpin,
//             remainingSpins: eligibility.remainingSpins,
//             hoursUntilNextSpin: eligibility.hoursUntilNextSpin,
//             wheelItems,
//             title:'wheel'
//         });
//     } catch (err) {
//         logger.error(`Error rendering wheel page for player ${playerId}: ${err.message}`);
//         return res.render('error', {
//             error: {
//                 message: "An error occurred while loading the wheel page"
//             }
//         });
//     }
// }
