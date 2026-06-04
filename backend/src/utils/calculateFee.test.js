'use strict';

const calculateFee = require('./calculateFee');

describe('calculateFee', () => {
  describe('per_m2 fee', () => {
    test('calculates fee based on unit price and apartment area', () => {
      const result = calculateFee('per_m2', '15000', '72.5');

      expect(result).toBe('1087500.00');
    });

    test('requires apartment area', () => {
      expect(() => calculateFee('per_m2', '15000')).toThrow(
        'Area is required for per_m2 fee calculation'
      );
    });
  });

  describe('fixed fee', () => {
    test('returns the fixed unit price', () => {
      const result = calculateFee('fixed', '100000');

      expect(result).toBe('100000.00');
    });
  });

  describe('voluntary fee', () => {
    test('does not automatically charge voluntary contributions', () => {
      const result = calculateFee('voluntary', '50000');

      expect(result).toBe('0.00');
    });
  });

  describe('validation', () => {
    test('rejects negative unit price', () => {
      expect(() => calculateFee('fixed', '-1000')).toThrow(
        'Unit price cannot be negative'
      );
    });

    test('rejects unsupported fee calculation type', () => {
      expect(() => calculateFee('unknown', '1000')).toThrow(
        'Unsupported fee calculation type: unknown'
      );
    });
  });
});