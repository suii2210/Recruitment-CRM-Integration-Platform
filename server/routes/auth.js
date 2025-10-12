import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Author from '../models/Author.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Get client IP address
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '127.0.0.1';
};

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user and populate role
    const user = await User.findOne({ email }).populate('roleId');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Account is not active' });
    }

    // Update last login and add activity log
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    user.lastLogin = new Date();
    await user.addActivity('Logged in', clientIP, userAgent);

    // Generate token
    const token = generateToken(user._id);

    // Get user role with permissions
    const userRole = await Role.findById(user.roleId);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleId: user.roleId,
        status: user.status,
        lastLogin: user.lastLogin,
        avatar: user.avatar,
        title: user.title || 'MATV Staff',
        category: user.category || 'BUSINESS',
        socialLinks: user.socialLinks || { twitter: '', linkedin: '' },
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      permissions: userRole?.permissions || []
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('roleId');
    const userRole = await Role.findById(user.roleId);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleId: user.roleId,
        status: user.status,
        lastLogin: user.lastLogin,
        avatar: user.avatar,
        phone: user.phone,
        location: user.location,
        bio: user.bio,
        website: user.website,
        title: user.title || 'MATV Staff',
        category: user.category || 'BUSINESS',
        socialLinks: user.socialLinks || { twitter: '', linkedin: '' },
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      permissions: userRole?.permissions || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user data' });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email, phone, location, bio, website, socialLinks, title, category } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (bio !== undefined) user.bio = bio;
    if (website !== undefined) user.website = website;
    if (socialLinks !== undefined) user.socialLinks = socialLinks;
    if (title !== undefined) user.title = title;
    if (category !== undefined) user.category = category;

    // Add activity log
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    await user.addActivity('Updated profile', clientIP, userAgent, { 
      fields: Object.keys(req.body) 
    });

    await user.save();
    
    // Update corresponding author entry if it exists
    try {
      const author = await Author.findOne({ email: user.email });
      if (author) {
        author.name = user.name;
        author.bio = user.bio || '';
        author.location = user.location || '';
        author.phone = user.phone || '';
        author.website = user.website || '';
        author.title = user.title || 'MATV Staff';
        author.category = user.category || 'BUSINESS';
        author.socialLinks = user.socialLinks;
        
        await author.save();
        console.log(`Author updated for user: ${user.name}`);
      }
    } catch (authorError) {
      console.error('Failed to update author for user:', authorError);
      // Continue even if author update fails
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        bio: user.bio,
        website: user.website,
        avatar: user.avatar,
        title: user.title || 'MATV Staff',
        category: user.category || 'BUSINESS',
        socialLinks: user.socialLinks,
        preferences: user.preferences,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Update password
    user.password = newPassword;
    
    // Add activity log
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    await user.addActivity('Changed password', clientIP, userAgent);

    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Update preferences
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const { theme, emailNotifications, pushNotifications, loginNotifications, twoFactorEnabled } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update preferences
    if (theme !== undefined) user.preferences.theme = theme;
    if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) user.preferences.pushNotifications = pushNotifications;
    if (loginNotifications !== undefined) user.preferences.loginNotifications = loginNotifications;
    if (twoFactorEnabled !== undefined) user.preferences.twoFactorEnabled = twoFactorEnabled;

    // Add activity log
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    await user.addActivity('Updated preferences', clientIP, userAgent, { 
      preferences: req.body 
    });

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
});

// Get activity log
router.get('/activity', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    
    const activities = user.activityLog.slice(startIndex, endIndex);
    const total = user.activityLog.length;

    res.json({
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: endIndex < total,
        hasPrev: startIndex > 0
      }
    });
  } catch (error) {
    console.error('Activity log error:', error);
    res.status(500).json({ message: 'Failed to get activity log' });
  }
});

// Upload avatar
router.post('/avatar', authenticate, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = imageUrl;
    
    // Add activity log
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    await user.addActivity('Updated avatar', clientIP, userAgent);

    await user.save();
    
    // Update corresponding author entry if it exists
    try {
      const author = await Author.findOne({ email: user.email });
      if (author) {
        author.avatar = user.avatar || '';
        await author.save();
        console.log(`Author avatar updated for user: ${user.name}`);
      }
    } catch (authorError) {
      console.error('Failed to update author avatar for user:', authorError);
      // Continue even if author update fails
    }

    res.json({
      message: 'Avatar updated successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Avatar update error:', error);
    res.status(500).json({ message: 'Failed to update avatar' });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      // Add activity log
      const clientIP = getClientIP(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';
      await user.addActivity('Logged out', clientIP, userAgent);
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.json({ message: 'Logout successful' }); // Always succeed for logout
  }
});

// Refresh token
router.post('/refresh', authenticate, (req, res) => {
  try {
    const token = generateToken(req.user._id);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Token refresh failed' });
  }
});

export default router;