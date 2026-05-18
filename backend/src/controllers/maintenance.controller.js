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

const assignTechnician = async (req, res, next) => {
  try {
    const { damageReportId, technicianId } = req.body;
    const maintenance = await maintenanceService.assignTechnician(damageReportId, technicianId);
    res.status(201).json({ data: maintenance });
  } catch (err) { next(err); }
};

const submitInspection = async (req, res, next) => {
  try {
    const maintenance = await maintenanceService.submitInspection(req.params.id, req.body);
    res.json({ data: maintenance });
  } catch (err) { next(err); }
};

const finalize = async (req, res, next) => {
  try {
    const { finalDecision, officerNotes } = req.body;
    const maintenance = await maintenanceService.finalizeDecision(req.params.id, finalDecision, officerNotes);
    res.json({ data: maintenance });
  } catch (err) { next(err); }
};

const completeRepair = async (req, res, next) => {
  try {
    const { repairNotes } = req.body;
    const maintenance = await maintenanceService.completeRepair(req.params.id, repairNotes);
    res.json({ data: maintenance });
  } catch (err) { next(err); }
};

module.exports = { getAllMaintenance, getMaintenanceById, assignTechnician, submitInspection, finalize, completeRepair };
