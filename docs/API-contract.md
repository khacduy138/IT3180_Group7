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

**Module Owner:** Module 3
**Purpose:** Quản lý cấu hình các loại phí, lịch sử đơn giá, kỳ thu phí và dữ liệu phí tiện ích phục vụ Module 4 tạo hóa đơn tự động.

> **Integration Requirement:** Module 4 cần sử dụng endpoint `GET /fee-periods/:id` để lấy đầy đủ cấu hình phí tại một kỳ thu phí cụ thể. Response của endpoint này phải chứa loại phí, cách tính phí, đơn giá áp dụng và thông tin version giá để hóa đơn cũ không bị thay đổi khi admin cập nhật giá mới.

---

## 1. Authentication

Tất cả endpoints trong Module 3 yêu cầu JWT token:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Authentication Errors

| Status | Code           | Meaning                                      |
| ------ | -------------- | -------------------------------------------- |
| `401`  | `UNAUTHORIZED` | Không có token hoặc token không hợp lệ       |
| `403`  | `FORBIDDEN`    | Người dùng không có quyền thực hiện thao tác |

---

## 2. Business Overview

Module 3 quản lý cấu hình phí của hệ thống chung cư. Module này không chịu trách nhiệm ghi nhận thanh toán của cư dân và không trực tiếp tạo hóa đơn cuối cùng. Module 4 sẽ sử dụng dữ liệu cấu hình từ Module 3 để generate hóa đơn.

### 2.1. Supported Fee Calculation Types

Hệ thống hỗ trợ ba cách tính phí chính:

| Calculation Type | Meaning                         | Calculation Formula         | Example                             |
| ---------------- | ------------------------------- | --------------------------- | ----------------------------------- |
| `per_m2`         | Phí tính theo diện tích căn hộ  | `unitPrice × apartmentArea` | Phí quản lý: `8,000 VND/m² × 70 m²` |
| `fixed`          | Phí cố định cho mỗi hộ gia đình | `fixedAmount`               | Phí gửi xe máy: `100,000 VND/tháng` |
| `voluntary`      | Khoản đóng góp tự nguyện        | Số tiền do cư dân lựa chọn  | Quỹ từ thiện, quỹ cộng đồng         |

### 2.2. Versioning Requirement

Khi admin thay đổi đơn giá của một loại phí, hệ thống **không được sửa trực tiếp giá đã áp dụng trong kỳ phí cũ**.

Ví dụ:

* Tháng 05/2026, phí quản lý là `8,000 VND/m²`.
* Tháng 06/2026, admin cập nhật thành `9,000 VND/m²`.
* Hóa đơn tháng 05/2026 vẫn phải được tính theo `8,000 VND/m²`.

Để đảm bảo điều này, mỗi lần thay đổi giá sẽ tạo một bản ghi mới trong bảng:

```txt
fee_type_price_history
```

Mỗi kỳ thu phí sẽ tham chiếu tới đúng phiên bản giá đã được áp dụng tại thời điểm kỳ phí được tạo hoặc publish.

---

## 3. Core Entities

### 3.1. Fee Type

Đại diện cho một loại phí trong hệ thống.

| Field             | Type     | Required | Description                                   |
| ----------------- | -------- | -------- | --------------------------------------------- |
| `id`              | UUID     | Yes      | ID của loại phí                               |
| `name`            | string   | Yes      | Tên loại phí                                  |
| `code`            | string   | Yes      | Mã duy nhất của loại phí                      |
| `description`     | string   | No       | Mô tả loại phí                                |
| `calculationType` | enum     | Yes      | `per_m2`, `fixed`, hoặc `voluntary`           |
| `unit`            | string   | Yes      | Đơn vị tính: `VND/m2`, `VND/household`, `VND` |
| `isActive`        | boolean  | Yes      | Loại phí còn được sử dụng hay không           |
| `createdAt`       | datetime | Yes      | Thời gian tạo                                 |
| `updatedAt`       | datetime | Yes      | Thời gian cập nhật gần nhất                   |

### 3.2. Fee Type Price History

Lưu lịch sử giá của từng loại phí.

