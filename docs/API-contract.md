# 📋 API Contract - BlueMoon AMS

## Module 2: Household Management

**Document Status:** ✅ Draft  
**Last Updated:** 2026-05-15  
**Owner:** Duy (Module 2)  
**Reviewers:** Chính (Module 4), Tuấn (Module 1), Phương (Module 3)

---

## Table of Contents

1. [Common Response Format](#common-response-format)
2. [Authentication & Authorization](#authentication--authorization)
3. [Households Endpoints](#households-endpoints)
4. [Residents Endpoints](#residents-endpoints)
5. [Vehicles Endpoints](#vehicles-endpoints)
6. [Cross-Module Dependencies](#cross-module-dependencies)

---

## Common Response Format

### Success Response (2xx)
```json
{
  "data": {
    "id": 1,
    "name": "Gia đình Nguyễn",
    ...
  },
  "message": "Lấy thông tin hộ thành công",
  "timestamp": "2026-05-15T10:30:00Z"
}
```

### List Response with Pagination
```json
{
  "data": [
    { "id": 1, "name": "Hộ 101", ... },
    { "id": 2, "name": "Hộ 102", ... }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  },
  "timestamp": "2026-05-15T10:30:00Z"
}
```

### Error Response (4xx, 5xx)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Tên hộ gia đình là bắt buộc",
    "details": {
      "field": "householdName",
      "reason": "required"
    }
  },
  "timestamp": "2026-05-15T10:30:00Z"
}
```

---

## Authentication & Authorization

### Required Headers
All endpoints (except `/auth/login`) require:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Authorization Rules
- **Household endpoints:** Authenticated users only (role: `admin`, `accountant`, `resident`)
- **Write operations (POST, PUT, DELETE):** `admin` only
- **Read operations (GET):** Authenticated users can read all except residents can only view their own household data

---

## Households Endpoints

### 1️⃣ GET `/households`

**Description:** List all households with pagination and filtering

**Query Parameters:**
| Parameter | Type | Required | Default | Example |
|-----------|------|----------|---------|---------|
| `page` | integer | ❌ | 1 | `?page=2` |
| `limit` | integer | ❌ | 20 | `?limit=50` |
| `search` | string | ❌ | - | `?search=Nguyễn` |
| `sortBy` | string | ❌ | `id` | `?sortBy=name` |
| `sortOrder` | string | ❌ | `ASC` | `?sortOrder=DESC` |

**Headers:**
```
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "householdCode": "A01",
      "householdName": "Gia đình Nguyễn Văn A",
      "area": 75.5,
      "numberOfResidents": 4,
      "address": "102 Đường Tô Ký, Q.12, TP.HCM",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-05-10T15:30:00Z",
      "deleted_at": null
    },
    {
      "id": 2,
      "householdCode": "B01",
      "householdName": "Gia đình Trần Văn B",
      "area": 85.0,
      "numberOfResidents": 5,
      "address": "103 Đường Tô Ký, Q.12, TP.HCM",
      "created_at": "2026-01-20T10:00:00Z",
      "updated_at": "2026-05-12T14:20:00Z",
      "deleted_at": null
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  },
  "timestamp": "2026-05-15T10:30:00Z"
}
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Token không tồn tại hoặc hết hạn |
| 400 | `INVALID_PAGINATION` | Trang phải >= 1, limit phải > 0 |

---

### 2️⃣ POST `/households`

**Description:** Create a new household

**Request Body:**
```json
{
  "householdCode": "C01",
  "householdName": "Gia đình Lý Văn C",
  "area": 90.5,
  "address": "104 Đường Tô Ký, Q.12, TP.HCM"
}
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `householdCode` | string | ✅ | Max 50 chars, unique |
| `householdName` | string | ✅ | Max 255 chars, non-empty |
| `area` | decimal | ✅ | > 0, <= 10000 |
| `address` | string | ❌ | Max 500 chars |

**Success Response (201 Created):**
```json
{
  "data": {
    "id": 46,
    "householdCode": "C01",
    "householdName": "Gia đình Lý Văn C",
    "area": 90.5,
    "numberOfResidents": 0,
    "address": "104 Đường Tô Ký, Q.12, TP.HCM",
    "created_at": "2026-05-15T10:30:00Z",
    "updated_at": "2026-05-15T10:30:00Z",
    "deleted_at": null
  },
  "message": "Tạo hộ gia đình thành công",
  "timestamp": "2026-05-15T10:30:00Z"
}
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | `householdCode` is required |
| 400 | `DUPLICATE_CODE` | Mã hộ gia đình đã tồn tại |
| 401 | `UNAUTHORIZED` | Token không tồn tại |
| 403 | `FORBIDDEN` | Chỉ admin mới được tạo hộ gia đình |

---

### 3️⃣ GET `/households/:id`

**Description:** Get detailed information of a household including residents and vehicles

**URL Parameters:**
| Parameter | Type | Example |
|-----------|------|---------|
| `id` | integer | `1` |

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "householdCode": "A01",
    "householdName": "Gia đình Nguyễn Văn A",
    "area": 75.5,
    "numberOfResidents": 4,
    "address": "102 Đường Tô Ký, Q.12, TP.HCM",
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-05-10T15:30:00Z",
    "deleted_at": null,
    "residents": [
      {
        "id": 1,
        "identityNumber": "123456789",
        "fullName": "Nguyễn Văn A",
        "dateOfBirth": "1990-05-15",
        "relationship": "head",
        "created_at": "2026-01-15T10:00:00Z"
      },
      {
        "id": 2,
        "identityNumber": "987654321",
        "fullName": "Nguyễn Thị B",
        "dateOfBirth": "1992-08-20",
        "relationship": "spouse",
        "created_at": "2026-01-15T10:00:00Z"
      }
    ],
    "vehicles": [
      {
        "id": 1,
        "type": "motorbike",
        "licensePlate": "30A-12345",
        "owner": "Nguyễn Văn A",
        "created_at": "2026-02-10T10:00:00Z"
      }
    ]
  },
  "message": "Lấy thông tin hộ gia đình thành công",
  "timestamp": "2026-05-15T10:30:00Z"
}
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 404 | `NOT_FOUND` | Hộ gia đình không tồn tại |
| 401 | `UNAUTHORIZED` | Token không tồn tại |

