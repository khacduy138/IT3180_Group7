function toArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function authorize(requirements = {}) {
  const requiredRoles = toArray(requirements.role || requirements.roles);
  const requiredPermissions = toArray(
    requirements.permission || requirements.permissions,
  );

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
      return next();
    }

    const userPermissions = Array.isArray(req.user.permissions)
      ? req.user.permissions
      : [];

    const hasRequiredRole = requiredRoles.includes(req.user.role);
    const hasRequiredPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (hasRequiredRole || hasRequiredPermission) {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden' });
  };
}

module.exports = authorize;
