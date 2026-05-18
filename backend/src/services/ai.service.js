/**
 * AI Decision Support Service (Simulated Random Forest Classifier)
 */

/**
 * Predicts whether to REPAIR or REPLACE a resource.
 * Heuristic based on Random Forest weights.
 * 
 * @param {Object} data 
 * @param {number} data.damageLevel - 1 (Minor) to 3 (Severe)
 * @param {number} data.repairCost 
 * @param {number} data.newPrice 
 * @param {number} data.age - Asset age in years
 * @returns {Object} { decision: 'REPAIR'|'REPLACE', confidence: number, costRatio: number, metrics: Object }
 */
const getRepairReplaceDecision = ({ damageLevel, repairCost, newPrice, age }) => {
  const costRatio = repairCost / newPrice;
  
  // Weights (Simulating Random Forest Feature Importance)
  const weights = {
    costRatio: 0.55,
    damageLevel: 0.25,
    age: 0.20
  };

  // Normalized scores (0 to 1)
  const scores = {
    costRatio: Math.min(costRatio / 0.7, 1), // Threshold at 70% cost
    damageLevel: damageLevel / 3,
    age: Math.min(age / 8, 1) // Threshold at 8 years
  };

  // Weighted sum
  const weightedSum = (scores.costRatio * weights.costRatio) + 
                      (scores.damageLevel * weights.damageLevel) + 
                      (scores.age * weights.age);

  let decision = 'REPAIR';
  let confidence = 0.85;

  // Primary Branch
  if (weightedSum > 0.58) {
    decision = 'REPLACE';
    confidence = Math.min(0.7 + (weightedSum - 0.58), 0.99);
  } else {
    decision = 'REPAIR';
    confidence = Math.min(0.7 + (0.58 - weightedSum), 0.99);
  }

  // Edge Case Rule (Overrides)
  if (damageLevel === 3 && costRatio > 0.4) {
    decision = 'REPLACE';
    confidence = 0.95;
  }

  return { 
    decision, 
    confidence, 
    costRatio,
    weightedSum,
    metrics: {
      efficiencyScore: (1 - weightedSum).toFixed(2),
      viabilityIndex: (scores.age * 100).toFixed(0)
    }
  };
};

/**
 * Predictive maintenance for future replacement.
 */
const getReplacementPrediction = ({ purchaseDate, maintenanceCount, totalRepairCost }) => {
  const age = new Date().getFullYear() - new Date(purchaseDate).getFullYear();
  
  if (age > 8 || maintenanceCount > 4 || totalRepairCost > 1500) {
    return { decision: 'REPLACE', recommendation: 'Predictive models suggest terminal asset failure within 6 months.' };
  }
  
  return { decision: 'KEEP', recommendation: 'Asset performance remains within optimal operational parameters.' };
};

module.exports = {
  getRepairReplaceDecision,
  getReplacementPrediction
};