---

### 4️⃣ PUT `/households/:id`

**Description:** Update household information

**Request Body:**
```json
{
  "householdName": "Gia đình Nguyễn Văn A (Updated)",
  "area": 80.0,
  "address": "102 Đường Tô Ký, Q.12, TP.HCM, Apartment 5"
}
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `householdName` | string | ❌ | Max 255 chars |
| `area` | decimal | ❌ | > 0, <= 10000 |
| `address` | string | ❌ | Max 500 chars |

> ⚠️ **Note:** `householdCode` cannot be updated once created

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "householdCode": "A01",
    "householdName": "Gia đình Nguyễn Văn A (Updated)",
    "area": 80.0,
    "numberOfResidents": 4,
    "address": "102 Đường Tô Ký, Q.12, TP.HCM, Apartment 5",
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-05-15T10:35:00Z",
    "deleted_at": null
  },
  "message": "Cập nhật thông tin hộ gia đình thành công",
  "timestamp": "2026-05-15T10:35:00Z"
}
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 404 | `NOT_FOUND` | Hộ gia đình không tồn tại |
| 400 | `VALIDATION_ERROR` | Diện tích phải > 0 |
| 401 | `UNAUTHORIZED` | Token không tồn tại |
| 403 | `FORBIDDEN` | Chỉ admin mới được cập nhật |

---

### 5️⃣ DELETE `/households/:id`

**Description:** Soft delete a household (set `deleted_at`, data remains in DB)

**Request Body:** (empty)

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "householdCode": "A01",
    "householdName": "Gia đình Nguyễn Văn A",
    "area": 75.5,
    "deleted_at": "2026-05-15T10:40:00Z"
  },
  "message": "Xóa hộ gia đình thành công",
  "timestamp": "2026-05-15T10:40:00Z"
}
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 404 | `NOT_FOUND` | Hộ gia đình không tồn tại |
| 401 | `UNAUTHORIZED` | Token không tồn tại |
| 403 | `FORBIDDEN` | Chỉ admin mới được xóa |

> ✅ **Verification:** After soft delete, the household should NOT appear in `GET /households` but data still exists in the database.

---

## Residents Endpoints

### 6️⃣ GET `/households/:id/residents`

**Description:** Get all residents of a household

**URL Parameters:**
| Parameter | Type | Example |
|-----------|------|---------|
| `id` | integer | `1` |

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "identityNumber": "123456789",
      "fullName": "Nguyễn Văn A",
      "dateOfBirth": "1990-05-15",
      "gender": "male",
      "relationship": "head",
      "occupationStatus": "employed",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-05-10T15:30:00Z"
    },
    {
      "id": 2,
      "identityNumber": "987654321",
      "fullName": "Nguyễn Thị B",
      "dateOfBirth": "1992-08-20",
      "gender": "female",
      "relationship": "spouse",
      "occupationStatus": "homemaker",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-05-10T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 4,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  },
  "timestamp": "2026-05-15T10:30:00Z"
}
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 404 | `NOT_FOUND` | Hộ gia đình không tồn tại |
| 401 | `UNAUTHORIZED` | Token không tồn tại |

---

### 7️⃣ POST `/households/:id/residents`

**Description:** Add a new resident to a household

**Request Body:**
```json
{
  "identityNumber": "123456789",
  "fullName": "Nguyễn Văn A",
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "relationship": "head",
  "occupationStatus": "employed"
}
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `identityNumber` | string | ✅ | Exactly 12 digits, unique |
| `fullName` | string | ✅ | Max 255 chars |
| `dateOfBirth` | date | ✅ | YYYY-MM-DD format, age >= 0 |
| `gender` | enum | ✅ | `male` \| `female` |
| `relationship` | enum | ✅ | `head` \| `spouse` \| `child` \| `parent` \| `other` |
| `occupationStatus` | enum | ❌ | `employed` \| `student` \| `homemaker` \| `unemployed` \| `retired` |

