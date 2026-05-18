const damageReportService = require('../services/damageReport.service');

const getReports = async (req, res, next) => {
  try {
    const reports = await damageReportService.getDamageReportsByRole(req.user);
    res.json({ data: reports });
  } catch (err) { next(err); }
};

const getReport = async (req, res, next) => {
  try {
    const report = await damageReportService.getDamageReportById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Damage report not found' });
    res.json({ data: report });
  } catch (err) { next(err); }
};

const createReport = async (req, res, next) => {
  try {
    const report = await damageReportService.createDamageReport(req.user.id, req.body);
    res.status(201).json({ data: report });
  } catch (err) { next(err); }
};

const forwardToOfficer = async (req, res, next) => {
  try {
    const report = await damageReportService.forwardToOfficer(req.params.id, req.user.id);
    res.json({ data: report });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const report = await damageReportService.updateStatus(req.params.id, req.body.status);
    res.json({ data: report });
  } catch (err) { next(err); }
};

module.exports = { getReports, getReport, createReport, forwardToOfficer, updateStatus };
