const jwt = require('jsonwebtoken');
const dotenv = require("dotenv").config();
const crypto = require('crypto');
const Player = require('../database/Player');

// Simple validation: allow only letters and digits for Username (no underscores or specials)
// If you prefer a library, consider `validator` (e.g., validator.isAlphanumeric)
const USERNAME_REGEX = /^[A-Za-z0-9]+$/;


// ─────────────── Register ───────────────
exports.register = async (req, res) => {
    const username = req.body.username
    const password = req.body.password 
    const nickname = (req.body.nickname ?? req.body.nickName)?.trim();
    if (!username || !password || !nickname) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    // Username must be only letters and digits
    if (!USERNAME_REGEX.test(username)) {
        return res.status(400).json({ message: 'Invalid username: letters and digits only (A-Z, a-z, 0-9)' });
    }
    if (!USERNAME_REGEX.test(nickname)) {
        return res.status(400).json({ message: 'Invalid nickname: letters and digits only (A-Z, a-z, 0-9)' });
    }


    try {
        const unAvail =(await Player.checkPlayerAvailability(username))
        if (unAvail) {
            console.log(unAvail)
            return res.status(400).json({
                success:false,
                message: 'Username Taken'
                
            })

        }

        if (await Player.checkPlayerAvailability(nickname)) {
            return res.status(400).json({
                success:false,
                message: 'Nickname Taken'
                
            })
        }
        const hashedPassword =  crypto.createHash('sha256').update(password).digest('hex');

        const newUser = await Player.createUser(username, hashedPassword, nickname);

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                message: 'User registered successfully',
            }
        });
       
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.registerStaffMember = async (req, res) => {
  
    const username = req.body.username
    const password = req.body.password 
    const nickname = (req.body.nickname ?? req.body.nickName)?.trim();
    const newStaffMemberGrade = req.body.grade
     
    if (!username || !password || !nickname || !newStaffMemberGrade) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    // Username must be only letters and digits
    if (!USERNAME_REGEX.test(username)) {
        return res.status(400).json({ message: 'Invalid username: letters and digits only (A-Z, a-z, 0-9)' });
    }
      /*  grade assignment
    ------------------------------
    Grade 2 is Event Supporter,
    Grade 3 is Moderator,
    Grade 4 is Game Master,
    Grade 7 is Developer (highest).
    [+] grade 4 and above can add staff members>
    ---------------------------------
    */
    const allowedGrades = [2, 3, 4, 7]; // valid grades
    if (isNaN(newStaffMemberGrade) || !allowedGrades.includes(newStaffMemberGrade)) {
        return res.status(400).json({ message: 'Invalid grade: must be a number' });
    }
    // check access lvl for requester (only GMs and above (grade 4+) can add staff members)
    // tmp:
    
     if (req.user.grade < 4 ) {
        return res.status(403).json({ message: 'Only grade 4 and above can add staff members' });
    }
    // if (req.user.grade < 4 ) {
    //     return res.status(403).json({ message: 'Only grade 4 and above can add staff members' });
    // }
  

    try {
        if (await Player.checkPlayerAvailability(username)) {
            return res.status(400).json({ message: 'Username already Taken' });
        }

        if (await Player.checkPlayerAvailability(nickname)) {
            return res.status(400).json({ message: 'Nickname Taken' });
        }
        const hashedPassword =  crypto.createHash('sha256').update(password).digest('hex');

         await Player.createUser(username, hashedPassword, nickname, newStaffMemberGrade);
      
        return res.status(201).json({
            success: true,
            message: 'privileged user registered successfully',
           
        });
    
       
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// ─────────────── Login ───────────────
exports.login = async (req, res) => {
    const username = req.body.username
    const password = req.body.password 
    if (!username || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const user = await Player.getPlayerDetails(username);
      
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const hashedPassword = user.password;
        if (verifyPassword(password, hashedPassword)) {
            } else {
            return res.status(401).json({ message: 'Invalid credentials' });
            }       
        const staffGrades = [2, 3, 4, 7];
        const isStaff = staffGrades.includes(Number(user.grade));
        const jwtSecret = isStaff ? process.env.ADMIN_JWT_SECRET : process.env.USER_JWT_SECRET;

        const payload = {
            id: user.accountId,
            username: user.username,
            nickname: user.nickname,
            grade: user.grade,
            level: user.level,
        };
        console.log('JWT payload:', payload);

        const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

        return res.status(200).json({
            success: true,
            data: {
                message: "Login successful",
                token,
             
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

function verifyPassword(inputPassword, storedHash) {
  const inputHash = crypto.createHash('sha256').update(inputPassword).digest('hex');
  return inputHash === storedHash;
}



