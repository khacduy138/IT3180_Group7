const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const Role = sequelize.define(
	'Role',
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
		tableName: 'roles',
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	}
);

module.exports = Role;
