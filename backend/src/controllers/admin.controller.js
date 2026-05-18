const adminService = require('../services/admin.service');

const getUsers = async (req, res, next) => {
  try {
    res.json({ data: await adminService.getAllUsers() });
  } catch (err) { next(err); }
};

const getUser = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ data: user });
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    res.json({ data: await adminService.updateUser(req.params.id, req.body) });
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    await adminService.deleteUser(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
};

const getAnalytics = async (req, res, next) => {
  try {
    res.json({ data: await adminService.getAnalyticsStats() });
  } catch (err) { next(err); }
};

module.exports = { getUsers, getUser, updateUser, deleteUser, getAnalytics };
