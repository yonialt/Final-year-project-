const maintenanceService = require('../services/maintenance.service');

const getAllMaintenance = async (req, res, next) => {
  try {
    const tasks = await maintenanceService.getAllMaintenance(req.user);
    res.json({ data: tasks });
  } catch (err) { next(err); }
};

const getMaintenanceById = async (req, res, next) => {
  try {
    const task = await maintenanceService.getMaintenanceById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Maintenance task not found' });
    res.json({ data: task });
  } catch (err) { next(err); }
};

const startMaintenance = async (req, res, next) => {
  try {
    const { requestId, technicianId } = req.body;
    const maintenance = await maintenanceService.startMaintenance(requestId, technicianId || req.user.id);
    res.status(201).json({ data: maintenance });
  } catch (err) { next(err); }
};

const inputData = async (req, res, next) => {
  try {
    const maintenance = await maintenanceService.inputMaintenanceData(req.params.id, req.body);
    res.json({ data: maintenance });
  } catch (err) { next(err); }
};

const finalize = async (req, res, next) => {
  try {
    const { finalDecision } = req.body;
    const maintenance = await maintenanceService.finalizeDecision(req.params.id, finalDecision);
    res.json({ data: maintenance });
  } catch (err) { next(err); }
};

module.exports = { getAllMaintenance, getMaintenanceById, startMaintenance, inputData, finalize };
