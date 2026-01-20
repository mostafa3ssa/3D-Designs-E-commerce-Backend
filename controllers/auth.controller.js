import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import TokenBlacklist from '../models/tokenBlackList.model.js';
import { sendVerificationEmail } from '../utils/emailHelper.js';
import crypto from 'crypto';


const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
};

export const register = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if(!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "All Credintials Required." });
    }

    try {

        const existingUser = await User.findOne({email});

        if(existingUser) {
            if (!existingUser.isVerified) {
                const verificationToken = existingUser.generateEmailVerificationToken();
                await existingUser.save();
                
                // Resend email
                await sendVerificationEmail(existingUser.email, verificationToken);
                
                return res.status(200).json({ 
                    message: "An unverified user with this email already exists. A new verification email has been sent." 
                });
            } else {
                return res.status(400).json({ message: "Email already registered" });
            }
        }

        const saltRounds=parseInt(process.env.SALT_ROUNDS);
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        const verificationToken = newUser.generateEmailVerificationToken();
        await newUser.save();
        
        await sendVerificationEmail(newUser.email, verificationToken)

        res.status(201).json({
            message: "User registered successfully",
            userId: newUser._id
        });

    } catch (error) {
        console.error("[Auth Register Error]", error);
        res.status(500).json({ message: "Server error during registration" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!user.isVerified) {
            return res.status(403).json({ 
                message: "Please verify your email address before logging in." 
            });
        }

        const token = generateToken(user._id);

        res.cookie('token', token, cookieOptions);

        res.status(200).json({
            message: "Login successful",
            userId: user._id
        });

    } catch (error) {
        console.error("[Auth Login Error]", error);
        res.status(500).json({ message: "Server error during login" });
    }
};


export const verifyEmail = async (req, res) => {
    // Get the token from the query parameters (/api/auth/verify-email?token=...)
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: "Verification token is missing." });
    }

    try {

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest('hex')


            const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationTokenExpires: { $gt: Date.now() } 
        }).select('+emailVerificationToken +emailVerificationTokenExpires'); 

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification token." });
        }

        console.log("user is verified");


        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationTokenExpires = undefined;

        await user.save();

        console.log("user saved");
        
        const jwtToken = generateToken(user._id);

        res.cookie('token', jwtToken, cookieOptions);
        
        res.status(200).json({
            message: "Email verified successfully! You are now logged in.",
            userId: user._id,
            email: user.email,
            firstName: user.firstName
        });

    } catch (error) {
        console.error("[Email Verify Error]", error);
        res.status(500).json({ message: "Server error during email verification" });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Please provide an email." });
    }

    try {
        const user = await User.findOne({ email });

        // IMPORTANT: Always send a success-like response, even if user isn't found.
        // This prevents "email enumeration," which is a security risk.
        if (user) {
            const resetToken = user.generatePasswordResetToken();
            await user.save();
            
            // Send the email
            await sendPasswordResetEmail(user.email, resetToken);
        }

        res.status(200).json({ 
            message: "If an account with that email exists, a password reset link has been sent." 
        });

    } catch (error) {
        console.error("[Forgot Password Error]", error);
        res.status(200).json({ 
            message: "If an account with that email exists, a password reset link has been sent." 
        });
    }
};

export const resetPassword = async (req, res) => {
    const { token } = req.query;
    const { password } = req.body;

    if (!token) {
        return res.status(400).json({ message: "Reset token is missing." });
    }
    if (!password) {
        return res.status(400).json({ message: "Please provide a new password." });
    }

    try {
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetTokenExpires: { $gt: Date.now() }
        }).select('+passwordResetToken +passwordResetTokenExpires');

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired password reset token." });
        }

        const saltRounds = parseInt(process.env.SALT_ROUNDS || '10');
        const salt = await bcrypt.genSalt(saltRounds);
        user.password = await bcrypt.hash(password, salt);
        
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;

        await user.save();

        res.status(200).json({
            message: "Password has been reset successfully. You can now log in."
        });

    } catch (error) {
        console.error("[Reset Password Error]", error);
        res.status(500).json({ message: "Server error during password reset" });
    }
};

export const logout = async (req, res) => {
    try {
        const token = req.token;

        if (token) {
            const blacklistedToken = new TokenBlacklist({ token: token });
            await blacklistedToken.save();
        }
        
        res.clearCookie('token', cookieOptions);
        
        res.status(200).json({ message: "Logout successful" });

    } catch (error) {
        console.error("[Auth Logout Error]", error);
        res.status(500).json({ message: "Server error during logout" });
    }
};

