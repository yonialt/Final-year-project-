const prisma = require('../config/prisma');
const pricingService = require('./pricing.service');
const notificationService = require('./notification.service');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

const INCLUDE = {
  resource: true,
  technician: { select: { id: true, name: true, email: true, role: true } },
  damageReport: {
    include: {
      user: { select: { id: true, name: true, email: true, department: true, role: true } }
    }
  }
};

// ── Get all maintenance tasks (filtered by role) ────────────────────────────
const getAllMaintenance = async (user) => {
  const where = user.role === 'TECHNICIAN' ? { technicianId: user.id } : {};
  return prisma.maintenance.findMany({
    where,
    include: INCLUDE,
    orderBy: { updatedAt: 'desc' }
  });
};

// ── Get single task ─────────────────────────────────────────────────────────
const getMaintenanceById = async (id) => {
  return prisma.maintenance.findUnique({ where: { id }, include: INCLUDE });
};

// ── Assign technician (RESOURCE_OFFICER) ────────────────────────────────────
const assignTechnician = async (damageReportId, technicianId) => {
  const report = await prisma.damageReport.findUnique({
    where: { id: damageReportId },
    include: { resource: true }
  });
  if (!report) throw new Error('Damage report not found');

  // Update damage report status
  await prisma.damageReport.update({
    where: { id: damageReportId },
    data: { status: 'INSPECTION_ASSIGNED' }
  });

  // Create maintenance task
  const maintenance = await prisma.maintenance.create({
    data: {
      damageReportId,
      resourceId: report.resourceId,
      technicianId,
      status: 'PENDING_INSPECTION'
    },
    include: INCLUDE
  });

  // Notify technician
  await notificationService.create(technicianId, {
    title: 'New Inspection Assignment',
    message: `You have been assigned to inspect "${report.resource.name}" at ${report.resource.location}`,
    type: 'ACTION',
    link: '/maintenance'
  });

  return maintenance;
};

