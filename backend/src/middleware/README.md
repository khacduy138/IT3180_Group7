# Auth Middleware Guide

This folder belongs to Module 1.

## Request Flow

```text
HTTP request
  -> route
  -> authenticate
  -> authorize
  -> controller
  -> JSON response
```

## `authenticate`

Use it when the endpoint requires login.

```js
router.get('/households', authenticate, householdsController.list);
```

After success, later handlers can read:

```js
req.user = {
  id: 1,
  username: 'admin',
  role: 'admin',
  permissions: ['households:read']
};
```

## `authorize`

Use it after `authenticate`.

```js
router.post(
  '/users',
  authenticate,
  authorize({ role: 'admin' }),
  usersController.createUser
);
```

Preferred RBAC style for later:

```js
router.get(
  '/invoices',
  authenticate,
  authorize({ permission: 'invoices:read' }),
  invoicesController.list
);
```

## Status Codes

- `401`: not logged in, missing token, invalid token, expired token.
- `403`: logged in, but not allowed to perform this action.
