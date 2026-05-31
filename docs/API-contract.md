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

# API Contract — Module 3: Fee Management

**Module Owner:** Module 3 — Fee Management  
**Purpose:** Quản lý cấu hình loại phí, lịch sử đơn giá, kỳ thu phí và dữ liệu phí tiện ích phục vụ Module 4 tạo hóa đơn tự động.

> **Integration Requirement:** Module 4 sử dụng endpoint `GET /api/fee-periods/:id` để lấy cấu hình phí của một kỳ thu cụ thể. Response phải chứa cách tính phí, đơn giá đã chốt theo version, `priceHistoryId` và `isRequired` để hóa đơn lịch sử không thay đổi khi admin cập nhật giá mới.

> **Implementation Alignment Note:** Route skeleton hiện tại của backend đang được mount tại prefix `/api`, vì vậy phần Module 3 trong tài liệu này sử dụng `/api/...`. Phần quy chuẩn chung phía trên đang đề xuất `/api/v1/...`; team cần thống nhất versioning toàn hệ thống ở một thay đổi riêng trước khi đổi route đang chạy.

---

## 1. Authentication and Access Control

Tất cả endpoints Module 3 được thiết kế để yêu cầu JWT token:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

> **Sprint 1 Status:** Route skeleton đã được tạo, nhưng việc gắn middleware `authenticate` vẫn đang chờ Module 1 hoàn thiện `src/middleware/authenticate.js`. Sau khi middleware sẵn sàng, toàn bộ route Module 3 phải được bảo vệ trước khi release.

### Authentication Errors

| Status | Code | Meaning |
| --- | --- | --- |
| `401` | `UNAUTHORIZED` | Không có token, token không hợp lệ hoặc token hết hạn |
| `403` | `FORBIDDEN` | Người dùng đã xác thực nhưng không có quyền thao tác |

---

## 2. Business Rules

### 2.1. Supported Fee Calculation Types

| Calculation Type | Meaning | Calculation Rule | Example |
| --- | --- | --- | --- |
| `per_m2` | Phí tính theo diện tích căn hộ/hộ dân | `unitPrice × area` | Phí quản lý: `8000.00 × 70 = 560000.00` |
| `fixed` | Phí cố định cho mỗi hộ dân trong kỳ | `unitPrice` | Phí dịch vụ: `100000.00` |
| `voluntary` | Khoản đóng góp tự nguyện | Không tự động cộng vào hóa đơn | Quỹ cộng đồng |

### 2.2. Monetary Value Rule

Tất cả trường tiền tệ và phép tính tiền phải được xử lý bằng số thập phân chính xác. Backend đã sử dụng `decimal.js` trong helper `calculateFee(type, unitPrice, area)`.

Trong API examples, các giá trị tiền được biểu diễn bằng chuỗi decimal, ví dụ:

```json
{
  "unitPrice": "9000.00",
  "totalAmount": "630000.00"
}
```

### 2.3. Price Versioning Rule

Khi admin thay đổi đơn giá, hệ thống không ghi đè giá đã được dùng cho kỳ phí cũ.

Ví dụ:

- Tháng 05/2026: phí quản lý là `8000.00 VND/m²`.
- Tháng 06/2026: đơn giá mới là `9000.00 VND/m²`.
- Hóa đơn tháng 05/2026 vẫn sử dụng version giá `8000.00 VND/m²`.

Mỗi lần đổi giá tạo một bản ghi mới trong:

```txt
fee_type_price_history
```

Mỗi kỳ phí lưu liên kết tới đúng version giá thông qua:

```txt
fee_period_fee_types.price_history_id
```

### 2.4. Fee Period Lifecycle

| Status | Meaning | Allowed Update |
| --- | --- | --- |
| `draft` | Kỳ phí đang soạn | Có thể sửa hoặc xóa |
| `active` | Kỳ phí đã kích hoạt để Module 4 tạo hóa đơn | Không được đổi fee items hoặc version giá |
| `closed` | Kỳ phí đã kết thúc | Chỉ đọc dữ liệu lịch sử |

---

## 3. Core Entities

