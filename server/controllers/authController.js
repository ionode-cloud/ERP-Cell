const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
    try {
        const { loginId, password } = req.body;

        if (!loginId || !password) {
            return res.status(400).json({ success: false, message: 'Please provide loginId and password' });
        }

        const user = await User.findOne({ loginId: loginId.toLowerCase() });
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
        }

        const token = generateToken(user._id);
        res.json({
            success: true,
            token,
            user: { id: user._id, name: user.name, role: user.role, loginId: user.loginId, refId: user.refId }
        });
    } catch (error) {
        console.error(`[ERROR] Login error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Forgot Password (Admin Only)
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const { loginId } = req.body;
        const user = await User.findOne({ loginId: loginId.toLowerCase() });

        if (!user || user.role !== 'admin') {
            return res.status(404).json({ success: false, message: 'Admin account not found' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
        
        // In local dev, req.get('host') usually gives localhost:5000, 
        // but for frontend it should be localhost:5173 (or current origin)
        // Let's use origin if possible or hardcode for now
        const frontendUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://erp-cell.ionode.cloud';
        const finalResetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        const { data, error } = await resend.emails.send({
            from: 'College ERP <onboarding@resend.dev>',
            to: [user.loginId],
            subject: 'Password Reset Request',
            html: `
                <h3>Password Reset Request</h3>
                <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
                <p>Please click on the following link to complete the process:</p>
                <a href="${finalResetUrl}" clicktracking=off>${finalResetUrl}</a>
                <p>If you did not request this, please ignore this email.</p>
            `,
        });

        if (error) {
            console.error('Resend Error:', error);
            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }

        res.json({ success: true, message: 'Email sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reset Password
// @route   PUT /api/auth/reset-password/:resettoken
const resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { login, getMe, forgotPassword, resetPassword };
