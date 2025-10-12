import express from 'express';
import Permission from '../models/Permission.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all permissions
router.get('/', authenticate, authorize(['roles.view']), async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ category: 1, name: 1 });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch permissions' });
  }
});

// Get permissions by category
router.get('/category/:category', authenticate, authorize(['roles.view']), async (req, res) => {
  try {
    const permissions = await Permission.find({ 
      category: req.params.category 
    }).sort({ name: 1 });
    
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch permissions' });
  }
});

export default router;