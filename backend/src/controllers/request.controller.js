const requestService = require('../services/request.service');

const getRequests = async (req, res, next) => {
  try {
    const requests = await requestService.getRequestsByRole(req.user);
    res.json({ data: requests });
  } catch (err) { next(err); }
};

const getRequest = async (req, res, next) => {
  try {
    const request = await requestService.getRequestById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json({ data: request });
  } catch (err) { next(err); }
};

const createRequest = async (req, res, next) => {
  try {
    const request = await requestService.createRequest(req.user.id, req.body);
    res.status(201).json({ data: request });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const request = await requestService.updateRequestStatus(req.params.id, status, req.user.role, rejectionReason, req.user);
    res.json({ data: request });
  } catch (err) { next(err); }
};

module.exports = { getRequests, getRequest, createRequest, updateStatus };
