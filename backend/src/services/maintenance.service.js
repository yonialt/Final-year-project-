const prisma = require('../config/prisma');
const pricingService = require('./pricing.service');
const notificationService = require('./notification.service');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const CATEGORY_LIFESPAN = {
  'Desktop Computer': 6,
  'Laptop': 5,
  'Projector': 8,
  'Laboratory Equipment': 10,
  'Printer / Copier': 5,
  'Furniture': 12,
  'Network Equipment': 7,
  'Audio/Visual Equipment': 7
};

const mapResourceToCategory = (resource) => {
  const type = (resource.type || '').toUpperCase();
  const name = (resource.name || '').toLowerCase();
  if (type === 'FURNITURE' || name.includes('chair') || name.includes('desk')) return 'Furniture';
  if (name.includes('projector') || name.includes('epson')) return 'Projector';
  if (name.includes('laptop') || name.includes('elitebook') || name.includes('thinkpad')) return 'Laptop';
  if (type === 'LAB_EQUIPMENT') return 'Laboratory Equipment';
  if (type === 'PRINTING') return 'Printer / Copier';
  if (type === 'NETWORKING') return 'Network Equipment';
  if (name.includes('tv') || name.includes('speaker') || name.includes('camera')) return 'Audio/Visual Equipment';
  if (type === 'ELECTRONICS') return 'Desktop Computer';
  return 'Desktop Computer';
};

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
const submitInspection = async (id, { damageLevel, inspectionNotes }) => {
  const maintenance = await prisma.maintenance.findUnique({
    where: { id },
    include: { resource: true, damageReport: true }
  });
  if (!maintenance) throw new Error('Maintenance task not found');

  // Calculate asset age
  const purchaseYear = new Date(maintenance.resource.purchaseDate).getFullYear();
  const age = new Date().getFullYear() - purchaseYear;

  const assetCategory = mapResourceToCategory(maintenance.resource);
  const expectedLifespan = CATEGORY_LIFESPAN[assetCategory] || 8;
  const usageCount = await prisma.request.count({
    where: { resourceId: maintenance.resourceId, status: 'COMPLETED' }
  });

  // Get current market price from simulated e-commerce API (pricing service)
  const pricing = await pricingService.getMarketPrice(maintenance.resource.type);
  const newPrice = pricing.newPrice;

  // Calculate repair cost based on damage level: Level 1 (15%), Level 2 (35%), Level 3 (65%)
  let multiplier = 0.15;
  if (Number(damageLevel) === 2) {
    multiplier = 0.35;
  } else if (Number(damageLevel) === 3) {
    multiplier = 0.65;
  }
  const calculatedRepairCost = parseFloat((newPrice * multiplier).toFixed(2));

  // ── Call SRMS AI module (FastAPI) ──────────────────────────────────────
  let aiResult;
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/v1/asset/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset_id: maintenance.resourceId.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) >>> 0, 0) || 1,
        asset_name: maintenance.resource.name,
        asset_category: assetCategory,
        damage_score: Number(damageLevel) / 3,
        damage_type: 'physical',
        asset_age_years: age,
        expected_lifespan_years: expectedLifespan,
        usage_count: usageCount,
        estimated_repair_cost: calculatedRepairCost,
        technician_notes: inspectionNotes || '',
        reported_by_user_id: 1
      })
    });
    if (!response.ok) throw new Error(`AI service returned ${response.status}`);
    const body = await response.json();
    aiResult = {
      decision: body.decision.toUpperCase(),
      confidence: body.confidence,
      cost_ratio: calculatedRepairCost / (newPrice || 1),
      method: 'random_forest',
      explanation: body.explanation,
      metrics: {
        repair_probability: body.repair_probability,
        replace_probability: body.replace_probability,
        triggered_rule: body.triggered_rule
      }
    };
  } catch (err) {
    console.warn('[AI Service] FastAPI module unavailable, using fallback:', err.message);
    aiResult = fallbackAI(Number(damageLevel), calculatedRepairCost, newPrice, age);
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
        repair_cost: calculatedRepairCost,
        new_price: newPrice,
        asset_age: age,
        asset_category: assetCategory,
        explanation: aiResult.explanation || null
      },
      metrics: aiResult.metrics || {}
    }
  });

  // Update maintenance record
  const updated = await prisma.maintenance.update({
    where: { id },
    data: {
      damageLevel: Number(damageLevel),
      repairCost: calculatedRepairCost,
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
    // Mark old resource as unassigned
    await prisma.resource.update({
      where: { id: maintenance.resourceId },
      data: { userId: null }
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