| Field           | Type      | Required | Description                                         |
| --------------- | --------- | -------- | --------------------------------------------------- |
| `id`            | UUID      | Yes      | ID của bản ghi giá                                  |
| `feeTypeId`     | UUID      | Yes      | ID của loại phí                                     |
| `unitPrice`     | number    | Yes      | Đơn giá áp dụng                                     |
| `effectiveFrom` | date      | Yes      | Ngày bắt đầu áp dụng                                |
| `effectiveTo`   | date/null | No       | Ngày kết thúc áp dụng; `null` nếu đang còn hiệu lực |
| `createdBy`     | UUID      | Yes      | Admin tạo phiên bản giá                             |
| `createdAt`     | datetime  | Yes      | Thời gian tạo                                       |

### 3.3. Fee Period

Đại diện cho một kỳ thu phí, thường theo tháng.

| Field       | Type     | Required | Description                           |
| ----------- | -------- | -------- | ------------------------------------- |
| `id`        | UUID     | Yes      | ID kỳ thu phí                         |
| `name`      | string   | Yes      | Tên kỳ phí, ví dụ `Phí tháng 06/2026` |
| `month`     | number   | Yes      | Tháng áp dụng                         |
| `year`      | number   | Yes      | Năm áp dụng                           |
| `startDate` | date     | Yes      | Ngày bắt đầu kỳ phí                   |
| `endDate`   | date     | Yes      | Ngày kết thúc kỳ phí                  |
| `dueDate`   | date     | Yes      | Hạn thanh toán                        |
| `status`    | enum     | Yes      | `draft`, `published`, `closed`        |
| `createdAt` | datetime | Yes      | Thời gian tạo                         |
| `updatedAt` | datetime | Yes      | Thời gian cập nhật                    |

### 3.4. Fee Period Item

Danh sách loại phí được áp dụng trong một kỳ thu phí.

| Field            | Type    | Required | Description                |
| ---------------- | ------- | -------- | -------------------------- |
| `id`             | UUID    | Yes      | ID item                    |
| `feePeriodId`    | UUID    | Yes      | ID kỳ thu phí              |
| `feeTypeId`      | UUID    | Yes      | ID loại phí                |
| `priceHistoryId` | UUID    | Yes      | Phiên bản giá được sử dụng |
| `isRequired`     | boolean | Yes      | Phí bắt buộc hay tự nguyện |

### 3.5. Utility Invoice

Dữ liệu phí tiện ích được ghi nhận theo căn hộ và kỳ thu phí, phục vụ Module 4 generate hóa đơn cư dân.

| Field             | Type     | Required | Description                                 |
| ----------------- | -------- | -------- | ------------------------------------------- |
| `id`              | UUID     | Yes      | ID bản ghi tiện ích                         |
| `feePeriodId`     | UUID     | Yes      | Kỳ thu phí tương ứng                        |
| `apartmentId`     | UUID     | Yes      | Căn hộ sử dụng tiện ích                     |
| `utilityType`     | enum     | Yes      | `water`, `electricity`, `internet`, `other` |
| `previousReading` | number   | No       | Chỉ số đầu kỳ                               |
| `currentReading`  | number   | No       | Chỉ số cuối kỳ                              |
| `usageAmount`     | number   | Yes      | Lượng tiêu thụ                              |
| `unitPrice`       | number   | Yes      | Đơn giá sử dụng                             |
| `totalAmount`     | number   | Yes      | Tổng tiền tiện ích                          |
| `status`          | enum     | Yes      | `draft`, `confirmed`                        |
| `createdAt`       | datetime | Yes      | Thời gian tạo                               |

---

# 4. Fee Types API

## 4.1. Get All Fee Types

Lấy danh sách tất cả loại phí.

```http
GET /fee-types
```

### Query Parameters

| Parameter         | Type    | Required | Description                   |
| ----------------- | ------- | -------- | ----------------------------- |
| `isActive`        | boolean | No       | Lọc theo trạng thái hoạt động |
| `calculationType` | string  | No       | Lọc theo loại tính phí        |
| `page`            | number  | No       | Trang hiện tại                |
| `limit`           | number  | No       | Số item mỗi trang             |

