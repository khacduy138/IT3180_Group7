# API Contract — Module 2: Household & Resident
**Author:** Dev 2 — Nguyễn Khắc Duy  
**Last updated:** 2026-03-xx  
**Base URL:** `/api/v1`

> Lưu ý quan trọng: Module 4 (Billing) cần gọi:
> - `GET /households` để lấy danh sách hộ
> - `GET /households/:id` để lấy thông tin hộ
> - `GET /households/:id/vehicles` để tính phí gửi xe
> Các endpoint này phải expose đúng format để Module 4 dùng được.

---

## Authentication
Tất cả endpoints đều yêu cầu header:
Authorization: Bearer <JWT_TOKEN>

Nếu thiếu/sai token → 401 Unauthorized

---

## 1. HOUSEHOLDS

### GET /households
Lấy danh sách hộ gia đình (có pagination + filter)

**Query params:**
| Param | Type | Required | Mô tả |
|---|---|---|---|
| page | number | No | Trang hiện tại, default: 1 |
| limit | number | No | Số kết quả/trang, default: 20, max: 100 |
| search | string | No | Tìm theo mã hộ hoặc tên chủ hộ |
| floor | number | No | Lọc theo tầng |
| status | string | No | `active` / `inactive` |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "households": [
      {
        "id": "uuid",
        "code": "CH-001",
        "apartment_number": "A101",
        "floor": 1,
        "area_m2": 65.5,
        "status": "active",
        "owner_name": "Nguyễn Văn A",
        "owner_phone": "0912345678",
        "resident_count": 3,
        "vehicle_count": 1,
        "created_at": "2026-03-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 98,
      "limit": 20
    }
  }
}
```

---

### POST /households
Tạo hộ gia đình mới

**Request body:**
```json
{
  "code": "CH-099",
  "apartment_number": "B205",
  "floor": 2,
  "area_m2": 72.0,
  "owner_name": "Trần Thị B",
  "owner_phone": "0987654321",
  "owner_id_card": "012345678901",
  "move_in_date": "2026-03-15"
}
```

**Validation:**
- `code`: bắt buộc, unique
- `apartment_number`: bắt buộc, unique
- `area_m2`: bắt buộc, > 0
- `owner_name`: bắt buộc

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "CH-099",
    "apartment_number": "B205",
    ...
  },
  "message": "Tạo hộ gia đình thành công"
}
```

**Response 400 (validation fail):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mã hộ đã tồn tại",
    "field": "code"
  }
}
```

---

### GET /households/:id
Lấy chi tiết một hộ gia đình (Module 4 cần endpoint này)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "CH-001",
    "apartment_number": "A101",
    "floor": 1,
    "area_m2": 65.5,
    "status": "active",
    "owner_name": "Nguyễn Văn A",
    "owner_phone": "0912345678",
    "owner_id_card": "012345678901",
    "move_in_date": "2025-01-01",
    "residents": [...],
    "vehicles": [...]
  }
}
```

