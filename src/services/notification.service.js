const prisma = require('../config/prisma');

/**
 * Notification Service
 */

const create = async (userId, { title, message, type = 'INFO', link = null }) => {
  return prisma.notification.create({
    data: { userId, title, message, type, link }
  });
};

const getByUser = async (userId) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
};

const getUnreadCount = async (userId) => {
  return prisma.notification.count({
    where: { userId, read: false }
  });
};

const markAsRead = async (id, userId) => {
  return prisma.notification.update({
    where: { id },
    data: { read: true }
  });
};

const markAllRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true }
  });
};

module.exports = { create, getByUser, getUnreadCount, markAsRead, markAllRead };
