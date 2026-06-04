const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const Permission = sequelize.define(
	'Permission',
	{
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
	},
	{
		tableName: 'permissions',
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	}
);

module.exports = Permission;