### Success Response — `200 OK`

```json
{
  "success": true,
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
        "unitPrice": 8000,
        "effectiveFrom": "2026-01-01",
        "effectiveTo": null
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

## 4.2. Create Fee Type

Tạo loại phí mới.

```http
POST /fee-types
```

### Request Body

```json
{
  "name": "Phí quản lý",
  "code": "MANAGEMENT_FEE",
  "description": "Phí quản lý vận hành chung cư",
  "calculationType": "per_m2",
  "unit": "VND/m2",
  "initialUnitPrice": 8000,
  "effectiveFrom": "2026-01-01"
}
```

### Validation Rules

| Field              | Rule                                    |
| ------------------ | --------------------------------------- |
| `name`             | Không được để trống                     |
| `code`             | Bắt buộc, duy nhất trong hệ thống       |
| `calculationType`  | Chỉ nhận `per_m2`, `fixed`, `voluntary` |
| `initialUnitPrice` | Phải lớn hơn hoặc bằng `0`              |
| `effectiveFrom`    | Phải là ngày hợp lệ                     |

### Success Response — `201 Created`

```json
{
  "success": true,
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
      "unitPrice": 8000,
      "effectiveFrom": "2026-01-01",
      "effectiveTo": null
    }
  }
}
```

---

## 4.3. Get Fee Type Detail

```http
GET /fee-types/:id
```

### Success Response — `200 OK`

```json
{
  "success": true,
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
      "unitPrice": 9000,
      "effectiveFrom": "2026-06-01",
      "effectiveTo": null
    }
  }
}
```

---

## 4.4. Update Fee Type Information

Chỉ cập nhật metadata của loại phí. Không sử dụng endpoint này để thay đổi đơn giá.

```http
PATCH /fee-types/:id
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
  "message": "Fee type updated successfully",
  "data": {
    "id": "fee-type-001",
    "name": "Phí quản lý vận hành",
    "description": "Phí quản lý và bảo trì khu vực chung",
    "isActive": true
  }
}
```

---

## 4.5. Deactivate Fee Type

Không xóa cứng loại phí đã từng được sử dụng trong kỳ thu phí hoặc hóa đơn. Endpoint này chỉ chuyển loại phí về trạng thái không hoạt động.

```http
DELETE /fee-types/:id
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Fee type deactivated successfully"
}
```

---

# 5. Fee Type Price History API

## 5.1. Get Price History of a Fee Type

```http
GET /fee-types/:id/price-history
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "price-history-001",
      "feeTypeId": "fee-type-001",
      "unitPrice": 8000,
      "effectiveFrom": "2026-01-01",
      "effectiveTo": "2026-05-31"
    },
    {
      "id": "price-history-002",
      "feeTypeId": "fee-type-001",
      "unitPrice": 9000,
      "effectiveFrom": "2026-06-01",
      "effectiveTo": null
    }
  ]
}
```

---

## 5.2. Create New Price Version

Khi admin thay đổi giá, hệ thống tạo một price version mới thay vì ghi đè bản ghi cũ.

```http
POST /fee-types/:id/price-history
```

### Request Body

```json
{
  "unitPrice": 9000,
  "effectiveFrom": "2026-06-01"
}
```

### Processing Rules

1. Kiểm tra loại phí tồn tại.
2. Kiểm tra `effectiveFrom` hợp lệ.
3. Đóng phiên bản giá hiện tại bằng cách cập nhật `effectiveTo` thành ngày ngay trước `effectiveFrom` mới.
4. Tạo bản ghi mới trong `fee_type_price_history`.
5. Không làm thay đổi các `fee_period` đã publish trước đó.

### Success Response — `201 Created`

```json
{
  "success": true,
  "message": "New fee price version created successfully",
  "data": {
    "id": "price-history-002",
    "feeTypeId": "fee-type-001",
    "unitPrice": 9000,
    "effectiveFrom": "2026-06-01",
    "effectiveTo": null
  }
}
```

---

# 6. Fee Periods API

## 6.1. Get All Fee Periods

```http
GET /fee-periods
```

### Query Parameters

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `month`   | number | No       | Lọc theo tháng                 |
| `year`    | number | No       | Lọc theo năm                   |
| `status`  | string | No       | `draft`, `published`, `closed` |
| `page`    | number | No       | Trang hiện tại                 |
| `limit`   | number | No       | Số item mỗi trang              |

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "fee-period-2026-06",
      "name": "Phí tháng 06/2026",
      "month": 6,
      "year": 2026,
      "startDate": "2026-06-01",
      "endDate": "2026-06-30",
      "dueDate": "2026-07-10",
      "status": "published"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

## 6.2. Create Fee Period

```http
POST /fee-periods
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

