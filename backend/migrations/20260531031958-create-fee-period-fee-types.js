'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('fee_period_fee_types', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },

      fee_period_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'fee_periods',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      fee_type_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'fee_types',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      price_history_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'fee_type_price_history',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      is_required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.addIndex(
      'fee_period_fee_types',
      ['fee_period_id', 'fee_type_id'],
      {
        unique: true,
        name: 'unique_fee_type_per_fee_period',
      }
    );

    await queryInterface.addIndex('fee_period_fee_types', ['price_history_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('fee_period_fee_types');
  },
};