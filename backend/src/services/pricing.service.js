const prisma = require('../config/prisma');

/**
 * Pricing Service (E-commerce API Integration Simulation)
 */

/**
 * Fetch real-time market pricing for a specific asset category.
 * Logic: Simulates a call to Amazon/eBay/Dell enterprise APIs.
 * 
 * @param {string} resourceType 
 * @returns {Promise<Object>} { repairCost: number, newPrice: number, marketTrend: string }
 */
const getMarketPrice = async (resourceType) => {
  // Simulating network latency for E-commerce API handshake
  console.log(`[E-COMMERCE API] Fetching live market data for category: ${resourceType}...`);
  await new Promise(resolve => setTimeout(resolve, 800));

  const entry = await prisma.priceCatalog.findUnique({
    where: { resourceType }
  });

  // Base prices from catalog or generic fallback
  const baseNewPrice = entry ? entry.newPrice : 1200;
  const baseRepairCost = entry ? entry.repairCost : 250;

  // Add "Market Volatility" (Random fluctuation +/- 5%)
  const volatility = 1 + (Math.random() * 0.1 - 0.05);
  const livePrice = parseFloat((baseNewPrice * volatility).toFixed(2));
  
  return {
    repairCost: baseRepairCost,
    newPrice: livePrice,
    marketTrend: Math.random() > 0.5 ? 'UPWARD' : 'STABLE',
    lastSynced: new Date().toISOString()
  };
};

module.exports = {
  getMarketPrice
};