| Rule                                                        |
| ----------------------------------------------------------- |
| Không được tạo hai kỳ phí trùng `month` và `year`           |
| `startDate` phải nhỏ hơn hoặc bằng `endDate`                |
| `dueDate` không được trước `endDate`                        |
| Mỗi `feeTypeId` chỉ được xuất hiện một lần trong một kỳ phí |
| `priceHistoryId` phải thuộc đúng `feeTypeId`                |
| Price version phải có hiệu lực trong thời gian của kỳ phí   |

### Success Response — `201 Created`

```json
{
  "success": true,
  "message": "Fee period created successfully",
  "data": {
    "id": "fee-period-2026-06",
    "name": "Phí tháng 06/2026",
    "month": 6,
    "year": 2026,
    "status": "draft"
  }
}
```

---

## 6.3. Get Fee Period Detail — Integration Endpoint for Module 4

Endpoint này là endpoint trọng tâm để Module 4 tạo hóa đơn tự động.

```http
GET /fee-periods/:id
```

### Required Response Information for Module 4

Response phải bao gồm:

* Thông tin kỳ thu phí.
* Danh sách toàn bộ loại phí áp dụng trong kỳ.
* `calculationType` của từng loại phí.
* Đơn giá chính xác tại kỳ phí đó.
* `priceHistoryId` để đảm bảo versioning.
* Cờ `isRequired` để phân biệt phí bắt buộc và phí tự nguyện.

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "fee-period-2026-06",
    "name": "Phí tháng 06/2026",
    "month": 6,
    "year": 2026,
    "startDate": "2026-06-01",
    "endDate": "2026-06-30",
    "dueDate": "2026-07-10",
    "status": "published",
    "feeItems": [
      {
        "id": "fee-period-item-001",
        "feeType": {
          "id": "fee-type-001",
          "code": "MANAGEMENT_FEE",
          "name": "Phí quản lý",
          "calculationType": "per_m2",
          "unit": "VND/m2"
        },
        "priceVersion": {
          "id": "price-history-002",
          "unitPrice": 9000,
          "effectiveFrom": "2026-06-01",
          "effectiveTo": null
        },
        "isRequired": true
      },
      {
        "id": "fee-period-item-002",
        "feeType": {
          "id": "fee-type-002",
          "code": "PARKING_FEE",
          "name": "Phí gửi xe",
          "calculationType": "fixed",
          "unit": "VND/household"
        },
        "priceVersion": {
          "id": "price-history-010",
          "unitPrice": 100000,
          "effectiveFrom": "2026-01-01",
          "effectiveTo": null
        },
        "isRequired": true
      },
      {
        "id": "fee-period-item-003",
        "feeType": {
          "id": "fee-type-003",
          "code": "CHARITY_FUND",
          "name": "Quỹ từ thiện",
          "calculationType": "voluntary",
          "unit": "VND"
        },
        "priceVersion": {
          "id": "price-history-015",
          "unitPrice": 0,
          "effectiveFrom": "2026-01-01",
          "effectiveTo": null
        },
        "isRequired": false
      }
    ]
  }
}
```

### Example Calculation Used by Module 4

Với căn hộ có diện tích `70 m²`:

| Fee Type     | Calculation        | Amount                 |
| ------------ | ------------------ | ---------------------- |
| Phí quản lý  | `9000 × 70`        | `630000 VND`           |
| Phí gửi xe   | `100000`           | `100000 VND`           |
| Quỹ từ thiện | Do cư dân lựa chọn | Không tự động bắt buộc |

---

## 6.4. Update Draft Fee Period

Chỉ cho phép sửa kỳ phí khi trạng thái là `draft`.

```http
PATCH /fee-periods/:id
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
  "message": "Fee period updated successfully"
}
```

---

## 6.5. Publish Fee Period

Sau khi một kỳ phí được publish, thông tin cấu hình phí và version giá của kỳ đó không được thay đổi.

```http
POST /fee-periods/:id/publish
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Fee period published successfully",
  "data": {
    "id": "fee-period-2026-06",
    "status": "published"
  }
}
```

---

## 6.6. Delete Draft Fee Period

Chỉ cho phép xóa kỳ phí khi trạng thái là `draft`.

```http
DELETE /fee-periods/:id
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Draft fee period deleted successfully"
}
```

---

# 7. Utility Invoices API

> `utility-invoices` trong Module 3 lưu dữ liệu phí tiện ích đầu vào theo căn hộ và kỳ phí. Module 4 sử dụng dữ liệu này để tổng hợp vào hóa đơn cuối cùng của cư dân.

## 7.1. Get Utility Invoices

```http
GET /utility-invoices
```

### Query Parameters

| Parameter     | Type   | Required | Description                                 |
| ------------- | ------ | -------- | ------------------------------------------- |
| `feePeriodId` | UUID   | No       | Lọc theo kỳ phí                             |
| `apartmentId` | UUID   | No       | Lọc theo căn hộ                             |
| `utilityType` | string | No       | `water`, `electricity`, `internet`, `other` |
| `status`      | string | No       | `draft`, `confirmed`                        |

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "utility-invoice-001",
      "feePeriodId": "fee-period-2026-06",
      "apartmentId": "apartment-A101",
      "utilityType": "water",
      "previousReading": 120,
      "currentReading": 132,
      "usageAmount": 12,
      "unitPrice": 15000,
      "totalAmount": 180000,
      "status": "confirmed"
    }
  ]
}
```

