'use strict';

const bcrypt = require('bcrypt');
const { QueryTypes } = require('sequelize');

const roles = ['admin', 'accountant', 'staff', 'resident'];

const permissions = [
  'auth:login',
  'auth:logout',
  'auth:change-password',
  'users:read',
  'users:write',
  'households:read',
  'households:write',
  'residents:read',
  'residents:write',
  'fees:read',
  'fees:write',
  'invoices:read',
  'invoices:write',
  'payments:read',
  'payments:write',
  'reports:read',
];

const rolePermissions = {
  admin: permissions,
  accountant: [
    'auth:login',
    'auth:logout',
    'auth:change-password',
    'households:read',
    'residents:read',
    'fees:read',
    'fees:write',
    'invoices:read',
    'invoices:write',
    'payments:read',
    'payments:write',
    'reports:read',
  ],
  staff: [
    'auth:login',
    'auth:logout',
    'auth:change-password',
    'households:read',
    'households:write',
    'residents:read',
    'residents:write',
    'fees:read',
    'invoices:read',
  ],
  resident: [
    'auth:login',
    'auth:logout',
    'auth:change-password',
    'households:read',
    'residents:read',
    'invoices:read',
    'payments:read',
  ],
};

/*
  U only need to understand these concepts:
  - async functions: Functions that get out of call stack when they hit an await, allowing other code to run. They return a promise.
  - promise: An object representing the eventual completion or failure of an asynchronous operation. It can be in pending, fulfilled, or rejected state.
  - await: Pauses the async function until the promise is resolved, then returns the result. It allows writing asynchronous code in a synchronous style.
  - transactions: A way to group multiple database operations together. If any operation fails, the whole transaction can be rolled back to maintain data integrity.
  - queryInterface.sequelize.query: A method to run raw SQL queries using Sequelize's connection. It allows you to write custom SQL when needed.
  - replacements: { name: permission } is a JS object { name_of_placeholder: JS_value } that maps the named parameter :name in the SQL query to the value of the variable permission. This allows you to safely include dynamic values in your SQL queries without risking SQL injection.
  - replacements: { names } is a shorthand for { names: names } 
*/

// Helper function to get rows by name from a table within a transaction
// returns an array of JS objects with id and name properties
async function getRowsByName(queryInterface, tableName, names, transaction) {
  return queryInterface.sequelize.query(
    `SELECT id, name FROM ${tableName} WHERE name IN (:names)`,
    {
      replacements: { names },
      type: QueryTypes.SELECT,
      transaction,
    },
  );
}

// Helper function to convert an array of rows with id and name properties into a map of name to id
function toIdMap(rows) {
  return rows.reduce((map, row) => {
    map[row.name] = row.id;
    return map;
  }, {});
}

module.exports = {
  async up(queryInterface) {
    const defaultAdminPassword =
      process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456';
    const adminPasswordHash = await bcrypt.hash(defaultAdminPassword, 10);

    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const role of roles) {
        await queryInterface.sequelize.query(
          `
          INSERT INTO roles (name, created_at, updated_at)
          VALUES (:name, NOW(), NOW())
          ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)
          `,
          {
            replacements: { name: role },
            transaction,
          },
        );
      }

      for (const permission of permissions) {
        // VALUES (:name, NOW(), NOW()) -> VALUES (permission, created_at, updated_at)
        await queryInterface.sequelize.query(
          `
          INSERT INTO permissions (name, created_at, updated_at)
          VALUES (:name, NOW(), NOW())
          ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)
          `,
          {
            replacements: { name: permission },
            transaction,
          },
        );
      }

      const roleRows = await getRowsByName(
        queryInterface,
        'roles',
        roles,
        transaction,
      );
      const permissionRows = await getRowsByName(
        queryInterface,
        'permissions',
        permissions,
        transaction,
      );

      const roleIds = toIdMap(roleRows);
      const permissionIds = toIdMap(permissionRows);

      for (const [roleName, permissionNames] of Object.entries(
        rolePermissions,
      )) {
        for (const permissionName of permissionNames) {
          await queryInterface.sequelize.query(
            `
            INSERT INTO role_permissions (
              role_id,
              permission_id,
              created_at,
              updated_at
            )
            VALUES (:roleId, :permissionId, NOW(), NOW())
            ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)
            `,
            {
              replacements: {
                roleId: roleIds[roleName],
                permissionId: permissionIds[permissionName],
              },
              transaction,
            },
          );
        }
      }

      await queryInterface.sequelize.query(
        `
        INSERT INTO users (
          username,
          password_hash,
          role_id,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          'admin',
          :passwordHash,
          :roleId,
          TRUE,
          NOW(),
          NOW()
        )
        ON DUPLICATE KEY UPDATE
          role_id = VALUES(role_id),
          is_active = VALUES(is_active),
          updated_at = VALUES(updated_at)
        `,
        {
          replacements: {
            passwordHash: adminPasswordHash,
            roleId: roleIds.admin,
          },
          transaction,
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const roleRows = await getRowsByName(
        queryInterface,
        'roles',
        roles,
        transaction,
      );
      const permissionRows = await getRowsByName(
        queryInterface,
        'permissions',
        permissions,
        transaction,
      );
      const roleIds = roleRows.map((role) => role.id);
      const permissionIds = permissionRows.map((permission) => permission.id);

      if (roleIds.length > 0 && permissionIds.length > 0) {
        await queryInterface.sequelize.query(
          `
          DELETE FROM role_permissions
          WHERE role_id IN (:roleIds)
            AND permission_id IN (:permissionIds)
          `,
          {
            replacements: { roleIds, permissionIds },
            transaction,
          },
        );
      }

      await queryInterface.sequelize.query(
        "DELETE FROM users WHERE username = 'admin'",
        { transaction },
      );

      await queryInterface.sequelize.query(
        'DELETE FROM permissions WHERE name IN (:permissions)',
        {
          replacements: { permissions },
          transaction,
        },
      );

      await queryInterface.sequelize.query(
        `
        DELETE FROM roles
        WHERE name IN (:roles)
          AND id NOT IN (
            SELECT role_id
            FROM users
            WHERE role_id IS NOT NULL
          )
        `,
        {
          replacements: { roles },
          transaction,
        },
      );
    });
  },
};
