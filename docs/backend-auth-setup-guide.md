# Backend Auth Setup Guide

Tài liệu này dành cho thành viên mới lần đầu chạy backend BlueMoon AMS.

Mục tiêu sau khi làm xong:

- Máy có Node.js/npm.
- Máy có MySQL server đang chạy.
- Tạo được database local.
- Chạy được migration và seeder.
- Login lấy JWT token.
- Gọi được route protected bằng Bearer token.
- Biết các file auth nằm ở đâu và dùng như thế nào.

## 1. Cài Công Cụ Cần Thiết

### 1.1. Node.js và npm

Cài Node.js bản LTS hoặc bản team đang dùng. Sau khi cài, mở PowerShell và kiểm tra:

```powershell
node --version
npm.cmd --version
```

Nếu có version hiện ra là được.

Trên Windows, ưu tiên dùng `npm.cmd` thay vì `npm` nếu PowerShell báo lỗi execution policy.

### 1.2. MySQL

Cài:

- MySQL Community Server.
- Nếu không thích dùng CLI, muốn có GUI thì cài thêm MySQL Workspace.

Cần nhớ:

- Host thường là `localhost`.
- Port thường là `3306`.
- User thường là `root`.
- Password là mật khẩu bạn đặt lúc cài MySQL.

### 1.3. Postman Hoặc curl

Dùng để test API.

- Postman dễ nhìn hơn cho người mới.
- `curl.exe` có sẵn trên Windows, tiện để copy command.

## 2. Sơ bộ cấu trúc Backend hiện tại

```text
backend/
├── config/
│   └── config.js
│
├── migrations/
│   └── *.js
│
├── seeders/
│   └── *.js
│
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   └── middleware/
│
├── .env.example
└── package.json
```

Các file quan trọng:

- `backend/config/config.js`: config database cho Sequelize CLI, tức là khi chạy migrate/seed.
- `backend/src/config/database.js`: config database cho code backend khi app đang chạy.
- `backend/migrations`: tạo bảng trong MySQL.
- `backend/seeders`: thêm dữ liệu mặc định, ví dụ role/admin/permission.
- `backend/src/models`: JS model đại diện cho bảng DB.
- `backend/src/routes`: khai báo URL API.
- `backend/src/controllers`: xử lý logic API.
- `backend/src/middleware`: middleware auth dùng chung.
- `backend/src/app.js`: tạo Express app và gắn routes.
- `backend/src/server.js`: start server bằng `app.listen`.

## 3. Setup Backend Lần Đầu

### 3.1. Đi Vào Folder Backend

Ví dụ:
```powershell
cd D:\IT3180_Group7\backend
```

### 3.2. Cài Package

```powershell
npm.cmd install
```

Lệnh này đọc `backend/package.json` và tải dependencies trong package.

Nếu đã có `backend/node_modules` sẵn thì k cần chạy, nma nên chạy lại để update package mới.

## 4. Tạo File `.env`

Trong `backend/`, tạo file `.env` bằng cách copy từ `.env.example`.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Sau đó mở `backend/.env` và sửa theo máy bạn.

Ví dụ:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=điền_mật_khẩu_mysql_ở_đây
DB_NAME=bluemoon_ams

DEFAULT_ADMIN_PASSWORD=admin123456
JWT_SECRET=bluemoon_super_secret_key_2026_minimum_32_chars
JWT_EXPIRE=7d
```

Giải thích nhanh:

- `PORT`: port backend chạy.
- `DB_HOST`: địa chỉ MySQL.
- `DB_PORT`: port MySQL, thường là `3306`.
- `DB_USER`: user MySQL.
- `DB_PASSWORD`: password MySQL.
- `DB_NAME`: tên database local.
- `DEFAULT_ADMIN_PASSWORD`: password ban đầu của user `admin` khi seed.
- `JWT_SECRET`: khóa bí mật để ký JWT. Không để trống.
- `JWT_EXPIRE`: thời hạn token, ví dụ `7d`.

Btw không commit file `.env`.

## 5. Tạo Database Local

Bạn cần tạo database trước khi chạy migration.

### Cách 1: Dùng MySQL Workbench

1. Mở MySQL Workbench.
2. Kết nối vào local MySQL.
3. Mở tab query.
4. Chạy:

```sql
CREATE DATABASE bluemoon_ams
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Nếu database đã tồn tại, không cần tạo lại.

### Cách 2: Dùng Terminal

```powershell
mysql -u root -p
```

Nhập password MySQL, rồi chạy:

```sql
CREATE DATABASE bluemoon_ams
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
EXIT;
```

Nếu máy không nhận lệnh `mysql`, dùng MySQL Workbench cho dễ.

## 7. Chạy Migration

Trong `backend/`:

```powershell
npm.cmd run db:migrate
```

Migration dùng để tạo bảng thật trong MySQL.

Kết quả mong đợi:

```text
== 20260526000100-create-auth-core: migrated
...
```

Hoặc:

```text
No migrations were executed, database schema was already up to date.
```

Dòng thứ hai nghĩa là bảng đã được tạo rồi, không phải lỗi.

## 8. Chạy Seeder

Trong `backend/`:

```powershell
npm.cmd run db:seed
```

Seeder dùng để thêm dữ liệu mặc định:

- Roles: `admin`, `accountant`, `staff`, `resident`
- Permissions
- Role-permission mappings
- User admin mặc định

Login mặc định sau seed:

```text
username: admin
password: admin123456
```

Nếu bạn đổi `DEFAULT_ADMIN_PASSWORD` trong `.env` trước lần seed đầu, password admin sẽ theo biến đó.

