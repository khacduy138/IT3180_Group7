'use strict';

const Decimal = require('decimal.js');

const SUPPORTED_FEE_TYPES = ['per_m2', 'fixed', 'voluntary'];

/**
 * Calculate the automatically chargeable amount for a fee type.
 *
 * @param {'per_m2'|'fixed'|'voluntary'} type - Fee calculation type.
 * @param {string|number} unitPrice - Price stored in DECIMAL format.
 * @param {string|number|null} area - Apartment area for per_m2 fees.
 * @returns {string} Calculated amount as an exact decimal string.
 */
function calculateFee(type, unitPrice, area = null) {
  if (!SUPPORTED_FEE_TYPES.includes(type)) {
    throw new Error(`Unsupported fee calculation type: ${type}`);
  }

  const price = new Decimal(unitPrice);

  if (price.isNegative()) {
    throw new Error('Unit price cannot be negative');
  }

  switch (type) {
    case 'per_m2': {
      if (area === null || area === undefined) {
        throw new Error('Area is required for per_m2 fee calculation');
      }

      const apartmentArea = new Decimal(area);

      if (apartmentArea.isNegative()) {
        throw new Error('Area cannot be negative');
      }

      return price.times(apartmentArea).toFixed(2);
    }

    case 'fixed':
      return price.toFixed(2);

    case 'voluntary':
      // Voluntary fees must not be automatically charged.
      return new Decimal(0).toFixed(2);

    default:
      throw new Error(`Unsupported fee calculation type: ${type}`);
  }
}

module.exports = calculateFee;