**Success Response (201 Created):**
```json
{
  "data": {
    "id": 1,
    "householdId": 1,
    "identityNumber": "123456789",
    "fullName": "Nguyễn Văn A",
    "dateOfBirth": "1990-05-15",
    "gender": "male",
    "relationship": "head",
    "occupationStatus": "employed",
    "created_at": "2026-05-15T10:30:00Z",
    "updated_at": "2026-05-15T10:30:00Z"
  },
  "message": "Thêm nhân khẩu thành công",
  "timestamp": "2026-05-15T10:30:00Z"
}
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 404 | `HOUSEHOLD_NOT_FOUND` | Hộ gia đình không tồn tại |
| 400 | `VALIDATION_ERROR` | `identityNumber` phải là 12 chữ số |
| 400 | `DUPLICATE_ID` | CMND đã tồn tại trong hệ thống |
| 401 | `UNAUTHORIZED` | Token không tồn tại |
| 403 | `FORBIDDEN` | Chỉ admin mới được thêm nhân khẩu |

---

## Vehicles Endpoints

### 8️⃣ GET `/households/:id/vehicles` ⭐ **CRITICAL**

**Description:** Get all vehicles of a household (Module 4 depends on this)

**URL Parameters:**
| Parameter | Type | Example |
|-----------|------|---------|
| `id` | integer | `1` |

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "householdId": 1,
      "type": "motorbike",
      "licensePlate": "30A-12345",
      "owner": "Nguyễn Văn A",
      "created_at": "2026-02-10T10:00:00Z",
      "updated_at": "2026-05-10T15:30:00Z"
    },
    {
      "id": 2,
      "householdId": 1,
      "type": "car",
      "licensePlate": "51G-999.99",
      "owner": "Nguyễn Thị B",
      "created_at": "2026-02-15T10:00:00Z",
      "updated_at": "2026-05-10T15:30:00Z"
    }
  ],
  "timestamp": "2026-05-15T10:30:00Z"
}
```

