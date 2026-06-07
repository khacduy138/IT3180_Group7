'use strict';

const { buildInvoiceItems } = require('./invoiceGeneration');

const fee = (overrides) => ({
  id: 1,
  name: 'Fee',
  unit_price: '1000.00',
  is_active: true,
  invoice_generation_mode: 'AUTO',
  calculation_type: 'fixed',
  vehicle_type: null,
  ...overrides,
});

describe('buildInvoiceItems', () => {
  test('calculates fixed and per-square-meter fees with decimal-safe totals', () => {
    const result = buildInvoiceItems({
      household: { square_meters: '72.50' },
      periodFees: [
        { id: 10, fee_type: fee({ id: 1 }) },
        {
          id: 11,
          fee_type: fee({
            id: 2,
            name: 'Service fee',
            calculation_type: 'per_m2',
            unit_price: '15000.00',
          }),
        },
      ],
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[1]).toMatchObject({
      quantity: '72.50',
      price_snapshot: '15000.00',
      line_total: '1087500.00',
      source: 'AUTO',
    });
    expect(result.totalAmount).toBe('1088500.00');
  });

  test('creates one vehicle item for each active matching vehicle', () => {
    const result = buildInvoiceItems({
      household: { square_meters: '50.00' },
      periodFees: [
        {
          id: 20,
          fee_type: fee({
            id: 3,
            name: 'Car parking',
            unit_price: '1200000.00',
            invoice_generation_mode: 'CONDITIONAL_VEHICLE',
            vehicle_type: 'car',
          }),
        },
      ],
      vehicles: [
        { id: 7, vehicle_type: 'car', license_plate: '30A-12345', is_active: true },
        { id: 8, vehicle_type: 'motorcycle', license_plate: '29B-12345', is_active: true },
        { id: 9, vehicle_type: 'car', license_plate: '30A-99999', is_active: false },
      ],
    });

    expect(result.items).toEqual([
      expect.objectContaining({
        vehicle_id: 7,
        quantity: '1.00',
        line_total: '1200000.00',
        source: 'VEHICLE',
      }),
    ]);
  });

  test('uses FeeUsage quantity and reference for manual usage fees', () => {
    const result = buildInvoiceItems({
      household: { square_meters: '50.00' },
      periodFees: [
        {
          id: 30,
          fee_type: fee({
            id: 4,
            name: 'Electricity',
            calculation_type: 'per_unit',
            unit_price: '3500.00',
            invoice_generation_mode: 'MANUAL_INPUT',
          }),
        },
      ],
      feeUsages: [
        { id: 15, period_fee_id: 30, quantity: '12.50', note: 'Meter usage' },
      ],
    });

    expect(result.items[0]).toMatchObject({
      fee_usage_id: 15,
      quantity: '12.50',
      line_total: '43750.00',
      source: 'MANUAL_INPUT',
      description: 'Meter usage',
    });
  });
});
