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
const FeePeriod = require('./FeePeriod');
const PeriodFee = require('./PeriodFee');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const Payment = require('./Payment');
const FeeUsage = require('./FeeUsage');

User.belongsTo(Role, {
  as: 'role',
  foreignKey: 'role_id',
});

Role.hasMany(User, {
  as: 'users',
  foreignKey: 'role_id',
});

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

RolePermission.belongsTo(Role, {
  as: 'role',
  foreignKey: 'role_id',
});

RolePermission.belongsTo(Permission, {
  as: 'permission',
  foreignKey: 'permission_id',
});

Role.hasMany(RolePermission, {
  as: 'role_permissions',
  foreignKey: 'role_id',
});

Permission.hasMany(RolePermission, {
  as: 'role_permissions',
  foreignKey: 'permission_id',
});

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
  FeePeriod,
  PeriodFee,
  Invoice,
  InvoiceItem,
  Payment,
  FeeUsage
};