Lưu ý: seeder hiện không reset password admin nếu admin đã tồn tại. Nếu muốn đổi password, dùng API change-password hoặc cập nhật DB local thủ công.

## 9. Chạy Backend

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

Lệnh này dùng `nodemon`, tự restart server khi code đổi.

## 10. Test Auth API Bằng curl

### 10.1. Login

```powershell
curl.exe -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"admin\",\"password\":\"admin123456\"}"
```

Response sẽ có dạng:

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
    "permissions": ["users:read"]
  }
}
```

Copy giá trị `token`.

### 10.2. Gọi Protected Route Bằng Bearer Token

Route mẫu hiện tại:

```text
GET /api/users
```

Lệnh:

```powershell
curl.exe http://localhost:3001/api/users `
  -H "Authorization: Bearer <TOKEN>"
```

Thay `<TOKEN>` bằng token lấy từ login.

Nếu token đúng và user có permission `users:read`, kết quả:

```json
{
  "message": "Get users - to be implemented",
  "data": []
}
```

### 10.3. Logout

```powershell
curl.exe -X POST http://localhost:3001/api/auth/logout `
  -H "Authorization: Bearer <TOKEN>"
```

Kết quả:

```json
{
  "message": "Logout successful"
}
```

### 10.4. Thử Lại Token Cũ

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

Lưu ý: blacklist token hiện nằm trong RAM bằng `Set`. Nếu restart server, blacklist mất. Đây là giới hạn chấp nhận được cho Sprint 1/local dev.

### 10.5. Đổi Mật Khẩu

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

Sau đó login bằng password mới.

## 11. Test Auth API Bằng Postman

### Login

- Method: `POST`
- URL: `http://localhost:3001/api/auth/login`
- Body -> raw -> JSON:

```json
{
  "username": "admin",
  "password": "admin123456"
}
```

### Gọi Protected Route

- Method: `GET`
- URL: `http://localhost:3001/api/users`
- Tab Authorization:
  - Type: `Bearer Token`
  - Token: paste token từ login

Hoặc thêm header thủ công:

```text
Authorization: Bearer <TOKEN>
```

### Logout

- Method: `POST`
- URL: `http://localhost:3001/api/auth/logout`
- Authorization: Bearer Token

### Change Password

- Method: `POST`
- URL: `http://localhost:3001/api/auth/change-password`
- Authorization: Bearer Token
- Body -> raw -> JSON:

```json
{
  "old_password": "admin123456",
  "new_password": "newpass123456"
}
```

## 12. Cách Dùng Middleware Trong Module Khác

Trong route file:

```js
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
```

### Chỉ Cần Login

```js
router.get('/example', authenticate, controller);
```

### Cần Role

```js
router.post(
  '/example',
  authenticate,
  authorize({ role: 'admin' }),
  controller
);
```

Hoặc nhiều role:

```js
authorize({ roles: ['admin', 'accountant'] })
```

### Cần Permission

```js
router.post(
  '/example',
  authenticate,
  authorize({ permission: 'invoices:write' }),
  controller
);
```

Hoặc nhiều permission:

```js
authorize({ permissions: ['invoices:write', 'payments:write'] })
```

## 13. `req.user` Là Gì?

Sau khi request đi qua `authenticate`, backend gắn user hiện tại vào `req.user`.

Ví dụ:

```js
req.user = {
  id: 1,
  username: 'admin',
  role_id: 1,
  role: 'admin',
  permissions: ['users:read', 'users:write']
};
```

Controller có thể dùng:

```js
const createdBy = req.user.id;
```

Ví dụ tạo invoice:

```js
await Invoice.create({
  household_id,
  total_amount,
  created_by: req.user.id
});
```

## 14. Mã Lỗi Hay Gặp

### `401 Unauthorized`

Nghĩa là hệ thống chưa xác thực được bạn.

Thường do:

- Thiếu header `Authorization`.
- Token sai format.
- Token hết hạn.
- Token đã logout.
- User không còn tồn tại hoặc inactive.

### `403 Forbidden`

Nghĩa là bạn đã login rồi, nhưng không có quyền làm hành động đó.

Ví dụ:

- Route cần `users:read`.
- User hiện tại không có permission `users:read`.

## 15. Lỗi Setup Hay Gặp

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

Password phải đúng với MySQL local.

### Unknown Database `bluemoon_ams`

Bạn chưa tạo database.

Tạo bằng MySQL Workbench:

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

Đây là giới hạn hiện tại.

Logout blacklist đang lưu trong RAM bằng `Set`, nên restart server sẽ mất blacklist. Sau này production có thể chuyển sang bảng DB hoặc Redis.

## 16. Kiểm Tra DB Bằng SQL

Sau khi seed, có thể kiểm tra:

```sql
SELECT id, name FROM roles;
SELECT id, name FROM permissions;
SELECT id, username, role_id, is_active FROM users;
SELECT role_id, permission_id FROM role_permissions;
```

Kiểm tra admin có role:

```sql
SELECT u.id, u.username, r.name AS role_name
FROM users u
JOIN roles r ON r.id = u.role_id
WHERE u.username = 'admin';
```

Kiểm tra admin có permissions:

```sql
SELECT r.name AS role_name, p.name AS permission_name
FROM users u
JOIN roles r ON r.id = u.role_id
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE u.username = 'admin';
```

## 17. Reset Local DB Nếu Muốn Làm Lại Từ Đầu

Cảnh báo: bước này xóa database local.

Chỉ làm nếu bạn đang dùng DB local của riêng bạn và chấp nhận mất dữ liệu.

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