// ── Submit inspection data (TECHNICIAN) ─────────────────────────────────────
const submitInspection = async (id, { damageLevel, repairCost, inspectionNotes }) => {
  const maintenance = await prisma.maintenance.findUnique({
    where: { id },
    include: { resource: true, damageReport: true }
  });
  if (!maintenance) throw new Error('Maintenance task not found');

  // Calculate asset age
  const purchaseYear = new Date(maintenance.resource.purchaseDate).getFullYear();
  const age = new Date().getFullYear() - purchaseYear;

  // Fetch market price from e-commerce API mock
  const { newPrice } = await pricingService.getMarketPrice(maintenance.resource.type);

  // ── Call Python AI Microservice ────────────────────────────────────────
  let aiResult;
  try {
    const response = await fetch(`${AI_SERVICE_URL}/ai/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        damage_level: Number(damageLevel),
        repair_cost: Number(repairCost),
        new_price: newPrice,
        asset_age: age
      })
    });
    aiResult = await response.json();
  } catch (err) {
    console.warn('[AI Service] Python service unavailable, using fallback:', err.message);
    // Fallback to inline heuristic
    aiResult = fallbackAI(Number(damageLevel), Number(repairCost), newPrice, age);
  }

  // Save AI recommendation record
  await prisma.aIRecommendation.create({
    data: {
      damageReportId: maintenance.damageReportId,
      decision: aiResult.decision,
      confidence: aiResult.confidence,
      costRatio: aiResult.cost_ratio,
      method: aiResult.method || 'heuristic_fallback',
      inputData: {
        damage_level: Number(damageLevel),
        repair_cost: Number(repairCost),
        new_price: newPrice,
        asset_age: age
      },
      metrics: aiResult.metrics || {}
    }
  });

  // Update maintenance record
  const updated = await prisma.maintenance.update({
    where: { id },
    data: {
      damageLevel: Number(damageLevel),
      repairCost: Number(repairCost),
      inspectionNotes,
      inspectedAt: new Date(),
      newPrice,
      age,
      aiDecision: aiResult.decision,
      aiConfidence: aiResult.confidence,
      aiMethod: aiResult.method || 'heuristic_fallback',
      status: 'AI_DECIDED'
    },
    include: INCLUDE
  });

  // Update damage report status
  await prisma.damageReport.update({
    where: { id: maintenance.damageReportId },
    data: { status: 'AI_RECOMMENDED' }
  });

  // Notify resource officers
  const officers = await prisma.user.findMany({ where: { role: 'RESOURCE_OFFICER' } });
  for (const officer of officers) {
    await notificationService.create(officer.id, {
      title: `AI Recommends: ${aiResult.decision}`,
      message: `Inspection complete for "${maintenance.resource.name}". AI confidence: ${Math.round(aiResult.confidence * 100)}%`,
      type: 'ACTION',
      link: '/maintenance'
    });
  }

  return updated;
};

// ── Finalize decision (RESOURCE_OFFICER) ────────────────────────────────────
const finalizeDecision = async (id, finalDecision, officerNotes) => {
  const maintenance = await prisma.maintenance.update({
    where: { id },
    data: {
      finalDecision,
      officerNotes,
      status: finalDecision === 'REPAIR' ? 'REPAIR_IN_PROGRESS' : 'COMPLETED'
    },
    include: INCLUDE
  });

  // Update damage report
  const drStatus = finalDecision === 'REPAIR' ? 'REPAIR_ASSIGNED' : 'REPLACED';
  await prisma.damageReport.update({
    where: { id: maintenance.damageReportId },
    data: { status: drStatus }
  });

  if (finalDecision === 'REPLACE') {
    // Mark old resource as DISPOSED
    await prisma.resource.update({
      where: { id: maintenance.resourceId },
      data: { status: 'DISPOSED' }
    });

    // Notify the reporter
    await notificationService.create(maintenance.damageReport.userId, {
      title: 'Resource Replacement Approved',
      message: `"${maintenance.resource.name}" will be replaced. The old asset has been disposed.`,
      type: 'SUCCESS',
      link: '/damage-reports'
    });
  } else {
    // Notify technician for repair
    await notificationService.create(maintenance.technicianId, {
      title: 'Repair Assignment',
      message: `You have been assigned to repair "${maintenance.resource.name}"`,
      type: 'ACTION',
      link: '/maintenance'
    });
  }

  return maintenance;
};

// ── Complete repair (TECHNICIAN) ────────────────────────────────────────────
const completeRepair = async (id, repairNotes) => {
  const maintenance = await prisma.maintenance.update({
    where: { id },
    data: {
      repairNotes,
      repairedAt: new Date(),
      status: 'COMPLETED'
    },
    include: INCLUDE
  });

  // Mark resource as AVAILABLE again
  await prisma.resource.update({
    where: { id: maintenance.resourceId },
    data: { status: 'AVAILABLE' }
  });

  // Update damage report
  await prisma.damageReport.update({
    where: { id: maintenance.damageReportId },
    data: { status: 'REPAIR_COMPLETED' }
  });

  // Notify reporter
  await notificationService.create(maintenance.damageReport.userId, {
    title: 'Repair Completed',
    message: `"${maintenance.resource.name}" has been repaired and is available again.`,
    type: 'SUCCESS',
    link: '/damage-reports'
  });

  // Notify officers
  const officers = await prisma.user.findMany({ where: { role: 'RESOURCE_OFFICER' } });
  for (const officer of officers) {
    await notificationService.create(officer.id, {
      title: 'Repair Completed',
      message: `${maintenance.technician.name} completed repair of "${maintenance.resource.name}"`,
      type: 'INFO',
      link: '/maintenance'
    });
  }

  return maintenance;
};

// ── Heuristic fallback (when Python AI service is down) ─────────────────────
function fallbackAI(damageLevel, repairCost, newPrice, age) {
  const costRatio = repairCost / newPrice;
  const weights = { costRatio: 0.55, damageLevel: 0.25, age: 0.20 };
  const scores = {
    costRatio: Math.min(costRatio / 0.7, 1),
    damageLevel: damageLevel / 3,
    age: Math.min(age / 8, 1)
  };
  const weightedSum = (scores.costRatio * weights.costRatio) +
                      (scores.damageLevel * weights.damageLevel) +
                      (scores.age * weights.age);

  let decision = 'REPAIR';
  let confidence = 0.85;

  if (weightedSum > 0.58) {
    decision = 'REPLACE';
    confidence = Math.min(0.7 + (weightedSum - 0.58), 0.99);
  } else {
    confidence = Math.min(0.7 + (0.58 - weightedSum), 0.99);
  }

  if (damageLevel === 3 && costRatio > 0.4) {
    decision = 'REPLACE';
    confidence = 0.95;
  }

  return {
    decision,
    confidence,
    cost_ratio: costRatio,
    method: 'heuristic_fallback',
    metrics: {
      efficiency_score: (1 - costRatio).toFixed(2),
      viability_index: Math.max(0, 100 - (age / 10) * 100).toFixed(0),
      risk_level: damageLevel === 3 ? 'HIGH' : damageLevel === 2 ? 'MEDIUM' : 'LOW'
    }
  };
}

module.exports = {
  getAllMaintenance,
  getMaintenanceById,
  assignTechnician,
  submitInspection,
  finalizeDecision,
  completeRepair
};
