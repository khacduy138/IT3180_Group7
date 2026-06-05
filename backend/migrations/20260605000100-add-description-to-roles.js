'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('roles');

    if (!table.description) {
      await queryInterface.addColumn('roles', 'description', {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'name',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('roles');

    if (table.description) {
      await queryInterface.removeColumn('roles', 'description');
    }
  },
};
