# Backend Auth, RBAC, And User Management Setup Guide

Tài liệu này dành cho thành viên mới lần đầu chạy backend BlueMoon AMS.

Mục tiêu sau khi làm xong:

- Cài được Node.js/npm.
- Cài và chạy được MySQL local.
- Tạo được database local.
- Chạy được migrations và seeders.
- Login bằng admin mặc định để lấy JWT token.
- Gọi được API protected bằng Bearer token.
- Hiểu sơ bộ file nào làm gì trong Auth/RBAC/User Management.

## 1. Công Cụ Cần Cài

### Node.js Và npm

Cài Node.js bản LTS hoặc bản team đang dùng. Sau khi cài, mở PowerShell:

```powershell
node --version
npm.cmd --version
```

Trên Windows, ưu tiên dùng `npm.cmd` thay vì `npm` nếu PowerShell báo lỗi execution policy.

### MySQL

Cài:

- MySQL Community Server.
- MySQL Workbench nếu muốn thao tác database bằng giao diện.

Thông tin thường dùng:

- Host: `localhost`
- Port: `3306`
- User: `root`
- Password: mật khẩu bạn đặt khi cài MySQL

### Postman Hoặc curl

- Postman dễ nhìn hơn cho người mới.
- `curl.exe` có sẵn trên Windows và tiện để copy command.

## 2. Cấu Trúc Backend Cần Biết

```text
backend/
├── config/
│   └── config.js
├── migrations/
│   └── *.js
├── seeders/
│   └── *.js
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── routes/
├── .env.example
└── package.json
```

Các file chính:

- `backend/config/config.js`: config database cho Sequelize CLI khi chạy migrate/seed.
- `backend/src/config/database.js`: config database cho code backend khi app đang chạy.
- `backend/migrations`: tạo hoặc thay đổi bảng thật trong MySQL.
- `backend/seeders`: thêm dữ liệu mặc định như roles, permissions, admin account.
- `backend/src/models`: Sequelize models đại diện cho bảng database.
- `backend/src/routes`: khai báo URL API.
- `backend/src/controllers`: xử lý logic API.
- `backend/src/middleware`: middleware auth/RBAC dùng chung.
- `backend/src/app.js`: tạo Express app và gắn routes.
- `backend/src/server.js`: start server bằng `app.listen`.

## 3. Setup Backend Lần Đầu

Đi vào folder backend:

```powershell
cd D:\IT3180_Group7\backend
```

Cài package:

```powershell
npm.cmd install
```

Lệnh này đọc `backend/package.json` và tải dependencies như Express, Sequelize, MySQL driver, bcrypt, JWT.

## 4. Tạo File `.env`

Trong `backend/`, copy `.env.example` thành `.env`:

```powershell
Copy-Item .env.example .env
```

Ví dụ nội dung `backend/.env`:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=mat_khau_mysql_cua_ban
DB_NAME=bluemoon_ams

DEFAULT_ADMIN_PASSWORD=admin123456
JWT_SECRET=bluemoon_super_secret_key_2026_minimum_32_chars
JWT_EXPIRE=7d
```

Không commit file `.env`.

## 5. Tạo Database Local

Bạn cần tạo database trước khi chạy migration.

Trong MySQL Workbench hoặc MySQL terminal:

```sql
CREATE DATABASE bluemoon_ams
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Nếu database đã tồn tại thì không cần tạo lại.

## 6. Chạy Migrations

Trong `backend/`:

```powershell
npm.cmd run db:migrate
```

Migrations hiện tại tạo các nhóm bảng:

- Auth/RBAC: `users`, `roles`, `permissions`, `role_permissions`.
- Household/Resident.
- Fee configuration.
- Billing/Payment.
- Cột `roles.description`.

Nếu thấy dòng kiểu này là bình thường:

```text
No migrations were executed, database schema was already up to date.
```

Nó nghĩa là DB đã migrate rồi.

## 7. Chạy Seeders

Trong `backend/`:

```powershell
npm.cmd run db:seed
```

Seeder Auth/RBAC hiện tạo hoặc cập nhật:

- Roles:
  - `admin`: full system administrator.
  - `accountant`: xử lý fees, billing, invoices, payments.
  - `staff`: xử lý household/resident information.
