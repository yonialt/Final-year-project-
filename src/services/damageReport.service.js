const prisma = require('../config/prisma');
const notificationService = require('./notification.service');

/**
 * Damage Report Service
 * Flow: STAFF → DEPARTMENT_HEAD → RESOURCE_OFFICER → TECHNICIAN → AI → Decision
 */

const INCLUDE = {
  user: { select: { id: true, name: true, email: true, department: true, role: true } },
  resource: true,
  maintenance: {
    include: {
      technician: { select: { id: true, name: true, email: true } }
    }
  },
  aiRecommendation: true
};

// ── Create damage report (STAFF) ────────────────────────────────────────────
const createDamageReport = async (userId, data) => {
  const report = await prisma.damageReport.create({
    data: {
      userId,
      resourceId: data.resourceId,
      description: data.description,
      location: data.location,
      status: 'PENDING'
    },
    include: INCLUDE
  });

  // Mark the resource as DAMAGED
  await prisma.resource.update({
    where: { id: data.resourceId },
    data: { status: 'DAMAGED' }
  });

  // Notify department heads in the same department
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const deptHeads = await prisma.user.findMany({
    where: { role: 'DEPARTMENT_HEAD', department: user.department }
  });
  for (const head of deptHeads) {
    await notificationService.create(head.id, {
      title: 'New Damage Report',
      message: `${user.name} reported damage to ${report.resource.name}`,
      type: 'ACTION',
      link: '/damage-reports'
    });
  }

  return report;
};

// ── Get damage reports by role ──────────────────────────────────────────────
const getDamageReportsByRole = async (user) => {
  const orderBy = { updatedAt: 'desc' };

  if (user.role === 'STAFF') {
    return prisma.damageReport.findMany({
      where: { userId: user.id },
      include: INCLUDE,
      orderBy
    });
  }

  if (user.role === 'DEPARTMENT_HEAD') {
    return prisma.damageReport.findMany({
      where: { user: { department: user.department } },
      include: INCLUDE,
      orderBy
    });
  }

  // RESOURCE_OFFICER, ACADEMIC_DEAN, ADMIN see all
  return prisma.damageReport.findMany({ include: INCLUDE, orderBy });
};

// ── Get single report ───────────────────────────────────────────────────────
const getDamageReportById = async (id) => {
  return prisma.damageReport.findUnique({ where: { id }, include: INCLUDE });
};

// ── Forward to Resource Officer (DEPARTMENT_HEAD) ───────────────────────────
const forwardToOfficer = async (id, userId) => {
  const report = await prisma.damageReport.update({
    where: { id },
    data: { status: 'FORWARDED_TO_OFFICER' },
    include: INCLUDE
  });

  // Notify all resource officers
  const officers = await prisma.user.findMany({ where: { role: 'RESOURCE_OFFICER' } });
  for (const officer of officers) {
    await notificationService.create(officer.id, {
      title: 'Damage Report Forwarded',
      message: `A damage report for ${report.resource.name} requires your attention`,
      type: 'ACTION',
      link: '/damage-reports'
    });
  }

  return report;
};

// ── Update status (generic) ─────────────────────────────────────────────────
const updateStatus = async (id, status) => {
  return prisma.damageReport.update({
    where: { id },
    data: { status },
    include: INCLUDE
  });
};

module.exports = {
  createDamageReport,
  getDamageReportsByRole,
  getDamageReportById,
  forwardToOfficer,
  updateStatus
};
