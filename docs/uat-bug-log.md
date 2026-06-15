# UAT Bug Log — BlueMoon AMS — Sprint 4

**Dự án:** BlueMoon Apartment Management System  
**Sprint:** 4  
**Ngày chạy UAT:** 09/06/2026  
**Ngày fix hoàn tất:** 15/06/2026  
**Người thực hiện:** PM (automated API testing)  

---

## Bug List

| Bug ID | Severity | TC | Module | Mô tả ngắn | Assign | Status |
|--------|----------|----|--------|------------|--------|--------|
| BUG-001 | minor | TC-4.5 | Auth | `change-password` chỉ nhận `old_password`, không nhận `current_password` | Tuấn | ✅ Verified |
| BUG-002 | minor | TC-2.1 | Households | `POST /households` chỉ nhận camelCase, không nhận snake_case | Duy | ✅ Verified |
| BUG-003 | minor | TC-2.2 | Households | `moveInDate` bắt buộc nhưng không có default value | Duy | ✅ Verified |
| BUG-004 | major | TC-1.3 | FeeConfig | `activate` period đã ACTIVE không bị từ chối | Phương | ✅ Verified |
| BUG-005 | major | TC-1.5 | Billing | `generate-invoices` tạo cho tất cả hộ trong DB, không filter | Chính | ⚠️ Won't Fix* |
| BUG-006 | critical | TC-1.5 | Billing | `price_snapshot` dùng giá hiện tại thay vì giá tại thời điểm period | Chính | ✅ Verified |
| BUG-007 | critical | TC-1.5 | Billing | MANUAL_INPUT fee không tạo `invoice_item` dù đã nhập utility | Chính | ✅ Verified |

> *BUG-005: Thiết kế có chủ ý — generate invoice cho toàn bộ hộ active trong mỗi đợt thu. Confirmed với team.

---

## Chi tiết Bug & Fix

---

### BUG-001 — change-password: chấp nhận cả `old_password` lẫn `current_password`
**Severity:** minor | **Status:** ✅ Verified  
**File:** `backend/src/controllers/auth.controller.js`

**Fix:** Destructure cả hai tên field, ưu tiên `old_password || current_password`:
```js
const { old_password, current_password, new_password } = req.body;
const currentPw = old_password || current_password;
```

---

### BUG-002 — POST /households: nhận cả snake_case lẫn camelCase
**Severity:** minor | **Status:** ✅ Verified  
**File:** `backend/src/controllers/household.controller.js`

**Fix:** Dùng nullish coalescing để nhận cả hai format:
```js
const roomNumber = req.body.roomNumber ?? req.body.room_number;
const squareMeters = req.body.squareMeters ?? req.body.square_meters;
```

---

### BUG-003 — moveInDate: default là ngày hôm nay
**Severity:** minor | **Status:** ✅ Verified  
**File:** `backend/src/controllers/household.controller.js`

**Fix:** Bỏ validation bắt buộc, dùng default:
```js
const resolvedMoveInDate = moveInDate || new Date().toISOString().slice(0, 10);
```

---

### BUG-004 — activateFeePeriod: guard check trạng thái
**Severity:** major | **Status:** ✅ Verified  
**File:** `backend/src/controllers/fees.controller.js`

**Fix:** Thêm check trước khi set ACTIVE:
```js
if (feePeriod.status === 'ACTIVE') return sendError(res, 409, 'Fee period is already active');
if (feePeriod.status === 'CLOSED') return sendError(res, 409, 'Cannot activate a closed fee period');
```

---

### BUG-006 — price_snapshot: dùng giá hiệu lực tại thời điểm period
**Severity:** critical | **Status:** ✅ Verified  
**File:** `backend/src/controllers/fees.controller.js` (createFeePeriod)

**Root cause:** `createFeePeriod` chỉ tạo `period_fees`, không tạo `fee_period_fee_types` (bảng chứa `price_history_id`). `generateInvoicesForFeePeriod` không có snapshot nên dùng giá hiện tại.

**Fix:**
1. `createFeePeriod` tạo thêm record vào `fee_period_fee_types` với `price_history_id` là bản ghi giá hiệu lực tại `startDate` của period.
2. `generateInvoicesForFeePeriod` load snapshot từ `fee_period_fee_types` → `fee_type_price_history` và override `unit_price` trong `periodFees` trước khi gọi `buildInvoiceItems`.

---

### BUG-007 — MANUAL_INPUT: tạo FeeUsage khi nhập utility
**Severity:** critical | **Status:** ✅ Verified  
**File:** `backend/src/controllers/fees.controller.js` (createUtilityInvoice)

**Root cause:** `createUtilityInvoice` chỉ tạo `UtilityInvoice`. `generateInvoicesForFeePeriod` query `FeeUsage` để build MANUAL_INPUT items nhưng `FeeUsage` luôn trống.

**Fix:** `createUtilityInvoice` nhận thêm optional param `feeTypeId`. Nếu có, tìm `PeriodFee` tương ứng và tạo `FeeUsage` record song song trong transaction.

---

## UAT Kết quả tổng hợp — FINAL

| TC | Tên test | Kết quả | Bug |
|----|----------|---------|-----|
| TC-1.1 | Xem danh sách loại phí UAT | ✅ PASS | |
| TC-1.2 | Tạo mới loại phí | ✅ PASS | |
| TC-1.3 | Activate đợt thu | ✅ PASS | BUG-004 ✅ fixed |
| TC-1.4 | Nhập chỉ số điện | ✅ PASS | |
| TC-1.5 | Generate hóa đơn hàng loạt | ✅ PASS | BUG-006, BUG-007 ✅ fixed |
| TC-1.6 | Thu tiền (partial + full) | ✅ PASS | |
| TC-1.7 | Xem Dashboard sau thu phí | ✅ PASS | |
| TC-2.1 | Tạo hộ gia đình mới | ✅ PASS | BUG-002 ✅ fixed |
| TC-2.2 | Thêm/sửa/xóa cư dân | ✅ PASS | BUG-003 ✅ fixed |
| TC-2.3 | Quản lý phương tiện | ✅ PASS | |
| TC-2.4 | Ghi nhận biến động nhân khẩu | ✅ PASS | |
| TC-2.5 | Soft delete hộ gia đình | ✅ PASS | |
| TC-3.1 | Nhập tiện ích nhiều loại | ✅ PASS | |
| TC-3.2 | Versioning đơn giá | ✅ PASS | |
| TC-3.3 | Quản lý đợt thu phí | ✅ PASS | |
| TC-4.1 | Đăng nhập & đăng xuất | ✅ PASS | |
| TC-4.2 | Tạo tài khoản & phân quyền | ✅ PASS | |
| TC-4.3 | Quyền hạn Accountant | ✅ PASS | |
| TC-4.4 | Quyền hạn Staff | ✅ PASS | |
| TC-4.5 | Đổi mật khẩu | ✅ PASS | BUG-001 ✅ fixed |

**Tổng:** 20/20 TCs | ✅ PASS: 20 | ❌ FAIL: 0

**UAT Status: ✅ PASS** — Tất cả bugs critical đã được fix và verify.
