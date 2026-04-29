const pricingService = require('../services/pricing.service');

const getPricingForType = async (req, res, next) => {
  try {
    const { resourceType } = req.params;
    const priceData = await pricingService.getMarketPrice(resourceType);
    res.json({ data: priceData });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPricingForType
};
