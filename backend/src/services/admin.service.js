const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

const SALT_ROUNDS = 10;

/**
 * Admin creates a new user with a default password.
 * The user will be required to change the password on first login.
 */
const createUser = async ({ name, email, password, role, department }) => {
  // Check for existing account
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email is already in use');
    err.statusCode = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  return await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      mustChangePassword: true,
      ...(role && { role }),
      ...(department && { department }),
    },
    select: { id: true, name: true, email: true, role: true, department: true, createdAt: true },
  });
};


const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, department: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
};

const getUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, department: true, createdAt: true }
  });
};

const updateUser = async (id, data) => {
  return await prisma.user.update({
    where: { id },
    data: { role: data.role, department: data.department },
    select: { id: true, name: true, email: true, role: true, department: true, createdAt: true }
  });
};

const deleteUser = async (id) => {
  return await prisma.user.delete({ where: { id } });
};

const getAnalyticsStats = async () => {
  const [
    totalResources,
    availableResources,
    damagedResources,
    disposedResources,
    totalRequests,
    pendingRequests,
    completedRequests,
    rejectedRequests,
    totalDamageReports,
    pendingDamageReports,
    totalMaintenance,
    repairDecisions,
    replaceDecisions,
    completedMaintenance,
    totalUsers,
    priceCatalog,
    totalAiRecommendations
  ] = await Promise.all([
    prisma.resource.count(),
    prisma.resource.count({ where: { status: 'AVAILABLE' } }),
    prisma.resource.count({ where: { status: 'DAMAGED' } }),
    prisma.resource.count({ where: { status: 'DISPOSED' } }),
    prisma.request.count(),
    prisma.request.count({ where: { status: 'PENDING' } }),
    prisma.request.count({ where: { status: 'COMPLETED' } }),
    prisma.request.count({ where: { status: 'REJECTED' } }),
    prisma.damageReport.count(),
    prisma.damageReport.count({ where: { status: 'PENDING' } }),
    prisma.maintenance.count(),
    prisma.maintenance.count({ where: { aiDecision: 'REPAIR' } }),
    prisma.maintenance.count({ where: { aiDecision: 'REPLACE' } }),
    prisma.maintenance.count({ where: { status: 'COMPLETED' } }),
    prisma.user.count(),
    prisma.priceCatalog.findMany(),
    prisma.aIRecommendation.count()
  ]);

  // Avg repair cost
  const repairAgg = await prisma.maintenance.aggregate({
    _avg: { repairCost: true, aiConfidence: true },
    _sum: { repairCost: true }
  });

  // Resources by type
  const resourcesByType = await prisma.resource.groupBy({
    by: ['type'],
    _count: { type: true }
  });

  // Requests over last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentRequests = await prisma.request.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true, status: true, type: true }
  });

  // Group recent requests by day
  const requestsByDay = {};
  recentRequests.forEach(r => {
    const day = r.createdAt.toISOString().split('T')[0];
    if (!requestsByDay[day]) requestsByDay[day] = { date: day, count: 0, damage: 0, new: 0 };
    requestsByDay[day].count += 1;
    if (r.type === 'DAMAGE_REPORT') requestsByDay[day].damage += 1;
    if (r.type === 'NEW_RESOURCE') requestsByDay[day].new += 1;
  });

  // Recent damage reports
  const recentDamageReports = await prisma.damageReport.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true, status: true }
  });
  const damageByDay = {};
  recentDamageReports.forEach(r => {
    const day = r.createdAt.toISOString().split('T')[0];
    if (!damageByDay[day]) damageByDay[day] = { date: day, count: 0 };
    damageByDay[day].count += 1;
  });

  // Recent AI recommendations
  const recentAI = await prisma.aIRecommendation.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      damageReport: {
        include: { resource: { select: { name: true, type: true } } }
      }
    }
  });

  return {
    resources: {
      total: totalResources,
      available: availableResources,
      damaged: damagedResources,
      disposed: disposedResources
    },
    requests: {
      total: totalRequests,
      pending: pendingRequests,
      completed: completedRequests,
      rejected: rejectedRequests
    },
    damageReports: {
      total: totalDamageReports,
      pending: pendingDamageReports
    },
    maintenance: {
      total: totalMaintenance,
      completed: completedMaintenance,
      repairDecisions,
      replaceDecisions,
      avgRepairCost: repairAgg._avg.repairCost || 0,
      avgConfidence: repairAgg._avg.aiConfidence || 0,
      totalRepairCost: repairAgg._sum.repairCost || 0
    },
    ai: {
      totalRecommendations: totalAiRecommendations,
      recentDecisions: recentAI
    },
    users: { total: totalUsers },
    resourcesByType: resourcesByType.map(r => ({ type: r.type, count: r._count.type })),
    requestsByDay: Object.values(requestsByDay).sort((a, b) => a.date.localeCompare(b.date)),
    damageReportsByDay: Object.values(damageByDay).sort((a, b) => a.date.localeCompare(b.date)),
    priceCatalog
  };
};

/**
 * System-level stats for the Admin dashboard.
 * Returns user directory, role breakdown, KPI counters, recent users & activity.
 */
const getSystemStats = async () => {
  const [
    users,
    totalResources,
    totalRequests,
    activeRequests,
    totalDamageReports,
    pendingDamageReports,
    totalMaintenance,
    completedMaintenance,
    recentNotifications,
  ] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, department: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.resource.count(),
    prisma.request.count(),
    prisma.request.count({ where: { status: { notIn: ['COMPLETED', 'REJECTED'] } } }),
    prisma.damageReport.count(),
    prisma.damageReport.count({ where: { status: { notIn: ['CLOSED', 'REPAIR_COMPLETED', 'REPLACED'] } } }),
    prisma.maintenance.count(),
    prisma.maintenance.count({ where: { status: 'COMPLETED' } }),
    prisma.notification.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, message: true, type: true, createdAt: true, user: { select: { name: true, role: true } } },
    }),
  ]);

  // Role distribution
  const roleDistribution = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  // Recent users (joined in the last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = users.filter(u => new Date(u.createdAt) >= thirtyDaysAgo);

  return {
    users,
    totalUsers: users.length,
    roleDistribution,
    recentUsersCount: recentUsers.length,
    kpis: {
      totalResources,
      totalRequests,
      activeRequests,
      totalDamageReports,
      pendingDamageReports,
      totalMaintenance,
      completedMaintenance,
    },
    recentActivity: recentNotifications,
  };
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser, getAnalyticsStats, getSystemStats };
