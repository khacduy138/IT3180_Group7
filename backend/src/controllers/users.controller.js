const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

const { User, Role } = require('../models');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function parseLimit(value) {
  const limit = parsePositiveInt(value, DEFAULT_LIMIT);

  return Math.min(limit, MAX_LIMIT);
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function toUserResponse(user) {
  return {
    id: user.id,
    username: user.username,
    role_id: user.role_id,
    role: user.role
      ? {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description,
        }
      : null,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

async function findRole(roleId) {
  const parsedRoleId = parsePositiveInt(roleId, null);

  if (!parsedRoleId) {
    return null;
  }

  return Role.findByPk(parsedRoleId);
}

function handleUserError(res, err, fallbackMessage) {
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ message: 'Username already exists' });
  }

  return res.status(500).json({ message: fallbackMessage });
}

async function listUsers(req, res) {
  const page = parsePositiveInt(req.query.page, DEFAULT_PAGE);
  const limit = parseLimit(req.query.limit);
  const offset = (page - 1) * limit;
  const search = normalizeText(req.query.search);
  const where = {};

  if (search) {
    where.username = {
      [Op.like]: `%${search}%`,
    };
  }

  try {
    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
        },
      ],
      order: [['id', 'ASC']],
      limit,
      offset,
    });

    return res.json({
      data: rows.map(toUserResponse),
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    return handleUserError(res, err, 'Failed to list users');
  }
}

async function createUser(req, res) {
  const body = req.body || {};
  const username = normalizeText(body.username);
  const password = normalizeText(body.password);
  const { role_id, is_active } = body;

  if (!username || !password || !role_id) {
    return res
      .status(400)
      .json({ message: 'username, password and role_id are required' });
  }

  if (
    Object.prototype.hasOwnProperty.call(body, 'is_active') &&
    typeof is_active !== 'boolean'
  ) {
    return res.status(400).json({ message: 'is_active must be true or false' });
  }

  try {
    const role = await findRole(role_id);

    if (!role) {
      return res.status(400).json({ message: 'role_id is invalid' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password_hash: passwordHash,
      role_id: role.id,
      is_active: typeof is_active === 'boolean' ? is_active : true,
    });
    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
        },
      ],
    });

    return res.status(201).json({
      message: 'User created successfully',
      data: toUserResponse(createdUser),
    });
  } catch (err) {
    return handleUserError(res, err, 'Failed to create user');
  }
}

async function updateUser(req, res) {
  const body = req.body || {};
  const userId = parsePositiveInt(req.params.id, null);

  if (!userId) {
    return res.status(400).json({ message: 'User id is invalid' });
  }

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = {};

    if (Object.prototype.hasOwnProperty.call(body, 'username')) {
      const username = normalizeText(body.username);

      if (!username) {
        return res.status(400).json({ message: 'username cannot be empty' });
      }

      updates.username = username;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'role_id')) {
      const role = await findRole(body.role_id);

      if (!role) {
        return res.status(400).json({ message: 'role_id is invalid' });
      }

      updates.role_id = role.id;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'is_active')) {
      if (typeof body.is_active !== 'boolean') {
        return res
          .status(400)
          .json({ message: 'is_active must be true or false' });
      }

      updates.is_active = body.is_active;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'password')) {
      const password = normalizeText(body.password);

      if (!password) {
        return res.status(400).json({ message: 'password cannot be empty' });
      }

      updates.password_hash = await bcrypt.hash(password, 10);
    }

    await user.update(updates);

    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
        },
      ],
    });

    return res.json({
      message: 'User updated successfully',
      data: toUserResponse(updatedUser),
    });
  } catch (err) {
    return handleUserError(res, err, 'Failed to update user');
  }
}

async function deactivateUser(req, res) {
  const userId = parsePositiveInt(req.params.id, null);

  if (!userId) {
    return res.status(400).json({ message: 'User id is invalid' });
  }

  if (req.user && req.user.id === userId) {
    return res
      .status(400)
      .json({ message: 'Admin cannot deactivate their own account' });
  }

  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ is_active: false });

    return res.json({
      message: 'User deactivated successfully',
      data: toUserResponse(user),
    });
  } catch (err) {
    return handleUserError(res, err, 'Failed to deactivate user');
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
};
