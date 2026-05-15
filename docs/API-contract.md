# API Contract

## 📌 Tổng Quan
Tài liệu này định nghĩa các chuẩn mực chung cho tất cả các API trong dự án, bao gồm format request/response, error handling, và naming conventions.

---

## 🔷 Request Format

### HTTP Methods
- **GET** - Lấy dữ liệu
- **POST** - Tạo dữ liệu mới
- **PUT** - Cập nhật toàn bộ dữ liệu
- **PATCH** - Cập nhật một phần dữ liệu
- **DELETE** - Xóa dữ liệu

### Standard Headers
```http
Content-Type: application/json 
Authorization: Bearer {token} 
X-Request-ID: {unique-id} (optional)
```

### Naming Convention
- **URL path:** lowercase, kebab-case
  ```text
  /api/v1/user-profiles 
  /api/v1/products/{id}
  ```
- **Query parameters:** camelCase
  ```text
  ?pageSize=20&pageNumber=1&sortBy=createdAt
  ```
- **JSON properties:** camelCase
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "emailAddress": "john@example.com"
  }
  ```

---

## 🔶 Response Format

### Success Response (2xx)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "emailAddress": "john@example.com"
  },
  "timestamp": "2026-05-15T10:30:45.123Z"
}
```

### List Response (2xx)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Records retrieved successfully",
  "data": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe"
    },
    {
      "id": 2,
      "firstName": "Jane",
      "lastName": "Smith"
    }
  ],
  "pagination": {
    "pageNumber": 1,
    "pageSize": 20,
    "totalRecords": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "timestamp": "2026-05-15T10:30:45.123Z"
}
```

### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "emailAddress",
      "code": "INVALID_EMAIL",
      "message": "Email address is not valid"
    },
    {
      "field": "firstName",
      "code": "REQUIRED_FIELD",
      "message": "First name is required"
    }
  ],
  "timestamp": "2026-05-15T10:30:45.123Z"
}
```

---

## 🔴 HTTP Status Codes

| Code | Name | Usage |
| :--- | :--- | :--- |
| **200** | OK | Request thành công, trả về dữ liệu |
| **201** | Created | Tạo resource mới thành công |
| **204** | No Content | Request thành công, không có dữ liệu trả về |
| **400** | Bad Request | Lỗi validation, request không hợp lệ |
| **401** | Unauthorized | Chưa xác thực hoặc token hết hạn |
| **403** | Forbidden | Không có quyền truy cập |
| **404** | Not Found | Resource không tồn tại |
| **409** | Conflict | Dữ liệu xung đột (e.g., email đã tồn tại) |
| **422** | Unprocessable Entity | Request hợp lệ nhưng không thể xử lý |
| **429** | Too Many Requests | Vượt quá rate limit |
| **500** | Internal Server Error | Lỗi server |
| **503** | Service Unavailable | Service không sẵn sàng |

---

## 📝 Error Codes

### Authentication Errors
- `AUTH_001` - Invalid credentials
- `AUTH_002` - Token expired
- `AUTH_003` - Token invalid
- `AUTH_004` - Missing authorization header

### Validation Errors
- `VAL_001` - Required field missing
- `VAL_002` - Invalid field format
- `VAL_003` - Field length exceeded
- `VAL_004` - Invalid enum value

### Business Logic Errors
- `BUS_001` - Resource not found
- `BUS_002` - Resource already exists
- `BUS_003` - Operation not allowed
- `BUS_004` - Insufficient permissions

### Server Errors
- `SRV_001` - Database error
- `SRV_002` - External service error
- `SRV_003` - Internal server error

---

## 📋 Pagination

### Query Parameters
```http
GET /api/v1/users?pageNumber=1&pageSize=20&sortBy=createdAt&sortOrder=desc
```

### Response Structure
```json
{
  "pagination": {
    "pageNumber": 1,
    "pageSize": 20,
    "totalRecords": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Default Values:
- `pageNumber`: 1
- `pageSize`: 20
- `maxPageSize`: 100
- `sortOrder`: asc (ascending)

---

## 🔐 Authentication

### Bearer Token
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Validation
- **Token hết hạn:** Trả về `401 Unauthorized`
- **Token không hợp lệ:** Trả về `403 Forbidden`
- **Thiếu token:** Trả về `401 Unauthorized`

---

## 📚 CRUD Examples

### CREATE - POST
**Request:**
```http
POST /api/v1/users
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "emailAddress": "john@example.com",
  "age": 28
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "emailAddress": "john@example.com",
    "age": 28,
    "createdAt": "2026-05-15T10:30:45.123Z"
  },
  "timestamp": "2026-05-15T10:30:45.123Z"
}
```

### READ - GET
**Request:**
```http
GET /api/v1/users/1
```
**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "emailAddress": "john@example.com",
    "age": 28,
    "createdAt": "2026-05-15T10:30:45.123Z",
    "updatedAt": "2026-05-15T10:30:45.123Z"
  },
  "timestamp": "2026-05-15T10:30:45.123Z"
}
```

### UPDATE - PUT
**Request:**
```http
PUT /api/v1/users/1
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "emailAddress": "john.smith@example.com",
  "age": 29
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Smith",
    "emailAddress": "john.smith@example.com",
    "age": 29,
    "updatedAt": "2026-05-15T10:45:30.123Z"
  },
  "timestamp": "2026-05-15T10:45:30.123Z"
}
```

### PATCH - Partial Update
**Request:**
```http
PATCH /api/v1/users/1
Content-Type: application/json

{
  "age": 30
}
```

### DELETE
**Request:**
```http
DELETE /api/v1/users/1
```
**Response (204 No Content):**
```text
(No body)
```

---

## ⚡ Rate Limiting

### Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1463113297
```

### Limits
- **Default:** 1000 requests per hour
- **Authenticated:** 5000 requests per hour
- **Exception:** Contact team lead

---

## 📄 Version Management

### Current API Version
- `v1` - Current stable version

### URL Structure
```text
/api/v1/resource
/api/v2/resource (future)
```

### Deprecation Policy
- Deprecate version 6 months before removal
- Provide migration guide for clients
- Maintain backward compatibility during transition period

### API Versioning in Response
```json
{
  "apiVersion": "1.0.0",
  "data": {}
}
```

---

## 📌 Lưu Ý Quan Trọng
- **Timestamp Format:** Luôn sử dụng ISO 8601 format (UTC)
- **Null Values:** Tránh trả về `null`, sử dụng empty string hoặc default value
- **Error Messages:** Thân thiện với người dùng, không để lộ thông tin nhạy cảm
- **Case Sensitivity:** URL paths phân biệt chữ hoa/thường, properties thì không
- **Encoding:** Luôn sử dụng UTF-8
- **CORS:** Cấu hình CORS phù hợp cho các domain được phép
```