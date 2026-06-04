const sequelize = require('../config/database');

const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const User = require('./User');

const Household = require('./Household');
const Resident = require('./Resident');
const HouseholdMember = require('./HouseholdMember');
const Vehicle = require('./Vehicle');

const FeeType = require('./FeeType');
const FeePeriod = require('./FeePeriod');
const PeriodFee = require('./PeriodFee');

const FeeUsage = require('./FeeUsage');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const Payment = require('./Payment');

Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

Role.belongsToMany(Permission, {
	through: RolePermission,
	foreignKey: 'role_id',
	otherKey: 'permission_id',
});
Permission.belongsToMany(Role, {
	through: RolePermission,
	foreignKey: 'permission_id',
	otherKey: 'role_id',
});

Resident.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(Resident, { foreignKey: 'user_id' });

Household.hasMany(HouseholdMember, { foreignKey: 'household_id' });
HouseholdMember.belongsTo(Household, { foreignKey: 'household_id' });

Resident.hasMany(HouseholdMember, { foreignKey: 'resident_id' });
HouseholdMember.belongsTo(Resident, { foreignKey: 'resident_id' });

Household.hasMany(Vehicle, { foreignKey: 'household_id' });
Vehicle.belongsTo(Household, { foreignKey: 'household_id' });

FeePeriod.hasMany(PeriodFee, { foreignKey: 'fee_period_id' });
PeriodFee.belongsTo(FeePeriod, { foreignKey: 'fee_period_id' });

FeeType.hasMany(PeriodFee, { foreignKey: 'fee_type_id' });
PeriodFee.belongsTo(FeeType, { foreignKey: 'fee_type_id' });

FeeUsage.belongsTo(Household, { foreignKey: 'household_id' });
FeeUsage.belongsTo(PeriodFee, { foreignKey: 'period_fee_id' });
FeeUsage.belongsTo(User, { foreignKey: 'entered_by' });

Invoice.belongsTo(Household, { foreignKey: 'household_id' });
Invoice.belongsTo(FeePeriod, { foreignKey: 'fee_period_id' });
Invoice.belongsTo(User, { foreignKey: 'created_by' });
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id' });
Invoice.hasMany(Payment, { foreignKey: 'invoice_id' });

InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });
InvoiceItem.belongsTo(FeeType, { foreignKey: 'fee_type_id' });
InvoiceItem.belongsTo(FeeUsage, { foreignKey: 'fee_usage_id' });
InvoiceItem.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

Payment.belongsTo(Invoice, { foreignKey: 'invoice_id' });
Payment.belongsTo(User, { foreignKey: 'created_by' });

module.exports = {
	sequelize,
	Role,
	Permission,
	RolePermission,
	User,
	Household,
	Resident,
	HouseholdMember,
	Vehicle,
	FeeType,
	FeePeriod,
	PeriodFee,
	FeeUsage,
	Invoice,
	InvoiceItem,
	Payment,
};
