import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, 
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
    },
});


export const sendVerificationEmail = async (userEmail, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
        from: `"Printra" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Verify Your Email Address",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Welcome to Printra!</h2>
                <p>Please click the link below to verify your email address:</p>
                <p>
                    <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
                        Verify Your Email
                    </a>
                </p>
                <p>If you did not create an account, please ignore this email.</p>
                <p>This link will expire in 10 minutes.</p>
                <hr />
                <p><small>If you're having trouble clicking the button, copy and paste this URL into your browser:</small></p>
                <p><small>${verificationUrl}</small></p>
            </div>
        `,
        text: `
            Welcome to Printra!
            Please copy and paste this URL into your browser to verify your email address:
            ${verificationUrl}
            
            This link will expire in 10 minutes.
            If you did not create an account, please ignore this email.
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Verification email sent: " + info.response);
    } catch (error) {
        console.error("[Email Service Error]", "Error sending verification email:", error);
        // In a real app, you might want to handle this failure more gracefully
        // (e.g., retry, or clean up the unverified user)
    }
};


export const sendPasswordResetEmail = async (userEmail, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"Your App Name" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Password Reset Request",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Password Reset Request</h2>
                <p>You (or someone else) requested a password reset for your account.</p>
                <p>Please click the link below to set a new password:</p>
                <p>
                    <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
                        Reset Your Password
                    </a>
                </p>
                <p>If you did not request this, please ignore this email.</p>
                <p>This link will expire in 10 minutes.</p>
                <hr />
                <p><small>If you're having trouble clicking the button, copy and paste this URL into your browser:</small></p>
                <p><small>${resetUrl}</small></p>
            </div>
        `,
        text: `
            Password Reset Request
            You (or someone else) requested a password reset for your account.
            Please copy and paste this URL into your browser to set a new password:
            ${resetUrl}
            
            This link will expire in 10 minutes.
            If you did not request this, please ignore this email.
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Password reset email sent: " + info.response);
    } catch (error) {
        console.error("[Email Service Error]", "Error sending password reset email:", error);
    }
};