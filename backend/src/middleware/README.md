# Auth Middleware Guide

Folder này chứa middleware dùng chung để bảo vệ API.

Trong backend hiện tại:

- `authenticate` kiểm tra user đã đăng nhập chưa.
- `authorize` kiểm tra user đã đăng nhập có đúng role hoặc permission không.
- User Management routes được mount tại `/api/users` trong `src/app.js`.

## Request Flow

```text
HTTP request
  -> route
  -> authenticate
  -> authorize
  -> controller
  -> JSON response
```

## 1. How To Use `authenticate`

`authenticate` đọc JWT token từ header:

```text
Authorization: Bearer <token>
```

Nó sẽ:

- Trả `401` nếu thiếu token.
- Trả `401` nếu token sai, hết hạn, hoặc đã logout.
- Verify token bằng `JWT_SECRET`.
- Load user hiện tại từ database.
- Gắn thông tin user vào `req.user`.

Sau khi chạy xong, các middleware/controller phía sau có thể dùng:

```js
req.user = {
  id: 1,
  username: 'admin',
  role_id: 1,
  role: 'admin',
  permissions: ['users:create', 'users:read']
};
```

Ví dụ route chỉ cần đăng nhập:

```js
const authenticate = require('../middleware/authenticate');

router.get('/profile', authenticate, profileController.show);
```

## 2. How To Use `authorize` With Roles

Role là vai trò lớn của user, ví dụ `admin`, `accountant`, `staff`.

Dùng `authorize` sau `authenticate`:

```js
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get(
  '/admin-report',
  authenticate,
  authorize({ roles: ['admin'] }),
  reportController.adminReport
);
```

Nếu chỉ cần một role, có thể viết:

```js
authorize({ role: 'admin' })
```

Không dùng dạng này trong repo hiện tại:

```js
authorize(['admin'])
```

## 3. How To Use `authorize` With Permissions

Permission là quyền làm một hành động cụ thể, ví dụ:

- `users:create`
- `users:read`
- `users:update`
- `users:delete`
- `billing:write`

Ví dụ route cần permission:

```js
router.post(
  '/users',
  authenticate,
  authorize({ permissions: ['users:create'] }),
  usersController.createUser
);
```

Nếu chỉ cần một permission, có thể viết:

```js
authorize({ permission: 'users:create' })
```

Mặc định role `admin` được thiết kế để pass mọi permission check. Nếu sau này có route đặc biệt không muốn admin tự động pass, dùng:

```js
authorize({ permissions: ['some:permission'], allowAdmin: false })
```

## 4. Example Admin-Only Route

Route này chỉ cho admin vào:

```js
router.get(
  '/example',
  authenticate,
  authorize({ roles: ['admin'] }),
  exampleController.index
);
```

Trong repo hiện tại, `/api/users` là admin-only:

```js
router.use(authenticate);
router.use(authorize({ roles: ['admin'] }));
```

## 5. Example Permission-Based Route

Route này yêu cầu user có permission `billing:write`.

```js
router.post(
  '/billing',
  authenticate,
  authorize({ permissions: ['billing:write'] }),
  billingController.create
);
```

Nếu muốn route vừa là admin-only vừa có permission rõ theo action, dùng nhiều middleware:

```js
router.post(
  '/users',
  authenticate,
  authorize({ roles: ['admin'] }),
  authorize({ permissions: ['users:create'] }),
  usersController.createUser
);
```

## 6. Example Curl Flow

Các ví dụ dưới đây dùng full URL `/api/users` vì trong `src/app.js` route users được mount như sau:

```js
app.use('/api/users', require('./routes/users.routes'));
```

### Login As Admin

```powershell
curl.exe -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"admin\",\"password\":\"admin123456\"}"
```

Copy `token` trong response.

### Admin Calls `GET /users`

Full URL là `GET /api/users`.

```powershell
curl.exe "http://localhost:3001/api/users?page=1&limit=10" `
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Kết quả mong đợi: `200 OK`, trả về danh sách user.

### Create A Non-Admin User If Needed

Nếu database chưa có non-admin account, admin có thể tạo một staff user:

```powershell
curl.exe -X POST http://localhost:3001/api/users `
  -H "Authorization: Bearer <ADMIN_TOKEN>" `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"staff_demo\",\"password\":\"staff123456\",\"role_id\":3}"
```

`role_id = 3` thường là staff nếu đã chạy auth seeder.

### Login As Non-Admin

```powershell
curl.exe -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"staff_demo\",\"password\":\"staff123456\"}"
```

Copy `token` của staff.

### Non-Admin Calls `GET /users` And Receives 403

```powershell
curl.exe "http://localhost:3001/api/users?page=1&limit=10" `
  -H "Authorization: Bearer <STAFF_TOKEN>"
```

Kết quả mong đợi:

```json
{
  "message": "Forbidden"
}
```

## 7. Common Errors

- `401 Unauthorized`: thiếu token, token sai, token hết hạn, token đã logout, hoặc user không còn active.
- `403 Forbidden`: token hợp lệ và user đã đăng nhập, nhưng không đủ role hoặc permission.

Nói ngắn gọn:

```text
401 = chưa xác thực được "bạn là ai"
403 = biết bạn là ai rồi, nhưng bạn không có quyền làm việc này
```

## 8. Where Permissions Come From

`authenticate` load permission theo quan hệ database hiện tại:

```text
users.role_id
  -> roles.id
  -> role_permissions.role_id
  -> permissions.id
```

Vì vậy teammate không cần tự query permissions trong controller. Sau `authenticate`, cứ dùng `req.user.permissions` hoặc dùng `authorize({ permissions: [...] })`.
