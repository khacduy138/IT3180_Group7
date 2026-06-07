'use strict';

const STATUSES = Object.freeze({
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
});

const ALLOWED_TRANSITIONS = {
  [STATUSES.PENDING]: new Set([
    STATUSES.PENDING,
    STATUSES.PARTIAL,
    STATUSES.PAID,
  ]),
  [STATUSES.PARTIAL]: new Set([
    STATUSES.PARTIAL,
    STATUSES.PAID,
  ]),
  [STATUSES.PAID]: new Set([
    STATUSES.PAID,
  ]),
};

const canTransition = (fromStatus, toStatus) =>
  Boolean(ALLOWED_TRANSITIONS[fromStatus]?.has(toStatus));

const getNewStatus = (totalAmount, totalPaid) => {
  if (totalPaid <= 0) {
    return STATUSES.PENDING;
  }

  if (totalPaid < totalAmount) {
    return STATUSES.PARTIAL;
  }

  return STATUSES.PAID;
};

module.exports = {
  STATUSES,
  canTransition,
  getNewStatus,
};
