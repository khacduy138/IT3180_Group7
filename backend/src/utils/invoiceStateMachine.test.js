'use strict';

const {
  STATUSES,
  canTransition,
  getNewStatus,
} = require('./invoiceStateMachine');

describe('invoiceStateMachine', () => {
  describe('statuses', () => {
    test('defines PENDING, PARTIAL, and PAID', () => {
      expect(STATUSES).toEqual({
        PENDING: 'PENDING',
        PARTIAL: 'PARTIAL',
        PAID: 'PAID',
      });
    });
  });

  describe('canTransition', () => {
    test.each([
      [STATUSES.PENDING, STATUSES.PENDING],
      [STATUSES.PENDING, STATUSES.PARTIAL],
      [STATUSES.PENDING, STATUSES.PAID],
      [STATUSES.PARTIAL, STATUSES.PARTIAL],
      [STATUSES.PARTIAL, STATUSES.PAID],
      [STATUSES.PAID, STATUSES.PAID],
    ])('allows %s -> %s', (fromStatus, toStatus) => {
      expect(canTransition(fromStatus, toStatus)).toBe(true);
    });

    test.each([
      [STATUSES.PAID, STATUSES.PARTIAL],
      [STATUSES.PAID, STATUSES.PENDING],
      [STATUSES.PARTIAL, STATUSES.PENDING],
    ])('rejects %s -> %s', (fromStatus, toStatus) => {
      expect(canTransition(fromStatus, toStatus)).toBe(false);
    });
  });

  describe('getNewStatus', () => {
    test('returns PENDING when total paid is zero', () => {
      expect(getNewStatus(100, 0)).toBe(STATUSES.PENDING);
    });

    test('returns PARTIAL for a partial payment', () => {
      expect(getNewStatus(100, 40)).toBe(STATUSES.PARTIAL);
    });

    test('returns PAID for an exact full payment', () => {
      expect(getNewStatus(100, 100)).toBe(STATUSES.PAID);
    });

    test('returns PAID for an overpayment', () => {
      expect(getNewStatus(100, 120)).toBe(STATUSES.PAID);
    });
  });
});
