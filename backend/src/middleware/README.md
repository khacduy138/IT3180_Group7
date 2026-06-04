# Auth Middleware Guide

Folder này chứa middleware dùng chung cho các route cần đăng nhập hoặc cần phân quyền.

## Request Flow

```text
HTTP request
  -> route
  -> authenticate
  -> authorize
  -> controller
  -> JSON response
```

## 1. `authenticate` Làm Gì?

`authenticate` kiểm tra người gọi API đã đăng nhập chưa.

Nó sẽ:

- Đọc header `Authorization: Bearer <token>`.
- Trả `401` nếu thiếu token.
- Trả `401` nếu token không hợp lệ, hết hạn, hoặc đã logout.
- Verify token bằng `JWT_SECRET`.
- Load user hiện tại từ database.
- Gắn thông tin user vào `req.user`.

Sau khi qua `authenticate`, controller hoặc middleware sau có thể dùng:

```js
req.user = {
  id: 1,
  username: 'admin',
  role_id: 1,
  role: 'admin',
  permissions: ['users:read', 'invoices:write']
};
```

## 2. `authorize` Làm Gì?

`authorize` kiểm tra người đã đăng nhập có đủ quyền để làm hành động đó không.

Dùng `authorize` sau `authenticate`.

```js
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
```

Nếu chỉ cần đăng nhập, dùng `authenticate`.

Nếu cần đúng role hoặc permission, dùng thêm `authorize`.

## 3. Protected Route

Route này chỉ yêu cầu user đã login.

```js
router.get('/example', authenticate, controller);
```

## 4. Role-Protected Route

Route này yêu cầu user có role `admin`.

```js
router.post(
  '/example',
  authenticate,
  authorize({ roles: ['admin'] }),
  controller
);
```

Nếu chỉ có một role, có thể viết ngắn hơn:

```js
router.post(
  '/example',
  authenticate,
  authorize({ role: 'admin' }),
  controller
);
```

Lưu ý: hiện tại middleware của repo dùng object config như trên. Đừng dùng `authorize(['admin'])` trong code hiện tại, vì dạng đó không phải signature đang được implement.

## 5. Permission-Protected Route

Route này yêu cầu user có permission `invoices:write`.

```js
router.post(
  '/example',
  authenticate,
  authorize({ permissions: ['invoices:write'] }),
  controller
);
```

Nếu chỉ có một permission, có thể viết:

```js
router.post(
  '/example',
  authenticate,
  authorize({ permission: 'invoices:write' }),
  controller
);
```

## 6. Common HTTP Errors

- `401 Unauthorized`: thiếu token, token sai, token hết hạn, token đã logout, hoặc user không còn active.
- `403 Forbidden`: token hợp lệ và user đã login, nhưng user không có role/permission cần thiết.

Nói ngắn gọn:

```text
401 = chưa chứng minh được "bạn là ai"
403 = biết bạn là ai rồi, nhưng bạn không có quyền làm việc này
```

## 7. Example Curl Flow

### Login

```powershell
curl.exe -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"admin\",\"password\":\"admin123456\"}"
```

Response sẽ có `token`. Copy token đó để gọi route protected.

### Call Protected Route With Bearer Token

Ví dụ route mẫu hiện tại là `GET /api/users`.

```powershell
curl.exe http://localhost:3001/api/users `
  -H "Authorization: Bearer <TOKEN>"
```

### Logout

```powershell
curl.exe -X POST http://localhost:3001/api/auth/logout `
  -H "Authorization: Bearer <TOKEN>"
```

### Try Old Token Again

Sau khi logout, gọi lại token cũ:

```powershell
curl.exe http://localhost:3001/api/users `
  -H "Authorization: Bearer <TOKEN>"
```

Kết quả mong đợi:

```json
{
  "message": "Token has been logged out"
}
```

## 8. Teammate Import Pattern

Trong file route của module khác:

```js
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
```

Ví dụ:

```js
router.get(
  '/invoices',
  authenticate,
  authorize({ permission: 'invoices:read' }),
  invoicesController.list
);
```