**Response 404:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy hộ gia đình"
  }
}
```

---

### PUT /households/:id
Cập nhật thông tin hộ

**Request body:** (chỉ cần gửi các field muốn cập nhật)
```json
{
  "owner_name": "Nguyễn Văn A (cập nhật)",
  "owner_phone": "0911111111",
  "area_m2": 68.0
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { ...updated household... },
  "message": "Cập nhật thành công"
}
```

---

### DELETE /households/:id
Soft delete hộ gia đình (không xóa thật khỏi DB)

**Response 200:**
```json
{
  "success": true,
  "message": "Đã xóa hộ gia đình (soft delete)",
  "data": {
    "id": "uuid",
    "deleted_at": "2026-03-20T10:00:00Z"
  }
}
```

---

## 2. RESIDENTS (Nhân khẩu)

### GET /households/:id/residents
Lấy danh sách nhân khẩu của một hộ

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "household_id": "uuid",
      "full_name": "Nguyễn Văn A",
      "date_of_birth": "1985-05-10",
      "gender": "male",
      "id_card": "012345678901",
      "relationship": "owner",
      "status": "active",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /households/:id/residents
Thêm nhân khẩu vào hộ

**Request body:**
```json
{
  "full_name": "Nguyễn Thị C",
  "date_of_birth": "2010-08-20",
  "gender": "female",
  "id_card": "034567890123",
  "relationship": "child",
  "join_date": "2026-03-01"
}
```

**Validation:**
- `id_card`: unique trong toàn hệ thống
- `relationship`: enum `owner` / `spouse` / `child` / `parent` / `other`

**Response 201:**
```json
{
  "success": true,
  "data": { ...resident object... },
  "message": "Thêm nhân khẩu thành công"
}
```

---

### PUT /residents/:id
Cập nhật thông tin nhân khẩu

**Request body:** (partial update)
```json
{
  "full_name": "Nguyễn Thị C (cập nhật)",
  "date_of_birth": "2010-08-21"
}
```

**Response 200:** `{ "success": true, "data": {...} }`

---

## 3. BIẾN ĐỘNG NHÂN KHẨU (Demographic Changes)

### POST /residents/:id/absence
Đăng ký tạm vắng

**Request body:**
```json
{
  "departure_date": "2026-04-01",
  "expected_return_date": "2026-06-30",
  "reason": "Đi công tác",
  "contact_address": "123 Đường ABC, Hà Nội"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "resident_id": "uuid",
    "type": "absence",
    "departure_date": "2026-04-01",
    "expected_return_date": "2026-06-30",
    "status": "active",
    "created_at": "2026-03-20T10:00:00Z"
  }
}
```

---

### POST /residents/:id/temporary-residence
Đăng ký tạm trú

**Request body:**
```json
{
  "start_date": "2026-04-01",
  "end_date": "2026-09-30",
  "permanent_address": "456 Đường XYZ, Nam Định",
  "reason": "Học tập"
}
```

**Response 201:** tương tự, type: `"temporary_residence"`

---

### POST /households/:id/transfer-out
Chuyển hộ đi (đóng hộ)

**Request body:**
```json
{
  "transfer_date": "2026-05-01",
  "new_address": "789 Đường DEF, TP.HCM",
  "reason": "Chuyển công tác"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Đã ghi nhận chuyển đi. Hộ được đánh dấu inactive.",
  "data": { "household_id": "uuid", "status": "inactive" }
}
```

---

### POST /households/transfer-in
Đăng ký hộ mới chuyển đến

**Request body:**
```json
{
  "apartment_number": "C302",
  "owner_name": "Phạm Văn D",
  "owner_id_card": "045678901234",
  "move_in_date": "2026-05-01",
  "previous_address": "789 Đường DEF, TP.HCM",
  "residents": [
    { "full_name": "Phạm Văn D", "relationship": "owner", ... }
  ]
}
```

**Response 201:** household object mới

---

## 4. VEHICLES (Phương tiện)

> **Lưu ý cho Module 4:** Module 4 sẽ gọi endpoint này để tính phí gửi xe.
> - Xe máy: 70,000 VNĐ/xe/tháng
> - Ô tô: 1,200,000 VNĐ/xe/tháng

### GET /households/:id/vehicles
Lấy danh sách phương tiện của hộ

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "household_id": "uuid",
      "type": "motorbike",
      "license_plate": "30A-12345",
      "brand": "Honda",
      "color": "Đỏ",
      "status": "active",
      "registered_date": "2026-01-01"
    }
  ]
}
```

---

### POST /households/:id/vehicles
Đăng ký phương tiện mới

**Request body:**
```json
{
  "type": "motorbike",
  "license_plate": "30A-12345",
  "brand": "Honda",
  "color": "Đỏ",
  "registered_date": "2026-03-01"
}
```

**Validation:**
- `type`: enum `"motorbike"` / `"car"`
- `license_plate`: unique trong hệ thống

**Response 201:** vehicle object

---

### PUT /households/:id/vehicles/:vehicle_id
Cập nhật thông tin phương tiện

**Request body:** (partial)
```json
{
  "license_plate": "30A-99999",
  "color": "Xanh"
}
```

---

### DELETE /households/:id/vehicles/:vehicle_id
Xóa phương tiện

**Response 200:**
```json
{
  "success": true,
  "message": "Đã xóa phương tiện"
}
```

---

## 5. ERROR CODES CHUẨN (Module 2)

| HTTP | Code | Ý nghĩa |
|---|---|---|
| 400 | VALIDATION_ERROR | Dữ liệu đầu vào sai |
| 401 | UNAUTHORIZED | Chưa đăng nhập / token hết hạn |
| 403 | FORBIDDEN | Không có quyền |
| 404 | NOT_FOUND | Không tìm thấy resource |
| 409 | DUPLICATE_ENTRY | Trùng mã hộ / CCCD / biển số |
| 500 | INTERNAL_ERROR | Lỗi server |