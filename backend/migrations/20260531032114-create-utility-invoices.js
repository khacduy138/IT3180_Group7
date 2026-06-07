'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('utility_invoices', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      fee_period_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'fee_periods',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      household_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'households',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      utility_type: {
        type: Sequelize.ENUM('electricity', 'water', 'internet'),
        allowNull: false,
      },

      previous_reading: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },

      current_reading: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },

      usage_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },

      unit_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },

      total_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM('draft', 'confirmed'),
        allowNull: false,
        defaultValue: 'draft',
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('utility_invoices', ['fee_period_id']);
    await queryInterface.addIndex('utility_invoices', ['household_id']);

    await queryInterface.addIndex(
      'utility_invoices',
      ['fee_period_id', 'household_id', 'utility_type'],
      {
        unique: true,
        name: 'unique_household_utility_per_fee_period',
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('utility_invoices');
  },
};