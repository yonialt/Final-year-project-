const prisma = require('../config/prisma');

/**
 * Resource Management Service
 */

/**
 * Abstract the scoping / filtering logic for Resources based on the user's role.
 * 
 * Rules:
 * 1. STAFF: Sees only their own assigned assets (userId === user.id).
 * 2. DEPARTMENT_HEAD: Sees their own assets + staff assets within their department + direct department-assigned assets.
 * 3. ACADEMIC_DEAN: Sees their own assets + head/staff assets within their department + direct department-assigned assets.
 * 4. ADMIN, RESOURCE_OFFICER, TECHNICIAN: Sees all resources.
 */
const getResourceScopeFilter = (user) => {
  if (!user) return {};

  const role = user.role;
  const userId = user.id;
  const dept = user.department;

  if (['ADMIN', 'RESOURCE_OFFICER', 'TECHNICIAN'].includes(role)) {
    return {}; // No filter, see all resources
  }

  if (role === 'STAFF') {
    return { userId };
  }

  if (role === 'DEPARTMENT_HEAD') {
    return {
      OR: [
        { userId },
        {
          user: {
            role: 'STAFF',
            department: dept
          }
        },
        {
          userId: null,
          ownerDepartment: dept
        }
      ]
    };
  }

  if (role === 'ACADEMIC_DEAN') {
    return {
      OR: [
        { userId },
        {
          user: {
            role: { in: ['STAFF', 'DEPARTMENT_HEAD'] },
            department: dept
          }
        },
        {
          userId: null,
          ownerDepartment: dept
        }
      ]
    };
  }

  return { userId };
};

const getAllResources = async (user) => {
  const filter = getResourceScopeFilter(user);
  return await prisma.resource.findMany({
    where: filter,
    orderBy: { updatedAt: 'desc' },
    include: { maintenances: true, requests: true, user: { select: { id: true, name: true, role: true, department: true } } }
  });
};

const getResourceById = async (id, user) => {
  const filter = getResourceScopeFilter(user);
  return await prisma.resource.findFirst({
    where: {
      id,
      ...filter
    },
    include: { maintenances: true, requests: true, user: { select: { id: true, name: true, role: true, department: true } } }
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
    // 1. Unassign old
    await tx.resource.update({
      where: { id: oldResourceId },
      data: { userId: null }
    });

    // 2. Create new
    return await tx.resource.create({
      data: {
        name: newData.name || oldResource.name,
        type: newData.type || oldResource.type,
        location: newData.location || oldResource.location,
        ownerDepartment: newData.ownerDepartment || oldResource.ownerDepartment,
        purchaseDate: new Date(),
        purchasePrice: newData.purchasePrice || oldResource.purchasePrice
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
