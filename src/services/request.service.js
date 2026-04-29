const prisma = require('../config/prisma');

/**
 * Request System Service
 * Flow: STAFF → DEPARTMENT_HEAD → ACADEMIC_DEAN → RESOURCE_OFFICER
 */

const createRequest = async (userId, data) => {
  return await prisma.request.create({
    data: {
      userId,
      ...data,
      status: 'PENDING'
    }
  });
};

const getRequestsByRole = async (user) => {
  const includeOptions = { 
    user: true, 
    resource: true,
    maintenance: true 
  };

  if (user.role === 'ADMIN' || user.role === 'RESOURCE_OFFICER' || user.role === 'ACADEMIC_DEAN') {
    return await prisma.request.findMany({ include: includeOptions });
  }
  
  if (user.role === 'STAFF') {
    return await prisma.request.findMany({ 
      where: { userId: user.id }, 
      include: includeOptions 
    });
  }

  // Department Heads see requests from their department
  if (user.role === 'DEPARTMENT_HEAD') {
    return await prisma.request.findMany({
      where: { user: { department: user.department } },
      include: includeOptions
    });
  }

  return await prisma.request.findMany({ include: includeOptions });
};

const updateRequestStatus = async (id, status, role) => {
  const request = await prisma.request.findUnique({ where: { id } });
  if (!request) throw new Error('Request not found');

  // Logic for transitions
  let nextStatus = status;

  // Simple validation based on role (can be expanded)
  if (role === 'DEPARTMENT_HEAD' && status === 'APPROVED_BY_HEAD') {
    nextStatus = 'APPROVED_BY_HEAD';
  } else if (role === 'ACADEMIC_DEAN' && status === 'APPROVED_BY_DEAN') {
    nextStatus = 'APPROVED_BY_DEAN';
  } else if (role === 'RESOURCE_OFFICER' && status === 'APPROVED_BY_OFFICER') {
    nextStatus = 'APPROVED_BY_OFFICER';
  } else if (status === 'REJECTED') {
    nextStatus = 'REJECTED';
  }

  return await prisma.request.update({
    where: { id },
    data: { status: nextStatus }
  });
};

module.exports = {
  createRequest,
  getRequestsByRole,
  updateRequestStatus
};
