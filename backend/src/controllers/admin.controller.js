const adminService = require('../services/admin.service');

const createUser = async (req, res, next) => {
  try {
    const creatorRole = req.user.role;
    const { role } = req.body;

    if (creatorRole === 'ADMIN') {
      if (role === 'STAFF') {
        return res.status(400).json({ message: 'System Admin cannot register Staff members. Staff must be registered by their respective Department Head.' });
      }
    } else if (creatorRole === 'DEPARTMENT_HEAD') {
      if (role && role !== 'STAFF') {
        return res.status(400).json({ message: 'Department Heads can only register Staff members.' });
      }
      // Enforce department and role constraint
      req.body.role = 'STAFF';
      req.body.department = req.user.department;
    }

    const user = await adminService.createUser(req.body);
    res.status(201).json({ message: 'User created successfully', data: user });
  } catch (err) { next(err); }
};

const getUsers = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'DEPARTMENT_HEAD') {
      query.department = req.user.department;
    }
    res.json({ data: await adminService.getAllUsers(query) });
  } catch (err) { next(err); }
};

const getUser = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.user.role === 'DEPARTMENT_HEAD' && user.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied: User belongs to another department' });
    }

    res.json({ data: user });
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    const creatorRole = req.user.role;
    const targetUser = await adminService.getUserById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (creatorRole === 'DEPARTMENT_HEAD') {
      if (targetUser.department !== req.user.department || targetUser.role !== 'STAFF') {
        return res.status(403).json({ message: 'Access denied: Department Heads can only manage Staff members in their own department' });
      }
      if (req.body.role && req.body.role !== 'STAFF') {
        return res.status(400).json({ message: 'Department Heads can only assign the STAFF role' });
      }
      req.body.role = 'STAFF';
      req.body.department = req.user.department;
    } else if (creatorRole === 'ADMIN') {
      if (targetUser.role === 'STAFF') {
        return res.status(403).json({ message: 'Access denied: System Admin cannot modify Staff members. Staff must be managed by their respective Department Head.' });
      }
      if (req.body.role === 'STAFF') {
        return res.status(400).json({ message: 'System Admin cannot assign the STAFF role. Staff members must be created/managed by their Department Head.' });
      }
    }

    res.json({ data: await adminService.updateUser(req.params.id, req.body) });
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    const creatorRole = req.user.role;
    const targetUser = await adminService.getUserById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (creatorRole === 'DEPARTMENT_HEAD') {
      if (targetUser.department !== req.user.department || targetUser.role !== 'STAFF') {
        return res.status(403).json({ message: 'Access denied: Department Heads can only delete Staff members in their own department' });
      }
    } else if (creatorRole === 'ADMIN') {
      if (targetUser.role === 'STAFF') {
        return res.status(403).json({ message: 'Access denied: System Admin cannot delete Staff members. Staff must be managed by their respective Department Head.' });
      }
    }

    await adminService.deleteUser(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
};

const getAnalytics = async (req, res, next) => {
  try {
    res.json({ data: await adminService.getAnalyticsStats() });
  } catch (err) { next(err); }
};

const getSystemStats = async (req, res, next) => {
  try {
    res.json({ data: await adminService.getSystemStats() });
  } catch (err) { next(err); }
};

const bulkCreateUsers = async (req, res, next) => {
  try {
    const result = await adminService.bulkCreateUsers(req.body.users, req.user);
    res.status(201).json({ message: 'Bulk users created successfully', data: result });
  } catch (err) { next(err); }
};

module.exports = { createUser, getUsers, getUser, updateUser, deleteUser, getAnalytics, getSystemStats, bulkCreateUsers };
