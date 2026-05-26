const prisma = require('../config/prisma');

/**
 * Resource Management Service
 */

const getAllResources = async () => {
  return await prisma.resource.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { maintenances: true, requests: true }
  });
};

const getResourceById = async (id) => {
  return await prisma.resource.findUnique({
    where: { id },
    include: { maintenances: true, requests: true }
  });
};

const createResource = async (data) => {
  return await prisma.resource.create({ data });
};

const updateResource = async (id, data) => {
  return await prisma.resource.update({
    where: { id },
    data
  });
};

const deleteResource = async (id) => {
  return await prisma.resource.delete({ where: { id } });
};

/**
 * Handle resource replacement:
 * 1. Mark existing resource as DISPOSED
 * 2. Create a new resource record based on the old one or new data
 */
const replaceResource = async (oldResourceId, newData) => {
  const oldResource = await prisma.resource.findUnique({ where: { id: oldResourceId } });
  if (!oldResource) throw new Error('Resource not found');

  return await prisma.$transaction(async (tx) => {
    // 1. Dispose old
    await tx.resource.update({
      where: { id: oldResourceId },
      data: { status: 'DISPOSED' }
    });

    // 2. Create new
    return await tx.resource.create({
      data: {
        name: newData.name || oldResource.name,
        type: newData.type || oldResource.type,
        location: newData.location || oldResource.location,
        ownerDepartment: newData.ownerDepartment || oldResource.ownerDepartment,
        purchaseDate: new Date(),
        purchasePrice: newData.purchasePrice || oldResource.purchasePrice,
        status: 'AVAILABLE'
      }
    });
  });
};

module.exports = {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  replaceResource
};
