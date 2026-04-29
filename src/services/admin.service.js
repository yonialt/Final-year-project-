const prisma = require('../config/prisma');

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
    totalMaintenance,
    repairDecisions,
    replaceDecisions,
    totalUsers,
    priceCatalog
  ] = await Promise.all([
    prisma.resource.count(),
    prisma.resource.count({ where: { status: 'AVAILABLE' } }),
    prisma.resource.count({ where: { status: 'DAMAGED' } }),
    prisma.resource.count({ where: { status: 'DISPOSED' } }),
    prisma.request.count(),
    prisma.request.count({ where: { status: 'PENDING' } }),
    prisma.request.count({ where: { status: 'COMPLETED' } }),
    prisma.request.count({ where: { status: 'REJECTED' } }),
    prisma.maintenance.count(),
    prisma.maintenance.count({ where: { aiDecision: 'REPAIR' } }),
    prisma.maintenance.count({ where: { aiDecision: 'REPLACE' } }),
    prisma.user.count(),
    prisma.priceCatalog.findMany()
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
    maintenance: {
      total: totalMaintenance,
      repairDecisions,
      replaceDecisions,
      avgRepairCost: repairAgg._avg.repairCost || 0,
      avgConfidence: repairAgg._avg.aiConfidence || 0,
      totalRepairCost: repairAgg._sum.repairCost || 0
    },
    users: { total: totalUsers },
    resourcesByType: resourcesByType.map(r => ({ type: r.type, count: r._count.type })),
    requestsByDay: Object.values(requestsByDay).sort((a, b) => a.date.localeCompare(b.date)),
    priceCatalog
  };
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getAnalyticsStats };