**Usage in Module 4 (Billing):**
```javascript
// Module 4 calls this endpoint to calculate parking fees
const vehicles = await GET(`/households/${household.id}/vehicles`);
const vehicleFee = vehicles.data.reduce((sum, v) => {
  return sum + (v.type === 'motorbike' ? 70000 : 1200000);
}, 0);
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 404 | `NOT_FOUND` | Hộ gia đình không tồn tại |
| 401 | `UNAUTHORIZED` | Token không tồn tại |

---

### 9️⃣ POST `/households/:id/vehicles`

**Description:** Add a new vehicle to a household

**Request Body:**
```json
{
  "type": "car",
  "licensePlate": "51G-999.99",
  "owner": "Nguyễn Thị B"
}
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `type` | enum | ✅ | `motorbike` \| `car` \| `truck` \| `other` |
| `licensePlate` | string | ✅ | Max 20 chars, unique, matches format (e.g., `30A-12345` or `51G-999.99`) |
| `owner` | string | ❌ | Max 255 chars |

**Success Response (201 Created):**
```json
{
  "data": {
    "id": 2,
    "householdId": 1,
    "type": "car",
    "licensePlate": "51G-999.99",
    "owner": "Nguyễn Thị B",
    "created_at": "2026-05-15T10:30:00Z",
    "updated_at": "2026-05-15T10:30:00Z"
  },
  "message": "Thêm xe thành công",
  "timestamp": "2026-05-15T10:30:00Z"
}
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 404 | `HOUSEHOLD_NOT_FOUND` | Hộ gia đình không tồn tại |
| 400 | `VALIDATION_ERROR` | Biển số xe không hợp lệ |
| 400 | `DUPLICATE_PLATE` | Biển số xe đã tồn tại |
| 401 | `UNAUTHORIZED` | Token không tồn tại |
| 403 | `FORBIDDEN` | Chỉ admin mới được thêm xe |

---

## Demographic Change Endpoints

### 🔟 POST `/residents/:id/absence`

**Description:** Register absence (tạm vắng) for a resident

**Request Body:**
```json
{
  "startDate": "2026-06-01",
  "endDate": "2026-06-15",
  "reason": "Về quê"
}
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `startDate` | date | ✅ | YYYY-MM-DD, >= today |
| `endDate` | date | ✅ | YYYY-MM-DD, >= startDate |
| `reason` | string | ❌ | Max 500 chars |

**Success Response (201 Created):**
```json
{
  "data": {
    "id": 1,
    "residentId": 1,
    "type": "absence",
    "startDate": "2026-06-01",
    "endDate": "2026-06-15",
    "reason": "Về quê",
    "status": "active",
    "created_at": "2026-05-15T10:30:00Z",
    "updated_at": "2026-05-15T10:30:00Z"
  },
  "message": "Đăng ký tạm vắng thành công",
  "timestamp": "2026-05-15T10:30:00Z"
}
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 404 | `RESIDENT_NOT_FOUND` | Nhân khẩu không tồn tại |
| 400 | `INVALID_DATE` | Ngày bắt đầu phải >= hôm nay |
| 400 | `DATE_RANGE_ERROR` | Ngày kết thúc phải >= ngày bắt đầu |
| 401 | `UNAUTHORIZED` | Token không tồn tại |

---

### 1️⃣1️⃣ POST `/residents/:id/temporary-residence`

**Description:** Register temporary residence (tạm trú) for a resident

**Request Body:**
```json
{
  "startDate": "2026-06-01",
  "endDate": "2026-08-31",
  "temporaryAddress": "123 Đường ABC, Q.1, TP.HCM",
  "reason": "Làm việc tại TP.HCM"
}
```

**Validation Rules:**
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `startDate` | date | ✅ | YYYY-MM-DD, >= today |
| `endDate` | date | ✅ | YYYY-MM-DD, >= startDate |
| `temporaryAddress` | string | ✅ | Max 500 chars |
| `reason` | string | ❌ | Max 500 chars |

**Success Response (201 Created):**
```json
{
  "data": {
    "id": 2,
    "residentId": 1,
    "type": "temporary_residence",
    "startDate": "2026-06-01",
    "endDate": "2026-08-31",
    "temporaryAddress": "123 Đường ABC, Q.1, TP.HCM",
    "reason": "Làm việc tại TP.HCM",
    "status": "active",
    "created_at": "2026-05-15T10:30:00Z",
    "updated_at": "2026-05-15T10:30:00Z"
  },
  "message": "Đăng ký tạm trú thành công",
  "timestamp": "2026-05-15T10:30:00Z"
}
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 404 | `RESIDENT_NOT_FOUND` | Nhân khẩu không tồn tại |
| 400 | `INVALID_DATE` | Ngày bắt đầu phải >= hôm nay |
| 400 | `VALIDATION_ERROR` | Địa chỉ tạm trú không được để trống |
| 401 | `UNAUTHORIZED` | Token không tồn tại |