- Permissions theo convention `resource:action`:
  - `users:create`
  - `users:read`
  - `users:update`
  - `users:delete`
  - `households:read`
  - `households:write`
  - `residents:read`
  - `residents:write`
  - `fees:read`
  - `fees:write`
  - `billing:read`
  - `billing:write`
  - `reports:read`
- Role-permission mapping:
  - `admin`: tất cả permissions.
  - `accountant`: `billing:read`, `billing:write`, `fees:read`.
  - `staff`: `households:read`, `households:write`, `residents:read`, `residents:write`.
- User `admin` mặc định nếu chưa tồn tại.

Login mặc định sau seed:

```text
username: admin
password: admin123456
```

Nếu đã set `DEFAULT_ADMIN_PASSWORD` trong `.env` trước lần seed đầu, password admin sẽ dùng biến đó.

Lưu ý: seeder không reset password admin nếu user `admin` đã tồn tại. Muốn đổi password thì dùng API `change-password`.

## 8. Chạy Backend

Trong `backend/`:

```powershell
npm.cmd start
```

Kết quả mong đợi:

```text
[Server]: BlueMoon AMS Backend is running on port 3001
```

Health check:

```powershell
curl.exe http://localhost:3001/api/health
```

Kết quả:

```json
{
  "status": "OK"
}
```

Khi dev, có thể dùng:

```powershell
npm.cmd run dev
```

## 9. Auth API

### Login

```powershell
curl.exe -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"admin\",\"password\":\"admin123456\"}"
```

Response sẽ có `token`:

```json
{
  "message": "Login successful",
  "token": "...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": {
      "id": 1,
      "name": "admin"
    },
    "permissions": ["users:create", "users:read"]
  }
}
```

Copy `token` để gọi API protected.

### Logout

```powershell
curl.exe -X POST http://localhost:3001/api/auth/logout `
  -H "Authorization: Bearer <TOKEN>"
```

Sau logout, token cũ bị blacklist trong RAM:

```json
{
  "message": "Logout successful"
}
```

Giới hạn hiện tại: blacklist token đang dùng `Set` trong RAM. Nếu restart server, blacklist sẽ mất.

### Change Password

```powershell
curl.exe -X POST http://localhost:3001/api/auth/change-password `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <TOKEN>" `
  -d "{\"old_password\":\"admin123456\",\"new_password\":\"newpass123456\"}"
```

Kết quả:

```json
{
  "message": "Password changed successfully"
}
```

Password lưu trong DB là `password_hash`, không lưu plain password.

## 10. User Management API

Tất cả `/api/users` routes hiện là admin-only.

Flow:

```text
request
  -> authenticate
  -> authorize({ roles: ['admin'] })
  -> authorize permission theo action
  -> usersController