### 3.1. Fee Type

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | ID loại phí |
| `name` | string | Yes | Tên loại phí |
| `code` | string | Yes | Mã duy nhất, ví dụ `MANAGEMENT_FEE` |
| `description` | string/null | No | Mô tả loại phí |
| `calculationType` | enum | Yes | `per_m2`, `fixed`, `voluntary` |
| `unit` | string | Yes | Ví dụ `VND/m2`, `VND/household`, `VND` |
| `isActive` | boolean | Yes | Loại phí còn sử dụng hay không |
| `createdAt` | datetime | Yes | Thời gian tạo |
| `updatedAt` | datetime | Yes | Thời gian cập nhật |

### 3.2. Fee Type Price History

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | ID version giá |
| `feeTypeId` | UUID | Yes | ID loại phí |
| `unitPrice` | decimal string | Yes | Đơn giá ở version này |
| `effectiveFrom` | date | Yes | Ngày bắt đầu áp dụng |
| `effectiveTo` | date/null | No | Ngày kết thúc; `null` nếu đang còn hiệu lực |
| `createdBy` | UUID/null | No | Admin tạo version; nullable trong Sprint 1 do Module 1 chưa hoàn thiện |
| `createdAt` | datetime | Yes | Thời gian tạo |
| `updatedAt` | datetime | Yes | Thời gian cập nhật |

### 3.3. Fee Period

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | ID kỳ phí |
| `name` | string | Yes | Tên kỳ phí, ví dụ `Phí tháng 06/2026` |
| `month` | number | Yes | Tháng áp dụng |
| `year` | number | Yes | Năm áp dụng |
| `startDate` | date | Yes | Ngày bắt đầu |
| `endDate` | date | Yes | Ngày kết thúc |
| `dueDate` | date | Yes | Hạn thanh toán |
| `status` | enum | Yes | `draft`, `active`, `closed` |
| `createdAt` | datetime | Yes | Thời gian tạo |
| `updatedAt` | datetime | Yes | Thời gian cập nhật |

### 3.4. Fee Period Fee Type

Đây là entity trung gian tương ứng với bảng `fee_period_fee_types`. Trong API response, danh sách này được trả dưới property `feeItems`.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | ID liên kết |
| `feePeriodId` | UUID | Yes | ID kỳ phí |
| `feeTypeId` | UUID | Yes | ID loại phí |
| `priceHistoryId` | UUID | Yes | ID version giá đã chốt cho kỳ phí |
| `isRequired` | boolean | Yes | Phí bắt buộc hay tự nguyện |
| `createdAt` | datetime | Yes | Thời gian tạo |
| `updatedAt` | datetime | Yes | Thời gian cập nhật |

### 3.5. Utility Invoice

Dữ liệu tiện ích đầu vào theo hộ dân và kỳ phí. Module 4 sử dụng dữ liệu đã xác nhận khi tạo hóa đơn tổng.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | ID bản ghi tiện ích |
| `feePeriodId` | UUID | Yes | ID kỳ phí |
| `householdId` | UUID | Yes | ID hộ dân; FK sẽ bổ sung khi Module 2 chốt schema |
| `utilityType` | enum | Yes | `electricity`, `water`, `internet` |
| `previousReading` | decimal string/null | No | Chỉ số đầu kỳ |
| `currentReading` | decimal string/null | No | Chỉ số cuối kỳ |
| `usageAmount` | decimal string | Yes | Lượng tiêu thụ |
| `unitPrice` | decimal string | Yes | Đơn giá tiện ích |
| `totalAmount` | decimal string | Yes | Tổng tiền tiện ích |
| `status` | enum | Yes | `draft`, `confirmed` |
| `createdAt` | datetime | Yes | Thời gian tạo |
| `updatedAt` | datetime | Yes | Thời gian cập nhật |

---

## 4. Module 3 Response Convention

Các response dưới đây tuân theo format chung của dự án.

### Success Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

### Module 3 Error Example

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Fee type not found",
  "errors": [
    {
      "field": null,
      "code": "FEE_TYPE_NOT_FOUND",
      "message": "Fee type not found"
    }
  ],
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

# 5. Fee Types API