---

## Cross-Module Dependencies

### 🔗 Module 2 → Module 4 Integration

**Critical Endpoint:** `GET /households/:id/vehicles`

**Module 4 (Chính) Usage:**
```javascript
// File: backend/src/controllers/billing.controller.js

async function generateInvoices(periodId) {
  const period = await fetchFeePeriod(periodId);
  const households = await Household.findAll({ where: { deleted_at: null } });

  for (const household of households) {
    // Step 1: Get vehicles from Module 2
    const vehiclesResponse = await axios.get(
      `${HOUSEHOLD_API_URL}/households/${household.id}/vehicles`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    // Step 2: Calculate parking fees
    const vehicleFee = vehiclesResponse.data.data.reduce((sum, v) => {
      return sum + (v.type === 'motorbike' ? 70000 : 1200000);
    }, 0);
    
    // Step 3: Create invoice with parking fee as an item
    if (vehicleFee > 0) {
      invoiceItems.push({
        name: 'Phí gửi xe',
        amount: vehicleFee
      });
    }
  }
}
```

**Expected Parking Fee Rates:**
| Vehicle Type | Monthly Fee |
|--------------|-------------|
| motorbike | 70,000 VNĐ |
| car | 1,200,000 VNĐ |

---

## Testing Checklist

### Before Marking Complete ✅

- [ ] All 11 endpoints return correct data format
- [ ] Pagination works for `GET /households` with `?page` and `?limit`
- [ ] Soft delete works: household disappears from list but exists in DB
- [ ] `GET /households/:id/vehicles` returns data in exact format for Module 4
- [ ] All error responses have proper HTTP status codes (400, 401, 403, 404)
- [ ] All required fields are validated
- [ ] Unique constraints work (`householdCode`, `identityNumber`, `licensePlate`)
- [ ] Cross-household data isolation works (residents/vehicles belong to correct household)

### Test Commands

```bash
# Test authentication
curl http://localhost:3001/households \
  -H "Authorization: Bearer INVALID_TOKEN"
# Expected: 401 Unauthorized

# Test pagination
curl "http://localhost:3001/households?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 10 records with pagination info

# Test soft delete
curl -X DELETE http://localhost:3001/households/1 \
  -H "Authorization: Bearer $TOKEN"
curl http://localhost:3001/households \
  -H "Authorization: Bearer $TOKEN"
# Expected: household 1 not in list

# Test critical endpoint for Module 4
curl http://localhost:3001/households/1/vehicles \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "data": [{ "id": 1, "type": "...", "licensePlate": "..." }] }
```

---

## Review & Sign-Off

| Role | Status | Date | Notes |
|------|--------|------|-------|
| Module 2 (Duy) | ✅ Draft | 2026-05-15 | All 11 endpoints specified |
| Module 4 (Chính) | ⏳ Pending | - | Review `GET /households/:id/vehicles` |
| Module 1 (Tuấn) | ⏳ Pending | - | Verify auth/middleware integration |
| Module 3 (Phương) | ⏳ Pending | - | Verify no data conflicts |

---

**Next Steps:**
1. ✅ Complete this API contract document
2. ⏳ Schedule review meeting with Module 4 (Chính) for vehicle endpoint
3. ⏳ Begin implementation based on approved specs
4. ⏳ Update Frontend team with finalized API structure
