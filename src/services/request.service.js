const prisma = require('../config/prisma');
const notificationService = require('./notification.service');

/**
 * Request Service — NEW RESOURCE Procurement Workflow
 * Flow: STAFF → DEPARTMENT_HEAD → ACADEMIC_DEAN → RESOURCE_OFFICER → Procured
 */

const INCLUDE = {
  user: { select: { id: true, name: true, email: true, department: true, role: true } },
  resource: true
};

// ── Create request (STAFF) ──────────────────────────────────────────────────
const createRequest = async (userId, data) => {
  const request = await prisma.request.create({
    data: {
      userId,
      type: data.type || 'NEW_RESOURCE',
      description: data.description,
      resourceName: data.resourceName,
      resourceType: data.resourceType,
      urgency: data.urgency || 'MEDIUM',
      reason: data.reason,
      resourceId: data.resourceId || null,
      status: 'PENDING'
    },
    include: INCLUDE
  });

  // Notify department heads
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const deptHeads = await prisma.user.findMany({
    where: { role: 'DEPARTMENT_HEAD', department: user.department }
  });
  for (const head of deptHeads) {
    await notificationService.create(head.id, {
      title: 'New Resource Request',
      message: `${user.name} submitted a new resource request: ${data.resourceName || data.description}`,
      type: 'ACTION',
      link: '/requests'
    });
  }

  return request;
};

// ── Get requests by role ────────────────────────────────────────────────────
const getRequestsByRole = async (user) => {
  const orderBy = { updatedAt: 'desc' };

  if (user.role === 'STAFF') {
    return prisma.request.findMany({
      where: { userId: user.id },
      include: INCLUDE,
      orderBy
    });
  }

  if (user.role === 'DEPARTMENT_HEAD') {
    // See requests from their department
    return prisma.request.findMany({
      where: { user: { department: user.department } },
      include: INCLUDE,
      orderBy
    });
  }

  if (user.role === 'ACADEMIC_DEAN') {
    // See requests approved by head + all for oversight
    return prisma.request.findMany({
      include: INCLUDE,
      orderBy
    });
  }

  // RESOURCE_OFFICER, ADMIN see all
  return prisma.request.findMany({ include: INCLUDE, orderBy });
};

// ── Update request status ───────────────────────────────────────────────────
const updateRequestStatus = async (id, status, role, rejectionReason) => {
  const request = await prisma.request.findUnique({
    where: { id },
    include: { user: true }
  });
  if (!request) throw new Error('Request not found');

  // Validate transitions based on role
  const validTransitions = {
    DEPARTMENT_HEAD: {
      PENDING: ['APPROVED_BY_HEAD', 'REJECTED']
    },
    ACADEMIC_DEAN: {
      APPROVED_BY_HEAD: ['APPROVED_BY_DEAN', 'REJECTED']
    },
    RESOURCE_OFFICER: {
      APPROVED_BY_DEAN: ['APPROVED_BY_OFFICER', 'REJECTED'],
      APPROVED_BY_OFFICER: ['PROCURED', 'COMPLETED']
    },
    ADMIN: {
      PENDING: ['APPROVED_BY_HEAD', 'REJECTED'],
      APPROVED_BY_HEAD: ['APPROVED_BY_DEAN', 'REJECTED'],
      APPROVED_BY_DEAN: ['APPROVED_BY_OFFICER', 'REJECTED'],
      APPROVED_BY_OFFICER: ['PROCURED', 'COMPLETED']
    }
  };

  const allowed = validTransitions[role]?.[request.status];
  if (!allowed || !allowed.includes(status)) {
    throw new Error(`Invalid status transition: ${request.status} → ${status} for role ${role}`);
  }

  const updated = await prisma.request.update({
    where: { id },
    data: {
      status,
      rejectionReason: status === 'REJECTED' ? rejectionReason : undefined
    },
    include: INCLUDE
  });

  // Send notifications based on transition
  if (status === 'APPROVED_BY_HEAD') {
    const deans = await prisma.user.findMany({ where: { role: 'ACADEMIC_DEAN' } });
    for (const dean of deans) {
      await notificationService.create(dean.id, {
        title: 'Request Awaiting Your Approval',
        message: `A new resource request from ${request.user.name} was approved by the Department Head`,
        type: 'ACTION',
        link: '/requests'
      });
    }
  } else if (status === 'APPROVED_BY_DEAN') {
    const officers = await prisma.user.findMany({ where: { role: 'RESOURCE_OFFICER' } });
    for (const officer of officers) {
      await notificationService.create(officer.id, {
        title: 'Request Approved by Dean',
        message: `Resource request from ${request.user.name} is approved for procurement`,
        type: 'ACTION',
        link: '/requests'
      });
    }
  } else if (status === 'REJECTED') {
    await notificationService.create(request.userId, {
      title: 'Request Rejected',
      message: `Your request "${request.description}" was rejected${rejectionReason ? ': ' + rejectionReason : ''}`,
      type: 'WARNING',
      link: '/requests'
    });
  } else if (status === 'PROCURED' || status === 'COMPLETED') {
    await notificationService.create(request.userId, {
      title: status === 'PROCURED' ? 'Resource Procured' : 'Request Completed',
      message: `Your request "${request.description}" has been ${status.toLowerCase()}`,
      type: 'SUCCESS',
      link: '/requests'
    });
  }

  return updated;
};

// ── Get single request ──────────────────────────────────────────────────────
const getRequestById = async (id) => {
  return prisma.request.findUnique({ where: { id }, include: INCLUDE });
};

module.exports = {
  createRequest,
  getRequestsByRole,
  updateRequestStatus,
  getRequestById
};
