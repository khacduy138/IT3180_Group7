'use strict';

const Decimal = require('decimal.js');

const toMoney = (value) => new Decimal(value || 0).toDecimalPlaces(2).toFixed(2);

const buildItem = ({
  feeType,
  quantity,
  source,
  feeUsageId = null,
  vehicleId = null,
  description,
}) => {
  const normalizedQuantity = new Decimal(quantity);
  const price = new Decimal(feeType.unit_price || 0);

  if (normalizedQuantity.isNegative() || price.isNegative()) {
    throw new Error(`Invalid negative value for fee type ${feeType.id}`);
  }

  return {
    fee_type_id: feeType.id,
    fee_usage_id: feeUsageId,
    vehicle_id: vehicleId,
    quantity: normalizedQuantity.toFixed(2),
    price_snapshot: price.toFixed(2),
    line_total: normalizedQuantity.times(price).toDecimalPlaces(2).toFixed(2),
    source,
    description,
  };
};

const buildInvoiceItems = ({ household, periodFees, feeUsages = [], vehicles = [] }) => {
  const usageByPeriodFeeId = new Map(
    feeUsages.map((usage) => [Number(usage.period_fee_id), usage])
  );
  const items = [];

  for (const periodFee of periodFees) {
    const feeType = periodFee.fee_type;

    if (!feeType || feeType.is_active === false) {
      continue;
    }

    const mode = String(feeType.invoice_generation_mode || 'AUTO').toUpperCase();
    const calculationType = String(feeType.calculation_type || '').toLowerCase();

    if (mode === 'VOLUNTARY' || calculationType === 'voluntary') {
      continue;
    }

    if (mode === 'CONDITIONAL_VEHICLE') {
      const matchingVehicles = vehicles.filter(
        (vehicle) =>
          vehicle.is_active !== false &&
          (!feeType.vehicle_type ||
            String(vehicle.vehicle_type).toLowerCase() ===
              String(feeType.vehicle_type).toLowerCase())
      );

      for (const vehicle of matchingVehicles) {
        items.push(
          buildItem({
            feeType,
            quantity: 1,
            source: 'VEHICLE',
            vehicleId: vehicle.id,
            description: `${feeType.name} - ${vehicle.license_plate}`,
          })
        );
      }
      continue;
    }

    if (mode === 'MANUAL_INPUT' || calculationType === 'per_unit') {
      const usage = usageByPeriodFeeId.get(Number(periodFee.id));
      if (!usage) {
        continue;
      }

      items.push(
        buildItem({
          feeType,
          quantity: usage.quantity,
          source: 'MANUAL_INPUT',
          feeUsageId: usage.id,
          description: usage.note || feeType.name,
        })
      );
      continue;
    }

    if (calculationType === 'per_m2') {
      items.push(
        buildItem({
          feeType,
          quantity: household.square_meters,
          source: 'AUTO',
          description: feeType.name,
        })
      );
      continue;
    }

    if (calculationType === 'fixed') {
      items.push(
        buildItem({
          feeType,
          quantity: 1,
          source: 'AUTO',
          description: feeType.name,
        })
      );
    }
  }

  const totalAmount = items
    .reduce((total, item) => total.plus(item.line_total), new Decimal(0))
    .toDecimalPlaces(2)
    .toFixed(2);

  return { items, totalAmount: toMoney(totalAmount) };
};

module.exports = {
  buildInvoiceItems,
};
