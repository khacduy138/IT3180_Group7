const jwt = require('jsonwebtoken');

const { User, Role, Permission } = require('../models');
const { isTokenBlacklisted } = require('./tokenBlacklist');

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

async function findActiveUser(userId) {
  return User.findByPk(userId, {
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

async function authenticate(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Missing bearer token' });
  }

  if (isTokenBlacklisted(token)) {
    return res.status(401).json({ message: 'Token has been logged out' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT_SECRET is not configured' });
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const user = await findActiveUser(decodedToken.id);

    if (!user) {
      return res.status(401).json({ message: 'Token user no longer exists' });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: 'User account is inactive' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role_id: user.role_id,
      role: user.role ? user.role.name : null,
      permissions: getPermissions(user),
    };
    req.token = token;

    return next();
  } catch (err) {
    return res.status(500).json({ message: 'Authentication failed' });
  }
}

module.exports = authenticate;
