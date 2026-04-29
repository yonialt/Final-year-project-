const prisma = require('../config/prisma');
const aiService = require('./ai.service');
const pricingService = require('./pricing.service');

const INCLUDE = {
  resource: true,
  technician: { select: { id: true, name: true, email: true, role: true } },
  request: {
    include: {
      user: { select: { id: true, name: true, email: true, department: true, role: true } }
    }
  }
};

const getAllMaintenance = async (user) => {
  // Technicians only see their own; others see all
  const where = user.role === 'TECHNICIAN' ? { technicianId: user.id } : {};
  return await prisma.maintenance.findMany({
    where,
    include: INCLUDE,
    orderBy: { updatedAt: 'desc' }
  });
};

const getMaintenanceById = async (id) => {
  return await prisma.maintenance.findUnique({ where: { id }, include: INCLUDE });
};

const startMaintenance = async (requestId, technicianId) => {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { resource: true }
  });
  if (!request || !request.resourceId) throw new Error('Valid request with resource required');

  // Mark resource as DAMAGED
  await prisma.resource.update({
    where: { id: request.resourceId },
    data: { status: 'DAMAGED' }
  });

  // Update request status to IN_MAINTENANCE
  await prisma.request.update({
    where: { id: requestId },
    data: { status: 'IN_MAINTENANCE' }
  });

  return await prisma.maintenance.create({
    data: { requestId, resourceId: request.resourceId, technicianId },
    include: INCLUDE
  });
};

const inputMaintenanceData = async (id, { damageLevel, repairCost, notes }) => {
  const maintenance = await prisma.maintenance.findUnique({
    where: { id },
    include: { resource: true }
  });
  if (!maintenance) throw new Error('Maintenance record not found');

  const purchaseYear = new Date(maintenance.resource.purchaseDate).getFullYear();
  const age = new Date().getFullYear() - purchaseYear;

  // Fetch live market price for the AI
  const { newPrice } = await pricingService.getMarketPrice(maintenance.resource.type);

  // AI Decision
  const aiResult = aiService.getRepairReplaceDecision({ damageLevel: Number(damageLevel), repairCost: Number(repairCost), newPrice, age });

  return await prisma.maintenance.update({
    where: { id },
    data: {
      damageLevel: Number(damageLevel),
      repairCost: Number(repairCost),
      newPrice,
      age,
      notes,
      aiDecision: aiResult.decision,
      aiConfidence: aiResult.confidence
    },
    include: INCLUDE
  });
};

const finalizeDecision = async (id, finalDecision) => {
  const maintenance = await prisma.maintenance.update({
    where: { id },
    data: { finalDecision },
    include: INCLUDE
  });

  // Mark request as COMPLETED
  await prisma.request.update({
    where: { id: maintenance.requestId },
    data: { status: 'COMPLETED' }
  });

  // If REPLACE: mark old resource DISPOSED
  if (finalDecision === 'REPLACE') {
    await prisma.resource.update({
      where: { id: maintenance.resourceId },
      data: { status: 'DISPOSED' }
    });
  } else {
    // REPAIR: mark resource AVAILABLE again
    await prisma.resource.update({
      where: { id: maintenance.resourceId },
      data: { status: 'AVAILABLE' }
    });
  }

  return maintenance;
};

module.exports = { getAllMaintenance, getMaintenanceById, startMaintenance, inputMaintenanceData, finalizeDecision };