## 5.1. Get All Fee Types

```http
GET /api/fee-types
```

### Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `isActive` | boolean | No | Lọc trạng thái hoạt động |
| `calculationType` | string | No | Lọc theo `per_m2`, `fixed`, `voluntary` |
| `pageNumber` | number | No | Trang hiện tại; mặc định `1` |
| `pageSize` | number | No | Số phần tử mỗi trang; mặc định `20` |

### Success Response — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fee types retrieved successfully",
  "data": [
    {
      "id": "fee-type-001",
      "name": "Phí quản lý",
      "code": "MANAGEMENT_FEE",
      "description": "Phí quản lý vận hành chung cư",
      "calculationType": "per_m2",
      "unit": "VND/m2",
      "isActive": true,
      "currentPrice": {
        "id": "price-history-001",
        "unitPrice": "8000.00",
        "effectiveFrom": "2026-01-01",
        "effectiveTo": null
      }
    }
  ],
  "pagination": {
    "pageNumber": 1,
    "pageSize": 20,
    "totalRecords": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

## 5.2. Create Fee Type

```http
POST /api/fee-types
```

### Request Body

```json
{
  "name": "Phí quản lý",
  "code": "MANAGEMENT_FEE",
  "description": "Phí quản lý vận hành chung cư",
  "calculationType": "per_m2",
  "unit": "VND/m2",
  "initialUnitPrice": "8000.00",
  "effectiveFrom": "2026-01-01"
}
```

### Validation Rules

| Field | Rule |
| --- | --- |
| `name` | Bắt buộc, không được để trống |
| `code` | Bắt buộc, duy nhất trong hệ thống |
| `calculationType` | Chỉ nhận `per_m2`, `fixed`, `voluntary` |
| `initialUnitPrice` | Decimal hợp lệ và không âm |
| `effectiveFrom` | Ngày hợp lệ |

### Success Response — `201 Created`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Fee type created successfully",
  "data": {
    "id": "fee-type-001",
    "name": "Phí quản lý",
    "code": "MANAGEMENT_FEE",
    "calculationType": "per_m2",
    "unit": "VND/m2",
    "isActive": true,
    "currentPrice": {
      "id": "price-history-001",
      "unitPrice": "8000.00",
      "effectiveFrom": "2026-01-01",
      "effectiveTo": null
    }
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

## 5.3. Get Fee Type Detail

```http
GET /api/fee-types/:id
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fee type retrieved successfully",
  "data": {
    "id": "fee-type-001",
    "name": "Phí quản lý",
    "code": "MANAGEMENT_FEE",
    "description": "Phí quản lý vận hành chung cư",
    "calculationType": "per_m2",
    "unit": "VND/m2",
    "isActive": true,
    "currentPrice": {
      "id": "price-history-002",
      "unitPrice": "9000.00",
      "effectiveFrom": "2026-06-01",
      "effectiveTo": null
    }
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

## 5.4. Update Fee Type Metadata

Endpoint này chỉ cập nhật thông tin loại phí, không thay đổi đơn giá.

```http
PATCH /api/fee-types/:id
```

### Request Body

```json
{
  "name": "Phí quản lý vận hành",
  "description": "Phí quản lý và bảo trì khu vực chung",
  "isActive": true
}
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fee type updated successfully",
  "data": {
    "id": "fee-type-001",
    "name": "Phí quản lý vận hành",
    "description": "Phí quản lý và bảo trì khu vực chung",
    "isActive": true
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

## 5.5. Deactivate Fee Type

Không xóa cứng loại phí từng được dùng trong kỳ phí hoặc hóa đơn; endpoint chuyển `isActive` về `false`.

```http
DELETE /api/fee-types/:id
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fee type deactivated successfully",
  "data": {
    "id": "fee-type-001",
    "isActive": false
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

# 6. Fee Type Price History API

## 6.1. Get Price History of a Fee Type

```http
GET /api/fee-types/:id/price-history
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fee price history retrieved successfully",
  "data": [
    {
      "id": "price-history-001",
      "feeTypeId": "fee-type-001",
      "unitPrice": "8000.00",
      "effectiveFrom": "2026-01-01",
      "effectiveTo": "2026-05-31"
    },
    {
      "id": "price-history-002",
      "feeTypeId": "fee-type-001",
      "unitPrice": "9000.00",
      "effectiveFrom": "2026-06-01",
      "effectiveTo": null
    }
  ],
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

## 6.2. Create New Price Version

Khi admin thay đổi giá, hệ thống tạo version mới thay vì ghi đè bản ghi lịch sử.

```http
POST /api/fee-types/:id/price-history
```

### Request Body

```json
{
  "unitPrice": "9000.00",
  "effectiveFrom": "2026-06-01"
}
```

### Processing Rules

1. Kiểm tra loại phí tồn tại.
2. Kiểm tra `unitPrice` và `effectiveFrom` hợp lệ.
3. Đóng version đang áp dụng bằng cách đặt `effectiveTo` là ngày ngay trước `effectiveFrom` mới.
4. Tạo bản ghi mới trong `fee_type_price_history`.
5. Không thay đổi version giá được tham chiếu bởi các kỳ phí đã ở trạng thái `active` hoặc `closed`.

### Success Response — `201 Created`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "New fee price version created successfully",
  "data": {
    "id": "price-history-002",
    "feeTypeId": "fee-type-001",
    "unitPrice": "9000.00",
    "effectiveFrom": "2026-06-01",
    "effectiveTo": null
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

# 7. Fee Periods API

## 7.1. Get All Fee Periods

```http
GET /api/fee-periods
```

### Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `month` | number | No | Lọc theo tháng |
| `year` | number | No | Lọc theo năm |
| `status` | string | No | `draft`, `active`, `closed` |
| `pageNumber` | number | No | Trang hiện tại |
| `pageSize` | number | No | Số item mỗi trang |

### Success Response — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fee periods retrieved successfully",
  "data": [
    {
      "id": "fee-period-2026-06",
      "name": "Phí tháng 06/2026",
      "month": 6,
      "year": 2026,
      "startDate": "2026-06-01",
      "endDate": "2026-06-30",
      "dueDate": "2026-07-10",
      "status": "active"
    }
  ],
  "pagination": {
    "pageNumber": 1,
    "pageSize": 20,
    "totalRecords": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

## 7.2. Create Fee Period

```http
POST /api/fee-periods
```

### Request Body

```json
{
  "name": "Phí tháng 06/2026",
  "month": 6,
  "year": 2026,
  "startDate": "2026-06-01",
  "endDate": "2026-06-30",
  "dueDate": "2026-07-10",
  "feeItems": [
    {
      "feeTypeId": "fee-type-001",
      "priceHistoryId": "price-history-002",
      "isRequired": true
    },
    {
      "feeTypeId": "fee-type-002",
      "priceHistoryId": "price-history-010",
      "isRequired": true
    },
    {
      "feeTypeId": "fee-type-003",
      "priceHistoryId": "price-history-015",
      "isRequired": false
    }
  ]
}
```

### Validation Rules

| Rule |
| --- |
| Không được tạo hai kỳ phí trùng `month` và `year` |
| `startDate` phải nhỏ hơn hoặc bằng `endDate` |
| `dueDate` không được trước `endDate` |
| Mỗi `feeTypeId` chỉ xuất hiện một lần trong một kỳ phí |
| `priceHistoryId` phải thuộc đúng `feeTypeId` |
| Version giá phải có hiệu lực trong khoảng thời gian kỳ phí |

### Success Response — `201 Created`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Fee period created successfully",
  "data": {
    "id": "fee-period-2026-06",
    "name": "Phí tháng 06/2026",
    "month": 6,
    "year": 2026,
    "status": "draft"
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

## 7.3. Get Fee Period Detail — Integration Endpoint for Module 4

```http
GET /api/fee-periods/:id
```

### Required Data for Module 4

Response bao gồm:

- Thông tin kỳ thu phí.
- Danh sách `feeItems` áp dụng trong kỳ.
- `calculationType` và `unit` của từng loại phí.
- `priceHistoryId` và chi tiết version đơn giá.
- Cờ `isRequired` để phân biệt phí bắt buộc và đóng góp tự nguyện.

### Success Response — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fee period retrieved successfully",
  "data": {
    "id": "fee-period-2026-06",
    "name": "Phí tháng 06/2026",
    "month": 6,
    "year": 2026,
    "startDate": "2026-06-01",
    "endDate": "2026-06-30",
    "dueDate": "2026-07-10",
    "status": "active",
    "feeItems": [
      {
        "id": "fee-period-fee-type-001",
        "priceHistoryId": "price-history-002",
        "feeType": {
          "id": "fee-type-001",
          "code": "MANAGEMENT_FEE",
          "name": "Phí quản lý",
          "calculationType": "per_m2",
          "unit": "VND/m2"
        },
        "priceVersion": {
          "id": "price-history-002",
          "unitPrice": "9000.00",
          "effectiveFrom": "2026-06-01",
          "effectiveTo": null
        },
        "isRequired": true
      },
      {
        "id": "fee-period-fee-type-002",
        "priceHistoryId": "price-history-010",
        "feeType": {
          "id": "fee-type-002",
          "code": "SERVICE_FEE",
          "name": "Phí dịch vụ",
          "calculationType": "fixed",
          "unit": "VND/household"
        },
        "priceVersion": {
          "id": "price-history-010",
          "unitPrice": "100000.00",
          "effectiveFrom": "2026-01-01",
          "effectiveTo": null
        },
        "isRequired": true
      },
      {
        "id": "fee-period-fee-type-003",
        "priceHistoryId": "price-history-015",
        "feeType": {
          "id": "fee-type-003",
          "code": "CHARITY_FUND",
          "name": "Quỹ từ thiện",
          "calculationType": "voluntary",
          "unit": "VND"
        },
        "priceVersion": {
          "id": "price-history-015",
          "unitPrice": "0.00",
          "effectiveFrom": "2026-01-01",
          "effectiveTo": null
        },
        "isRequired": false
      }
    ]
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

### Example Calculation Used by Module 4

Với hộ dân có diện tích tính phí là `70 m²`:

| Fee Type | Calculation | Amount |
| --- | --- | --- |
| Phí quản lý | `9000.00 × 70` | `630000.00 VND` |
| Phí dịch vụ | `100000.00` | `100000.00 VND` |
| Quỹ từ thiện | Cư dân lựa chọn | Không tự động cộng |

---

## 7.4. Update Draft Fee Period

Chỉ cho phép sửa kỳ phí ở trạng thái `draft`.

```http
PATCH /api/fee-periods/:id
```

### Request Body

```json
{
  "dueDate": "2026-07-15",
  "feeItems": [
    {
      "feeTypeId": "fee-type-001",
      "priceHistoryId": "price-history-002",
      "isRequired": true
    }
  ]
}
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fee period updated successfully",
  "data": {
    "id": "fee-period-2026-06",
    "status": "draft"
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

## 7.5. Activate Fee Period

Sau khi kỳ phí chuyển sang `active`, danh sách phí và version giá đã chốt không được thay đổi.

```http
POST /api/fee-periods/:id/activate
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fee period activated successfully",
  "data": {
    "id": "fee-period-2026-06",
    "status": "active"
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

## 7.6. Delete Draft Fee Period

Chỉ cho phép xóa kỳ phí ở trạng thái `draft`.

```http
DELETE /api/fee-periods/:id
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Draft fee period deleted successfully",
  "data": {
    "id": "fee-period-2026-06"
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

# 8. Utility Invoices API

> `utility_invoices` lưu dữ liệu phí tiện ích đầu vào theo hộ dân và kỳ phí. Module 4 sử dụng các bản ghi `confirmed` để tổng hợp hóa đơn cuối cùng.

## 8.1. Get Utility Invoices

```http
GET /api/utility-invoices
```

### Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `feePeriodId` | UUID | No | Lọc theo kỳ phí |
| `householdId` | UUID | No | Lọc theo hộ dân |
| `utilityType` | string | No | `electricity`, `water`, `internet` |
| `status` | string | No | `draft`, `confirmed` |
| `pageNumber` | number | No | Trang hiện tại |
| `pageSize` | number | No | Số item mỗi trang |

### Success Response — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Utility invoices retrieved successfully",
  "data": [
    {
      "id": "utility-invoice-001",
      "feePeriodId": "fee-period-2026-06",
      "householdId": "household-A101",
      "utilityType": "water",
      "previousReading": "120.00",
      "currentReading": "132.00",
      "usageAmount": "12.00",
      "unitPrice": "15000.00",
      "totalAmount": "180000.00",
      "status": "confirmed"
    }
  ],
  "pagination": {
    "pageNumber": 1,
    "pageSize": 20,
    "totalRecords": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

## 8.2. Create Utility Invoice

```http
POST /api/utility-invoices
```

### Request Body

```json
{
  "feePeriodId": "fee-period-2026-06",
  "householdId": "household-A101",
  "utilityType": "water",
  "previousReading": "120.00",
  "currentReading": "132.00",
  "unitPrice": "15000.00"
}
```

### Processing Rule

```txt
usageAmount = currentReading - previousReading
totalAmount = usageAmount × unitPrice
```

Các phép tính tiền phải dùng decimal arithmetic.

### Success Response — `201 Created`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Utility invoice created successfully",
  "data": {
    "id": "utility-invoice-001",
    "feePeriodId": "fee-period-2026-06",
    "householdId": "household-A101",
    "utilityType": "water",
    "previousReading": "120.00",
    "currentReading": "132.00",
    "usageAmount": "12.00",
    "unitPrice": "15000.00",
    "totalAmount": "180000.00",
    "status": "draft"
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

## 8.3. Update Utility Invoice

Chỉ cho phép sửa utility invoice ở trạng thái `draft`.

```http
PATCH /api/utility-invoices/:id
```

### Request Body

```json
{
  "currentReading": "134.00",
  "unitPrice": "15000.00"
}
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Utility invoice updated successfully",
  "data": {
    "id": "utility-invoice-001",
    "usageAmount": "14.00",
    "totalAmount": "210000.00",
    "status": "draft"
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

## 8.4. Confirm Utility Invoice

Sau khi chuyển sang `confirmed`, dữ liệu tiện ích không được sửa để Module 4 sử dụng khi tạo hóa đơn.

```http
POST /api/utility-invoices/:id/confirm
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Utility invoice confirmed successfully",
  "data": {
    "id": "utility-invoice-001",
    "status": "confirmed"
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

## 8.5. Delete Utility Invoice

Chỉ cho phép xóa utility invoice ở trạng thái `draft`.

```http
DELETE /api/utility-invoices/:id
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Draft utility invoice deleted successfully",
  "data": {
    "id": "utility-invoice-001"
  },
  "timestamp": "2026-05-31T10:30:45.123Z"
}
```

---

# 9. Module 3 Error Codes

Các lỗi Module 3 dùng format lỗi chung ở mục 4 của phần này.

| HTTP Status | Error Code | Description |
| --- | --- | --- |
| `400` | `VALIDATION_ERROR` | Dữ liệu request không hợp lệ |
| `401` | `UNAUTHORIZED` | Token không tồn tại, không hợp lệ hoặc hết hạn |
| `403` | `FORBIDDEN` | Người dùng không có quyền thực hiện thao tác |
| `404` | `FEE_TYPE_NOT_FOUND` | Không tìm thấy loại phí |
| `404` | `PRICE_HISTORY_NOT_FOUND` | Không tìm thấy version giá |
| `404` | `FEE_PERIOD_NOT_FOUND` | Không tìm thấy kỳ phí |
| `404` | `UTILITY_INVOICE_NOT_FOUND` | Không tìm thấy dữ liệu tiện ích |
| `409` | `FEE_TYPE_CODE_ALREADY_EXISTS` | Mã loại phí đã tồn tại |
| `409` | `FEE_PERIOD_ALREADY_EXISTS` | Kỳ phí của tháng và năm này đã tồn tại |
| `409` | `PRICE_VERSION_OVERLAP` | Khoảng hiệu lực của version giá bị trùng |
| `409` | `ACTIVE_FEE_PERIOD_CANNOT_BE_UPDATED` | Không thể sửa kỳ phí đang `active` |
| `409` | `CONFIRMED_UTILITY_INVOICE_CANNOT_BE_UPDATED` | Không thể sửa dữ liệu tiện ích đã `confirmed` |

---

# 10. Database Schema Implemented in Sprint 1

## 10.1. Table: `fee_types`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID / `CHAR(36)` | Primary Key |
| `name` | `VARCHAR(100)` | NOT NULL |
| `code` | `VARCHAR(50)` | UNIQUE, NOT NULL |
| `description` | TEXT | Nullable |
| `calculation_type` | ENUM | `per_m2`, `fixed`, `voluntary`; NOT NULL |
| `unit` | `VARCHAR(30)` | NOT NULL |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `true` |
| `created_at` | DATETIME | NOT NULL, DEFAULT current timestamp |
| `updated_at` | DATETIME | NOT NULL, DEFAULT current timestamp |

## 10.2. Table: `fee_type_price_history`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID / `CHAR(36)` | Primary Key |
| `fee_type_id` | UUID / `CHAR(36)` | Foreign Key → `fee_types.id`, NOT NULL |
| `unit_price` | `DECIMAL(15,2)` | NOT NULL |
| `effective_from` | DATE | NOT NULL |
| `effective_to` | DATE | Nullable |
| `created_by` | UUID / `CHAR(36)` | Nullable in Sprint 1; FK pending Module 1 |
| `created_at` | DATETIME | NOT NULL, DEFAULT current timestamp |
| `updated_at` | DATETIME | NOT NULL, DEFAULT current timestamp |

**Indexes / Relationships:**

```txt
INDEX(fee_type_id)
UNIQUE(fee_type_id, effective_from)
ON DELETE fee_types → RESTRICT
```

## 10.3. Table: `fee_periods`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID / `CHAR(36)` | Primary Key |
| `name` | `VARCHAR(100)` | NOT NULL |
| `month` | INTEGER | NOT NULL |
| `year` | INTEGER | NOT NULL |
| `start_date` | DATE | NOT NULL |
| `end_date` | DATE | NOT NULL |
| `due_date` | DATE | NOT NULL |
| `status` | ENUM | `draft`, `active`, `closed`; DEFAULT `draft` |
| `created_at` | DATETIME | NOT NULL, DEFAULT current timestamp |
| `updated_at` | DATETIME | NOT NULL, DEFAULT current timestamp |

**Indexes:**

```txt
UNIQUE(month, year)
INDEX(status)
```

## 10.4. Table: `fee_period_fee_types`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID / `CHAR(36)` | Primary Key |
| `fee_period_id` | UUID / `CHAR(36)` | Foreign Key → `fee_periods.id`, NOT NULL |
| `fee_type_id` | UUID / `CHAR(36)` | Foreign Key → `fee_types.id`, NOT NULL |
| `price_history_id` | UUID / `CHAR(36)` | Foreign Key → `fee_type_price_history.id`, NOT NULL |
| `is_required` | BOOLEAN | NOT NULL, DEFAULT `true` |
| `created_at` | DATETIME | NOT NULL, DEFAULT current timestamp |
| `updated_at` | DATETIME | NOT NULL, DEFAULT current timestamp |

**Indexes / Relationships:**

```txt
UNIQUE(fee_period_id, fee_type_id)
INDEX(price_history_id)
ON DELETE fee_periods → CASCADE
ON DELETE fee_types → RESTRICT
ON DELETE fee_type_price_history → RESTRICT
```

## 10.5. Table: `utility_invoices`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID / `CHAR(36)` | Primary Key |
| `fee_period_id` | UUID / `CHAR(36)` | Foreign Key → `fee_periods.id`, NOT NULL |
| `household_id` | UUID / `CHAR(36)` | NOT NULL; FK pending Module 2 |
| `utility_type` | ENUM | `electricity`, `water`, `internet`; NOT NULL |
| `previous_reading` | `DECIMAL(15,2)` | Nullable |
| `current_reading` | `DECIMAL(15,2)` | Nullable |
| `usage_amount` | `DECIMAL(15,2)` | NOT NULL |
| `unit_price` | `DECIMAL(15,2)` | NOT NULL |
| `total_amount` | `DECIMAL(15,2)` | NOT NULL |
| `status` | ENUM | `draft`, `confirmed`; DEFAULT `draft` |
| `created_at` | DATETIME | NOT NULL, DEFAULT current timestamp |
| `updated_at` | DATETIME | NOT NULL, DEFAULT current timestamp |

**Indexes / Relationships:**

```txt
INDEX(fee_period_id)
INDEX(household_id)
UNIQUE(fee_period_id, household_id, utility_type)
ON DELETE fee_periods → CASCADE
```

---

# 11. Module 3 Endpoint Summary

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/fee-types` | Lấy danh sách loại phí |
| `POST` | `/api/fee-types` | Tạo loại phí mới |
| `GET` | `/api/fee-types/:id` | Lấy chi tiết loại phí |
| `PATCH` | `/api/fee-types/:id` | Cập nhật metadata loại phí |
| `DELETE` | `/api/fee-types/:id` | Ngừng sử dụng loại phí |
| `GET` | `/api/fee-types/:id/price-history` | Lấy lịch sử đơn giá |
| `POST` | `/api/fee-types/:id/price-history` | Tạo version giá mới |
| `GET` | `/api/fee-periods` | Lấy danh sách kỳ phí |
| `POST` | `/api/fee-periods` | Tạo kỳ phí |
| `GET` | `/api/fee-periods/:id` | Lấy cấu hình kỳ phí phục vụ Module 4 |
| `PATCH` | `/api/fee-periods/:id` | Cập nhật kỳ phí nháp |
| `POST` | `/api/fee-periods/:id/activate` | Kích hoạt kỳ phí |
| `DELETE` | `/api/fee-periods/:id` | Xóa kỳ phí nháp |
| `GET` | `/api/utility-invoices` | Lấy danh sách phí tiện ích |
| `POST` | `/api/utility-invoices` | Tạo phí tiện ích |
| `PATCH` | `/api/utility-invoices/:id` | Cập nhật phí tiện ích nháp |
| `POST` | `/api/utility-invoices/:id/confirm` | Xác nhận phí tiện ích |
| `DELETE` | `/api/utility-invoices/:id` | Xóa phí tiện ích nháp |

---

# 12. Integration Note for Module 4

Module 4 gọi:

```http
GET /api/fee-periods/:id
```

Module 3 cam kết response contract cung cấp:

1. Thông tin kỳ phí và trạng thái `active`.
2. Danh sách `feeItems`.
3. `calculationType`: `per_m2`, `fixed`, `voluntary`.
4. `unitPrice` dưới dạng decimal string.
5. `priceHistoryId` cùng chi tiết `priceVersion`, bảo toàn lịch sử giá.
6. `isRequired` để không tự động bắt buộc khoản đóng góp tự nguyện.

Cách tính dự kiến phía Module 4:

```txt
per_m2 amount = Decimal(unitPrice) × Decimal(area)
fixed amount = Decimal(unitPrice)
voluntary amount = resident-selected amount, nếu có
```

Khi kỳ phí đã ở trạng thái `active`, Module 3 không cho phép thay đổi `feeItems` hoặc `priceHistoryId`.

> **Coordination Pending:** Chinh (Module 4) cần xác nhận response format trên đủ để thực hiện generate hóa đơn tự động.

---

# 13. Sprint 1 Implementation Status

| Requirement | Status | Note |
| --- | --- | --- |
| 05 Sequelize migrations chạy thành công | Completed | Đã tạo và verify trên MySQL local |
| `decimal.js` được áp dụng vào helper tính phí | Completed | `calculateFee` và unit tests đã pass |
| Route skeleton cho Module 3 | Completed | Đã test các route GET chính tại `/api/...` |
| Middleware `authenticate` | Pending Module 1 | `src/middleware/authenticate.js` hiện vẫn là placeholder |
| Response format với Module 4 | Pending confirmation | Chờ Chinh xác nhận endpoint `GET /api/fee-periods/:id` |
