import express from 'express';
import Role from '../models/Role.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all roles
router.get('/', authenticate, authorize(['roles.view']), async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
});

// Get role by ID
router.get('/:id', authenticate, authorize(['roles.view']), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch role' });
  }
});

// Create role
router.post('/', authenticate, authorize(['roles.manage']), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const role = new Role({
      name,
      description,
      permissions,
      createdBy: req.user._id
    });

    await role.save();

    res.status(201).json({
      message: 'Role created successfully',
      role
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Role name already exists' });
    }
    res.status(500).json({ message: 'Failed to create role' });
  }
});

// Update role
router.put('/:id', authenticate, authorize(['roles.manage']), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Prevent updating default roles
    if (role.isDefault) {
      return res.status(400).json({ message: 'Cannot modify default roles' });
    }

    role.name = name;
    role.description = description;
    role.permissions = permissions;

    await role.save();

    // Update all users with this role
    await User.updateMany(
      { roleId: role._id },
      { role: role.name }
    );

    res.json({
      message: 'Role updated successfully',
      role
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Role name already exists' });
    }
    res.status(500).json({ message: 'Failed to update role' });
  }
});

// Delete role
router.delete('/:id', authenticate, authorize(['roles.manage']), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Prevent deleting default roles
    if (role.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default roles' });
    }

    // Check if any users have this role
    const usersWithRole = await User.countDocuments({ roleId: role._id });
    if (usersWithRole > 0) {
      return res.status(400).json({ 
        message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.` 
      });
    }

    await Role.findByIdAndDelete(req.params.id);

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete role' });
  }
});

export default router;