```

### GET `/api/users`

List users với role, pagination, optional search.

```powershell
curl.exe "http://localhost:3001/api/users?page=1&limit=10&search=admin" `
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Response mẫu:

```json
{
  "data": [
    {
      "id": 1,
      "username": "admin",
      "role_id": 1,
      "role": {
        "id": 1,
        "name": "admin",
        "description": "Full system administrator with all permissions."
      },
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_pages": 1
  }
}
```

Pagination:

- `page`: trang hiện tại, bắt đầu từ `1`.
- `limit`: số user mỗi trang, tối đa `100`.
- `search`: tìm gần đúng theo `username`.

### POST `/api/users`

Tạo user mới. Backend hash password bằng bcrypt trước khi lưu.

```powershell
curl.exe -X POST http://localhost:3001/api/users `
  -H "Authorization: Bearer <ADMIN_TOKEN>" `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"staff_demo\",\"password\":\"staff123456\",\"role_id\":3}"
```

`role_id = 3` thường là staff sau khi chạy seeder. Nếu không chắc role id, kiểm tra bằng SQL:

```sql
SELECT id, name, description FROM roles;
```

### PUT `/api/users/:id`

Update `username`, `role_id`, `is_active`, hoặc `password`.

Password chỉ được hash lại nếu request có field `password`.

```powershell
curl.exe -X PUT http://localhost:3001/api/users/2 `
  -H "Authorization: Bearer <ADMIN_TOKEN>" `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"staff_demo_updated\",\"is_active\":true}"
```

Đổi role:

```powershell
curl.exe -X PUT http://localhost:3001/api/users/2 `
  -H "Authorization: Bearer <ADMIN_TOKEN>" `
  -H "Content-Type: application/json" `
  -d "{\"role_id\":2}"
```

### DELETE `/api/users/:id`

Soft delete user bằng cách set `is_active = false`.

```powershell
curl.exe -X DELETE http://localhost:3001/api/users/2 `
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Không xóa hard delete vì user có thể liên quan lịch sử hóa đơn, payment, entered_by, created_by.

Admin không được xóa chính mình:

```json
{
  "message": "Admin cannot deactivate their own account"
}
```

## 11. Test Non-Admin Bị Chặn

Tạo staff user bằng admin, sau đó login staff:

```powershell
curl.exe -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"staff_demo\",\"password\":\"staff123456\"}"
```

Gọi user management bằng staff token:

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

## 12. Dùng Middleware Trong Module Khác

Import:

```js
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
```

Route chỉ cần login:

```js
router.get('/example', authenticate, controller);
```

Route cần role:

```js
router.post(
  '/example',
  authenticate,
  authorize({ roles: ['admin'] }),
  controller
);
```

Route cần permission:

```js
router.post(
  '/example',
  authenticate,
  authorize({ permissions: ['billing:write'] }),
  controller
);
```

Route admin-only và có permission theo action:

```js
router.post(
  '/users',
  authenticate,
  authorize({ roles: ['admin'] }),
  authorize({ permissions: ['users:create'] }),
  usersController.createUser
);
```

Chi tiết hơn nằm ở:

```text
backend/src/middleware/README.md
```

## 13. `req.user` Là Gì?

Sau khi request đi qua `authenticate`, backend gắn user hiện tại vào `req.user`:

```js
req.user = {
  id: 1,
  username: 'admin',
  role_id: 1,
  role: 'admin',
  permissions: ['users:create', 'users:read']
};
```

Permissions được load theo quan hệ DB:

```text
users.role_id
  -> roles.id
  -> role_permissions.role_id
  -> permissions.id
```

Controller có thể dùng:

```js
const createdBy = req.user.id;
```

## 14. 401 Và 403 Khác Gì Nhau?

`401 Unauthorized`: hệ thống chưa xác thực được user.

Thường do:

- Thiếu header `Authorization`.
- Token sai format.
- Token hết hạn.
- Token đã logout.
- User không còn tồn tại hoặc inactive.

`403 Forbidden`: user đã login rồi, nhưng không đủ quyền.

Ví dụ:

- Route cần role `admin`.
- User hiện tại là `staff`.

## 15. Kiểm Tra DB Bằng SQL

Roles và descriptions:

```sql
SELECT id, name, description FROM roles;
```

Permissions:

```sql
SELECT id, name FROM permissions ORDER BY name;
```

Role permissions:

```sql
SELECT r.name AS role_name, p.name AS permission_name
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
ORDER BY r.name, p.name;
```

Users với role:

```sql
SELECT u.id, u.username, u.is_active, r.name AS role_name
FROM users u
JOIN roles r ON r.id = u.role_id;
```

Admin permissions:

```sql
SELECT r.name AS role_name, p.name AS permission_name
FROM users u
JOIN roles r ON r.id = u.role_id
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE u.username = 'admin'
ORDER BY p.name;
```

Soft delete check:

```sql
SELECT id, username, is_active
FROM users
WHERE id = 2;
```

## 16. Lỗi Setup Hay Gặp

### PowerShell Không Chạy Được `npm`

Dùng:

```powershell
npm.cmd install
npm.cmd start
```

### Access Denied For User `root`

Kiểm tra `backend/.env`:

```env
DB_USER=root
DB_PASSWORD=mat_khau_mysql_cua_ban
```

### Unknown Database `bluemoon_ams`

Bạn chưa tạo database.

```sql
CREATE DATABASE bluemoon_ams
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### JWT_SECRET Is Not Configured

Thêm vào `backend/.env`:

```env
JWT_SECRET=bluemoon_super_secret_key_2026_minimum_32_chars
JWT_EXPIRE=7d
```

### Token Vừa Logout Nhưng Sau Restart Lại Dùng Được

Đây là giới hạn hiện tại. Logout blacklist đang lưu trong RAM bằng `Set`, nên restart server sẽ mất blacklist.

## 17. Reset Local DB Nếu Muốn Làm Lại Từ Đầu

Cảnh báo: bước này xóa database local.

Trong MySQL:

```sql
DROP DATABASE bluemoon_ams;
CREATE DATABASE bluemoon_ams
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Sau đó chạy lại:

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
```
