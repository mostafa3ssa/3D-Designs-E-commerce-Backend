import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import TokenBlacklist from '../models/tokenBlackList.model.js';

export const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
         return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const blacklistedToken = await TokenBlacklist.findOne({ token: token });
        if (blacklistedToken) {
            return res.status(401).json({ message: 'Not authorized, token has been logged out' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.userId).select('-password');
        
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }
        
        req.token = token;

        next();
    } catch (error) {
        console.error('[Auth Middleware Error]', error);
        if (error.name === 'JsonWebTokenError') {
             return res.status(401).json({ message: 'Not authorized, invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Not authorized, token expired' });
        }
        res.status(500).json({ message: 'Server error during authentication' });
    }
};

export const optionalAuthMiddleware = async (req, res, next) => {
    const token = req.cookies.token;

    if (token) {
        try {
            const blacklistedToken = await TokenBlacklist.findOne({ token: token });
            if (blacklistedToken) {

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await User.findById(decoded.userId).select('-password');
                
                if (!req.user) {
                    req.token = token;
                }
            }

        } catch (error) {
            
        }
    }
    
    next();
};

export const isAdmin = async (req, res, next) => {
    if(!req.user || !req.user.isAdmin) {
        return res.status(401).json({ message: "Not authorized" });
    }

    next();
}