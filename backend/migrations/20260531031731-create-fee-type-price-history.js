'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('fee_type_price_history', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      fee_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'fee_types',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      unit_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },

      effective_from: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      effective_to: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    await queryInterface.addIndex('fee_type_price_history', ['fee_type_id']);
    await queryInterface.addIndex(
      'fee_type_price_history',
      ['fee_type_id', 'effective_from'],
      {
        unique: true,
        name: 'unique_fee_type_effective_from',
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('fee_type_price_history');
  },
};