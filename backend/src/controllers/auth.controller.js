const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { User, Role, Permission } = require('../models');
const { blacklistToken } = require('../middleware/tokenBlacklist');

function getBearerToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice('Bearer '.length).trim();
}

function getPermissions(user) {
  if (!user.role || !user.role.permissions) {
    return [];
  }

  return user.role.permissions.map((permission) => permission.name);
}

function buildUserResponse(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role
      ? {
          id: user.role.id,
          name: user.role.name,
        }
      : null,
    permissions: getPermissions(user),
  };
}

async function findUserWithRole(username) {
  return User.findOne({
    where: { username },
    include: [
      {
        model: Role,
        as: 'role',
        include: [
          {
            model: Permission,
            as: 'permissions',
            through: { attributes: [] },
          },
        ],
      },
    ],
  });
}

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'username and password are required' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT_SECRET is not configured' });
  }

  try {
    const user = await findUserWithRole(username);

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'User account is inactive' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const permissions = getPermissions(user);
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role ? user.role.name : null,
        permissions,
        jti: crypto.randomUUID(),
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' },
    );

    return res.json({
      message: 'Login successful',
      token,
      user: buildUserResponse(user),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed' });
  }
}

function logout(req, res) {
  const token = req.token || getBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Missing bearer token' });
  }

  blacklistToken(token);

  return res.json({ message: 'Logout successful' });
}

async function changePassword(req, res) {
  const { old_password, new_password } = req.body;

  if (!old_password || !new_password) {
    return res
      .status(400)
      .json({ message: 'old_password and new_password are required' });
  }

  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'User account is inactive' });
    }

    const oldPasswordMatches = await bcrypt.compare(
      old_password,
      user.password_hash,
    );

    if (!oldPasswordMatches) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(new_password, 10);

    await user.update({ password_hash: newPasswordHash });

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Change password failed' });
  }
}

module.exports = {
  login,
  logout,
  changePassword,
};
