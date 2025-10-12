import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('roleId');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const authorize = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required.' });
      }

      const userRole = await Role.findById(req.user.roleId);
      
      if (!userRole) {
        return res.status(403).json({ message: 'User role not found.' });
      }

      // Check if user has required permissions
      const hasPermission = permissions.some(permission => 
        userRole.permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          message: 'Insufficient permissions to access this resource.' 
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Authorization error.' });
    }
  };
};

export const isSuperAdmin = async (req, res, next) => {
  try {
    const userRole = await Role.findById(req.user.roleId);
    
    if (userRole.name !== 'Super Admin') {
      return res.status(403).json({ 
        message: 'Super Admin access required.' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error.' });
  }
};