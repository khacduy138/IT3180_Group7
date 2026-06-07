'use strict';

const bcrypt = require('bcrypt');
const { QueryTypes } = require('sequelize');

const roles = [
  {
    name: 'admin',
    description: 'Full system administrator with all permissions.',
  },
  {
    name: 'accountant',
    description: 'Handles fees, billing, invoices, and payment records.',
  },
  {
    name: 'staff',
    description: 'Manages household and resident information.',
  },
];
const roleNames = roles.map((role) => role.name);

// Permission names use plural resource:action, e.g. users:create.
const permissions = [
  'users:create',
  'users:read',
  'users:update',
  'users:delete',
  'households:read',
  'households:write',
  'residents:read',
  'residents:write',
  'fees:read',
  'fees:write',
  'billing:read',
  'billing:write',
  'invoices:read',
  'invoices:write',
  'payments:read',
  'payments:write',
  'reports:read',
];

const rolePermissions = {
  admin: permissions,
  accountant: [
    'billing:read',
    'billing:write',
    'invoices:read',
    'invoices:write',
    'payments:read',
    'payments:write',
    'fees:read',
  ],
  staff: [
    'households:read',
    'households:write',
    'residents:read',
    'residents:write',
  ],
};

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
          INSERT INTO roles (name, description, created_at, updated_at)
          VALUES (:name, :description, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            description = VALUES(description),
            updated_at = VALUES(updated_at)
          `,
          {
            replacements: {
              name: role.name,
              description: role.description,
            },
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
        roleNames,
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
      const managedRoleIds = Object.values(roleIds);

      await queryInterface.sequelize.query(
        `
        DELETE FROM role_permissions
        WHERE role_id IN (:roleIds)
        `,
        {
          replacements: { roleIds: managedRoleIds },
          transaction,
        },
      );

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
        SELECT
          'admin',
          :passwordHash,
          :roleId,
          TRUE,
          NOW(),
          NOW()
        WHERE NOT EXISTS (
          SELECT 1
          FROM users
          WHERE username = 'admin'
        )
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
        roleNames,
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
          replacements: { roles: roleNames },
          transaction,
        },
      );
    });
  },
};
