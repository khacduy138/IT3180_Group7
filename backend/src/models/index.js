const sequelize = require('../config/database');

const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const Household = require('./Household');
const Resident = require('./Resident');
const HouseholdMember = require('./HouseholdMember');
const Vehicle = require('./Vehicle');
const FeeType = require('./FeeType');
const FeeTypePriceHistory = require('./FeeTypePriceHistory');
const FeePeriod = require('./FeePeriod');
const PeriodFee = require('./PeriodFee');
const UtilityInvoice = require('./UtilityInvoice');
const FeeUsage = require('./FeeUsage');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const Payment = require('./Payment');

/* ── Module 1: Auth & RBAC ─────────────────────────────────── */

User.belongsTo(Role, { as: 'role', foreignKey: 'role_id' });
Role.hasMany(User, { as: 'users', foreignKey: 'role_id' });

Role.belongsToMany(Permission, {
  as: 'permissions',
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
});
Permission.belongsToMany(Role, {
  as: 'roles',
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
});

RolePermission.belongsTo(Role, { as: 'role', foreignKey: 'role_id' });
RolePermission.belongsTo(Permission, { as: 'permission', foreignKey: 'permission_id' });
Role.hasMany(RolePermission, { as: 'role_permissions', foreignKey: 'role_id' });
Permission.hasMany(RolePermission, { as: 'role_permissions', foreignKey: 'permission_id' });

/* ── Module 2: Household & Resident ────────────────────────── */

Household.belongsToMany(Resident, {
  as: 'residents',
  through: HouseholdMember,
  foreignKey: 'household_id',
  otherKey: 'resident_id',
});
Resident.belongsToMany(Household, {
  as: 'households',
  through: HouseholdMember,
  foreignKey: 'resident_id',
  otherKey: 'household_id',
});

Household.hasMany(HouseholdMember, { as: 'household_members', foreignKey: 'household_id' });
Resident.hasMany(HouseholdMember, { as: 'household_members', foreignKey: 'resident_id' });
HouseholdMember.belongsTo(Household, { as: 'household', foreignKey: 'household_id' });
HouseholdMember.belongsTo(Resident, { as: 'resident', foreignKey: 'resident_id' });

Household.hasMany(Vehicle, { as: 'vehicles', foreignKey: 'household_id' });
Vehicle.belongsTo(Household, { as: 'household', foreignKey: 'household_id' });

Resident.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
User.hasOne(Resident, { as: 'resident', foreignKey: 'user_id' });

/* ── Module 3: Fee Configuration ───────────────────────────── */

FeePeriod.belongsToMany(FeeType, {
  as: 'fee_types',
  through: PeriodFee,
  foreignKey: 'fee_period_id',
  otherKey: 'fee_type_id',
});
FeeType.belongsToMany(FeePeriod, {
  as: 'fee_periods',
  through: PeriodFee,
  foreignKey: 'fee_type_id',
  otherKey: 'fee_period_id',
});

FeePeriod.hasMany(PeriodFee, { as: 'period_fees', foreignKey: 'fee_period_id' });
FeeType.hasMany(PeriodFee, { as: 'period_fees', foreignKey: 'fee_type_id' });
PeriodFee.belongsTo(FeePeriod, { as: 'fee_period', foreignKey: 'fee_period_id' });
PeriodFee.belongsTo(FeeType, { as: 'fee_type', foreignKey: 'fee_type_id' });

FeeType.hasMany(FeeTypePriceHistory, {
  as: 'price_history',
  foreignKey: 'fee_type_id',
});
FeeTypePriceHistory.belongsTo(FeeType, {
  as: 'fee_type',
  foreignKey: 'fee_type_id',
});
FeeTypePriceHistory.belongsTo(User, {
  as: 'created_by_user',
  foreignKey: 'created_by',
});

UtilityInvoice.belongsTo(FeePeriod, {
  as: 'fee_period',
  foreignKey: 'fee_period_id',
});
UtilityInvoice.belongsTo(Household, {
  as: 'household',
  foreignKey: 'household_id',
});
FeePeriod.hasMany(UtilityInvoice, {
  as: 'utility_invoices',
  foreignKey: 'fee_period_id',
});
Household.hasMany(UtilityInvoice, {
  as: 'utility_invoices',
  foreignKey: 'household_id',
});

/* ── Module 4: Billing & Payment ───────────────────────────── */

FeeUsage.belongsTo(Household, { as: 'household', foreignKey: 'household_id' });
FeeUsage.belongsTo(PeriodFee, { as: 'period_fee', foreignKey: 'period_fee_id' });
FeeUsage.belongsTo(User, { as: 'entered_by_user', foreignKey: 'entered_by' });
Household.hasMany(FeeUsage, { as: 'fee_usages', foreignKey: 'household_id' });
PeriodFee.hasMany(FeeUsage, { as: 'fee_usages', foreignKey: 'period_fee_id' });

Invoice.belongsTo(Household, { as: 'household', foreignKey: 'household_id' });
Invoice.belongsTo(FeePeriod, { as: 'fee_period', foreignKey: 'fee_period_id' });
Invoice.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
Household.hasMany(Invoice, { as: 'invoices', foreignKey: 'household_id' });
FeePeriod.hasMany(Invoice, { as: 'invoices', foreignKey: 'fee_period_id' });
User.hasMany(Invoice, { as: 'created_invoices', foreignKey: 'created_by' });

Invoice.hasMany(InvoiceItem, { as: 'invoice_items', foreignKey: 'invoice_id' });
InvoiceItem.belongsTo(Invoice, { as: 'invoice', foreignKey: 'invoice_id' });
InvoiceItem.belongsTo(FeeType, { as: 'fee_type', foreignKey: 'fee_type_id' });
FeeType.hasMany(InvoiceItem, { as: 'invoice_items', foreignKey: 'fee_type_id' });
InvoiceItem.belongsTo(FeeUsage, { as: 'fee_usage', foreignKey: 'fee_usage_id' });
FeeUsage.hasMany(InvoiceItem, { as: 'invoice_items', foreignKey: 'fee_usage_id' });
InvoiceItem.belongsTo(Vehicle, { as: 'vehicle', foreignKey: 'vehicle_id' });
Vehicle.hasMany(InvoiceItem, { as: 'invoice_items', foreignKey: 'vehicle_id' });

Invoice.hasMany(Payment, { as: 'payments', foreignKey: 'invoice_id' });
Payment.belongsTo(Invoice, { as: 'invoice', foreignKey: 'invoice_id' });
Payment.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
User.hasMany(Payment, { as: 'created_payments', foreignKey: 'created_by' });

module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  RolePermission,
  Household,
  Resident,
  HouseholdMember,
  Vehicle,
  FeeType,
  FeeTypePriceHistory,
  FeePeriod,
  PeriodFee,
  UtilityInvoice,
  FeeUsage,
  Invoice,
  InvoiceItem,
  Payment,
};