---

## 7.2. Create Utility Invoice

```http
POST /utility-invoices
```

### Request Body

```json
{
  "feePeriodId": "fee-period-2026-06",
  "apartmentId": "apartment-A101",
  "utilityType": "water",
  "previousReading": 120,
  "currentReading": 132,
  "unitPrice": 15000
}
```

### Processing Rule

Hệ thống tự động tính:

```txt
usageAmount = currentReading - previousReading
totalAmount = usageAmount × unitPrice
```

### Success Response — `201 Created`

```json
{
  "success": true,
  "message": "Utility invoice created successfully",
  "data": {
    "id": "utility-invoice-001",
    "feePeriodId": "fee-period-2026-06",
    "apartmentId": "apartment-A101",
    "utilityType": "water",
    "previousReading": 120,
    "currentReading": 132,
    "usageAmount": 12,
    "unitPrice": 15000,
    "totalAmount": 180000,
    "status": "draft"
  }
}
```

---

## 7.3. Update Utility Invoice

Chỉ cho phép sửa utility invoice khi trạng thái là `draft`.

```http
PATCH /utility-invoices/:id
```

### Request Body

```json
{
  "currentReading": 134,
  "unitPrice": 15000
}
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Utility invoice updated successfully",
  "data": {
    "id": "utility-invoice-001",
    "usageAmount": 14,
    "totalAmount": 210000,
    "status": "draft"
  }
}
```

---

## 7.4. Confirm Utility Invoice

Sau khi confirmed, dữ liệu tiện ích không được sửa để Module 4 sử dụng khi generate hóa đơn.

```http
POST /utility-invoices/:id/confirm
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Utility invoice confirmed successfully",
  "data": {
    "id": "utility-invoice-001",
    "status": "confirmed"
  }
}
```

---

## 7.5. Delete Utility Invoice

Chỉ cho phép xóa utility invoice ở trạng thái `draft`.

```http
DELETE /utility-invoices/:id
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Draft utility invoice deleted successfully"
}
```

---

# 8. Error Codes

