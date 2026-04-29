const resourceService = require('../services/resource.service');

const getAllResources = async (req, res, next) => {
  try {
    const resources = await resourceService.getAllResources();
    res.json({ data: resources });
  } catch (err) {
    next(err);
  }
};

const getResourceById = async (req, res, next) => {
  try {
    const resource = await resourceService.getResourceById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json({ data: resource });
  } catch (err) {
    next(err);
  }
};

const createResource = async (req, res, next) => {
  try {
    const resource = await resourceService.createResource(req.body);
    res.status(201).json({ data: resource });
  } catch (err) {
    next(err);
  }
};

const updateResource = async (req, res, next) => {
  try {
    const resource = await resourceService.updateResource(req.params.id, req.body);
    res.json({ data: resource });
  } catch (err) {
    next(err);
  }
};

const deleteResource = async (req, res, next) => {
  try {
    await resourceService.deleteResource(req.params.id);
    res.json({ message: 'Resource deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const replaceResource = async (req, res, next) => {
  try {
    const newResource = await resourceService.replaceResource(req.params.id, req.body);
    res.json({ data: newResource });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  replaceResource
};
