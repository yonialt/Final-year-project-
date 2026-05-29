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


const getAllUsers = async (query = {}) => {
  return await prisma.user.findMany({
    where: query,
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

  const availableResources = 0;
  const damagedResources = 0;
  const disposedResources = 0;

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

const bulkCreateUsers = async (usersList, creator = { role: 'ADMIN' }) => {
  if (!Array.isArray(usersList) || usersList.length === 0) {
    const err = new Error('No user data provided');
    err.statusCode = 400;
    throw err;
  }

  // 1. Gather all emails to check for duplicates in the DB
  const emails = usersList.map(u => (u.email || '').trim().toLowerCase()).filter(Boolean);
  const uniqueEmails = [...new Set(emails)];
  if (uniqueEmails.length !== usersList.length) {
    const err = new Error('The uploaded list contains duplicate emails');
    err.statusCode = 400;
    throw err;
  }

  // 2. Fetch existing users with these emails
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: uniqueEmails } },
    select: { email: true }
  });
  if (existingUsers.length > 0) {
    const existingEmails = existingUsers.map(u => u.email);
    const err = new Error(`The following emails are already in use: ${existingEmails.join(', ')}`);
    err.statusCode = 409;
    throw err;
  }

  // 3. Validate name and email formats
  const errors = [];
  usersList.forEach((u, index) => {
    // Validate Name
    const nameTrimmed = (u.name || '').trim();
    if (!nameTrimmed) {
      errors.push(`Row ${index + 1}: Name is required`);
    } else {
      const parts = nameTrimmed.split(/\s+/);
      if (parts.length < 2) {
        errors.push(`Row ${index + 1} (${nameTrimmed}): Full name must contain both first and last name`);
      }
      if (!/^[a-zA-Z.\s-]+$/.test(nameTrimmed)) {
        errors.push(`Row ${index + 1} (${nameTrimmed}): Name can only contain letters, spaces, dots, and hyphens`);
      }
    }

    // Validate Email
    const emailTrimmed = (u.email || '').trim();
    if (!emailTrimmed) {
      errors.push(`Row ${index + 1}: Email is required`);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errors.push(`Row ${index + 1} (${emailTrimmed}): Invalid email format`);
    } else if (!emailTrimmed.toLowerCase().endsWith('@uog.edu.et')) {
      errors.push(`Row ${index + 1} (${emailTrimmed}): Email must be a university email (@uog.edu.et)`);
    }

    // Validate Role & Creator restrictions
    const role = (u.role || '').toUpperCase();
    const validRoles = ['STAFF', 'DEPARTMENT_HEAD', 'ACADEMIC_DEAN', 'RESOURCE_OFFICER', 'TECHNICIAN', 'ADMIN'];
    if (role && !validRoles.includes(role)) {
      errors.push(`Row ${index + 1}: Invalid role '${role}'`);
    }

    if (creator.role === 'ADMIN') {
      if (role === 'STAFF') {
        errors.push(`Row ${index + 1}: System Admin cannot register Staff members. Staff must be registered by their respective Department Head.`);
      }
    } else if (creator.role === 'DEPARTMENT_HEAD') {
      if (role && role !== 'STAFF') {
        errors.push(`Row ${index + 1}: Department Heads can only register Staff members.`);
      }
    }
  });

  if (errors.length > 0) {
    const err = new Error(errors.join(' | '));
    err.statusCode = 422;
    throw err;
  }

  // 4. Hash passwords concurrently and prepare creations
  const createdUsersInfo = [];
  const operations = await Promise.all(
    usersList.map(async (u) => {
      const firstWord = u.name.trim().split(/\s+/)[0] || 'User';
      const tempPassword = `${firstWord}1234`;
      const hashed = await bcrypt.hash(tempPassword, SALT_ROUNDS);

      const resolvedRole = creator.role === 'DEPARTMENT_HEAD' ? 'STAFF' : (u.role || 'STAFF');
      const resolvedDept = creator.role === 'DEPARTMENT_HEAD' ? creator.department : (u.department || null);

      createdUsersInfo.push({
        name: u.name,
        email: u.email,
        role: resolvedRole,
        department: resolvedDept,
        tempPassword
      });

      return prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          password: hashed,
          role: resolvedRole,
          department: resolvedDept,
          mustChangePassword: true
        }
      });
    })
  );

  // 5. Run atomically in a transaction
  await prisma.$transaction(operations);

  return createdUsersInfo;
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser, getAnalyticsStats, getSystemStats, bulkCreateUsers };