## 8.1. Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "FEE_TYPE_NOT_FOUND",
    "message": "Fee type not found",
    "details": null
  }
}
```

## 8.2. Common Errors

| HTTP Status | Error Code                                    | Description                                |
| ----------- | --------------------------------------------- | ------------------------------------------ |
| `400`       | `VALIDATION_ERROR`                            | Dữ liệu request không hợp lệ               |
| `401`       | `UNAUTHORIZED`                                | Token không tồn tại hoặc không hợp lệ      |
| `403`       | `FORBIDDEN`                                   | Không có quyền thực hiện thao tác          |
| `404`       | `FEE_TYPE_NOT_FOUND`                          | Không tìm thấy loại phí                    |
| `404`       | `PRICE_HISTORY_NOT_FOUND`                     | Không tìm thấy phiên bản giá               |
| `404`       | `FEE_PERIOD_NOT_FOUND`                        | Không tìm thấy kỳ phí                      |
| `404`       | `UTILITY_INVOICE_NOT_FOUND`                   | Không tìm thấy dữ liệu tiện ích            |
| `409`       | `FEE_TYPE_CODE_ALREADY_EXISTS`                | Mã loại phí đã tồn tại                     |
| `409`       | `FEE_PERIOD_ALREADY_EXISTS`                   | Kỳ phí của tháng và năm này đã tồn tại     |
| `409`       | `PRICE_VERSION_OVERLAP`                       | Khoảng hiệu lực của phiên bản giá bị trùng |
| `409`       | `PUBLISHED_FEE_PERIOD_CANNOT_BE_UPDATED`      | Không thể sửa kỳ phí đã publish            |
| `409`       | `CONFIRMED_UTILITY_INVOICE_CANNOT_BE_UPDATED` | Không thể sửa dữ liệu tiện ích đã xác nhận |

---

# 9. Suggested Database Schema

## 9.1. Table: `fee_types`

| Column             | Type      | Constraints                    |
| ------------------ | --------- | ------------------------------ |
| `id`               | UUID      | Primary Key                    |
| `name`             | VARCHAR   | NOT NULL                       |
| `code`             | VARCHAR   | UNIQUE, NOT NULL               |
| `description`      | TEXT      | Nullable                       |
| `calculation_type` | ENUM      | `per_m2`, `fixed`, `voluntary` |
| `unit`             | VARCHAR   | NOT NULL                       |
| `is_active`        | BOOLEAN   | DEFAULT `true`                 |
| `created_at`       | TIMESTAMP | NOT NULL                       |
| `updated_at`       | TIMESTAMP | NOT NULL                       |

## 9.2. Table: `fee_type_price_history`

| Column           | Type      | Constraints                  |
| ---------------- | --------- | ---------------------------- |
| `id`             | UUID      | Primary Key                  |
| `fee_type_id`    | UUID      | Foreign Key → `fee_types.id` |
| `unit_price`     | DECIMAL   | NOT NULL, `>= 0`             |
| `effective_from` | DATE      | NOT NULL                     |
| `effective_to`   | DATE      | Nullable                     |
| `created_by`     | UUID      | Foreign Key → user/admin     |
| `created_at`     | TIMESTAMP | NOT NULL                     |

## 9.3. Table: `fee_periods`

| Column       | Type      | Constraints                    |
| ------------ | --------- | ------------------------------ |
| `id`         | UUID      | Primary Key                    |
| `name`       | VARCHAR   | NOT NULL                       |
| `month`      | INTEGER   | NOT NULL                       |
| `year`       | INTEGER   | NOT NULL                       |
| `start_date` | DATE      | NOT NULL                       |
| `end_date`   | DATE      | NOT NULL                       |
| `due_date`   | DATE      | NOT NULL                       |
| `status`     | ENUM      | `draft`, `published`, `closed` |
| `created_at` | TIMESTAMP | NOT NULL                       |
| `updated_at` | TIMESTAMP | NOT NULL                       |

**Constraint:**

```txt
UNIQUE(month, year)
```

## 9.4. Table: `fee_period_items`

| Column             | Type    | Constraints                               |
| ------------------ | ------- | ----------------------------------------- |
| `id`               | UUID    | Primary Key                               |
| `fee_period_id`    | UUID    | Foreign Key → `fee_periods.id`            |
| `fee_type_id`      | UUID    | Foreign Key → `fee_types.id`              |
| `price_history_id` | UUID    | Foreign Key → `fee_type_price_history.id` |
| `is_required`      | BOOLEAN | NOT NULL                                  |

**Constraint:**

```txt
UNIQUE(fee_period_id, fee_type_id)
```

## 9.5. Table: `utility_invoices`

| Column             | Type      | Constraints                                 |
| ------------------ | --------- | ------------------------------------------- |
| `id`               | UUID      | Primary Key                                 |
| `fee_period_id`    | UUID      | Foreign Key → `fee_periods.id`              |
| `apartment_id`     | UUID      | Foreign Key → apartment                     |
| `utility_type`     | ENUM      | `water`, `electricity`, `internet`, `other` |
| `previous_reading` | DECIMAL   | Nullable                                    |
| `current_reading`  | DECIMAL   | Nullable                                    |
| `usage_amount`     | DECIMAL   | NOT NULL                                    |
| `unit_price`       | DECIMAL   | NOT NULL                                    |
| `total_amount`     | DECIMAL   | NOT NULL                                    |
| `status`           | ENUM      | `draft`, `confirmed`                        |
| `created_at`       | TIMESTAMP | NOT NULL                                    |
| `updated_at`       | TIMESTAMP | NOT NULL                                    |

---

# 10. Module 3 Endpoint Summary

| Method   | Endpoint                        | Purpose                              |
| -------- | ------------------------------- | ------------------------------------ |
| `GET`    | `/fee-types`                    | Lấy danh sách loại phí               |
| `POST`   | `/fee-types`                    | Tạo loại phí mới                     |
| `GET`    | `/fee-types/:id`                | Lấy chi tiết loại phí                |
| `PATCH`  | `/fee-types/:id`                | Cập nhật thông tin loại phí          |
| `DELETE` | `/fee-types/:id`                | Ngừng sử dụng loại phí               |
| `GET`    | `/fee-types/:id/price-history`  | Lấy lịch sử đơn giá                  |
| `POST`   | `/fee-types/:id/price-history`  | Tạo phiên bản giá mới                |
| `GET`    | `/fee-periods`                  | Lấy danh sách kỳ phí                 |
| `POST`   | `/fee-periods`                  | Tạo kỳ phí                           |
| `GET`    | `/fee-periods/:id`              | Lấy cấu hình kỳ phí phục vụ Module 4 |
| `PATCH`  | `/fee-periods/:id`              | Cập nhật kỳ phí nháp                 |
| `POST`   | `/fee-periods/:id/publish`      | Publish kỳ phí                       |
| `DELETE` | `/fee-periods/:id`              | Xóa kỳ phí nháp                      |
| `GET`    | `/utility-invoices`             | Lấy danh sách phí tiện ích           |
| `POST`   | `/utility-invoices`             | Tạo phí tiện ích                     |
| `PATCH`  | `/utility-invoices/:id`         | Cập nhật phí tiện ích nháp           |
| `POST`   | `/utility-invoices/:id/confirm` | Xác nhận phí tiện ích                |
| `DELETE` | `/utility-invoices/:id`         | Xóa phí tiện ích nháp                |

---

# 11. Integration Note for Module 4

Module 4 cần gọi:

```http
GET /fee-periods/:id
```

Module 3 cam kết endpoint này trả về:

1. Thông tin kỳ thu phí.
2. Danh sách các loại phí áp dụng.
3. Cách tính phí của từng loại: `per_m2`, `fixed`, `voluntary`.
4. Đơn giá đã được versioning tại thời điểm kỳ phí được publish.
5. `priceHistoryId` để hóa đơn giữ nguyên dữ liệu lịch sử.
6. Cờ `isRequired` để Module 4 không tự động bắt buộc các khoản đóng góp tự nguyện.

Module 4 có thể sử dụng response này để tính:

```txt
per_m2 amount = apartment area × unit price
fixed amount = unit price
voluntary amount = resident-selected amount, nếu có
```

Khi kỳ phí đã ở trạng thái `published`, Module 3 không cho phép thay đổi `feeItems` hoặc `priceHistoryId` của kỳ đó.
