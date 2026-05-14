# 🤝 Hướng dẫn đóng góp — BlueMoon AMS

---

## Mục lục

1. [Quy trình làm việc từng ngày](#1-quy-trình-làm-việc-từng-ngày)
2. [Git workflow — branch, commit, PR](#2-git-workflow--branch-commit-pr)
3. [Cách dùng AI hỗ trợ hiệu quả](#3-cách-dùng-ai-hỗ-trợ-hiệu-quả)
4. [Cách tự test công việc của mình](#4-cách-tự-test-công-việc-của-mình)
5. [Hướng dẫn riêng — Tuấn (Module 1: Auth)](#5-hướng-dẫn-riêng--tuấn-module-1-auth)
6. [Hướng dẫn riêng — Duy (Module 2: Household)](#6-hướng-dẫn-riêng--duy-module-2-household)
7. [Hướng dẫn riêng — Phương (Module 3: Fee Config)](#7-hướng-dẫn-riêng--phương-module-3-fee-config)
8. [Hướng dẫn riêng — Chính (Module 4: Billing)](#8-hướng-dẫn-riêng--chính-module-4-billing)
9. [Hướng dẫn riêng — Trung (Module 5: Dashboard + Design System)](#9-hướng-dẫn-riêng--trung-module-5-dashboard--design-system)
10. [PR Checklist](#10-pr-checklist)
11. [Lỗi thường gặp](#11-lỗi-thường-gặp)

---

## 1. Quy trình làm việc từng ngày

### Trước khi bắt đầu buổi làm việc

```bash
# 1. Cập nhật code mới nhất từ main
git checkout develop
git pull origin develop

# 2. Quay lại branch đang làm
git checkout feature/tên-task-của-bạn

# 3. Merge code mới nhất vào branch của bạn (tránh conflict về sau)
git merge develop
```

### Chọn task cần làm

1. Vào **GitHub Projects** của repo
2. Tìm cột **"Sprint hiện tại"** → tìm card được assign cho bạn
3. Kéo card sang **"In Progress"**
4. Đọc kỹ mô tả task trong [`SPRINTS.md`](./SPRINTS.md) — mỗi task có bước thực hiện chi tiết

### Cuối buổi làm việc

```bash
# Commit công việc đã làm (dù chưa xong)
git add .
git commit -m "feat(auth): thêm endpoint POST /auth/login [WIP]"
git push origin feature/tên-task-của-bạn
```

---

## 2. Git workflow — branch, commit, PR

### Đặt tên branch

Luôn tạo branch mới từ `main`, theo format:

```
feature/[module]-[mô-tả-ngắn]
fix/[module]-[mô-tả-lỗi]
```

**Ví dụ:**
```bash
git checkout -b feature/auth-login-api       # Tuấn làm API đăng nhập
git checkout -b feature/household-crud       # Duy làm CRUD hộ gia đình
git checkout -b fix/billing-invoice-status   # Chính fix bug trạng thái hóa đơn
```

### Format commit message

```
[loại]([module]): mô tả ngắn bằng tiếng Việt hoặc Anh

loại: feat | fix | refactor | test | docs | style
module: auth | household | fee | billing | dashboard | ui | db
```

**Ví dụ đúng:**
```bash
git commit -m "feat(auth): implement POST /auth/login với JWT"
git commit -m "feat(household): thêm pagination cho GET /households"
git commit -m "fix(billing): sửa lỗi state machine không chuyển PARTIAL→PAID"
git commit -m "test(fee): thêm unit test tính phí per_m2"
git commit -m "docs(api): cập nhật Swagger cho endpoint /invoices"
```

**Ví dụ sai** (tránh):
```bash
git commit -m "fix stuff"
git commit -m "update"
git commit -m "xong rồi"
```

### Tạo Pull Request

Khi task đã xong và đã tự test:

1. Push branch lên GitHub: `git push origin feature/tên-branch`
2. Vào GitHub → New Pull Request
3. Base: `main` ← Compare: `feature/tên-branch-của-bạn`
4. Điền tiêu đề PR: `[Sprint X] Tuấn: Auth login + JWT middleware`
5. Điền mô tả theo **PR Template** có sẵn trong `.github/PULL_REQUEST_TEMPLATE.md`
6. Assign reviewer: **PM Duy**
7. Tag sprint: `sprint-1`, `sprint-2`...

> **Không được** tự merge PR của mình. Phải có ít nhất 1 người review.

---


## 3. Cách tự kiểm tra

### Test Backend API với curl hoặc Postman/Thunder Client

Sau khi viết xong 1 endpoint, **test ngay** trước khi sang việc khác.

**Ví dụ test POST /auth/login:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bluemoon.vn","password":"Admin@123"}'

# Kết quả mong đợi:
# {"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

**Ví dụ test endpoint cần authentication:**
```bash
# Bước 1: Lấy token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bluemoon.vn","password":"Admin@123"}' \
  | jq -r '.token')

# Bước 2: Gọi endpoint cần auth
curl http://localhost:3001/households \
  -H "Authorization: Bearer $TOKEN"
```

**Kiểm tra các trường hợp lỗi (quan trọng!):**
```bash
# Test khi thiếu field bắt buộc
curl -X POST http://localhost:3001/households \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
# Mong đợi: 400 Bad Request với message rõ ràng

# Test khi không có token
curl http://localhost:3001/households
# Mong đợi: 401 Unauthorized
```

### Test Frontend

Sau khi implement 1 trang/component:

1. Chạy app local (`npm run dev`)
2. Mở trình duyệt, vào trang vừa làm
3. Thử các thao tác người dùng: điền form, click button, xem dữ liệu hiển thị
4. Mở DevTools (F12) → tab Console → kiểm tra không có lỗi đỏ
5. Mở tab Network → kiểm tra API call trả về đúng data
6. Test trường hợp lỗi: điền form sai, submit form rỗng

### Checklist tự test trước khi tạo PR

- [ ] API trả đúng data khi input hợp lệ
- [ ] API trả lỗi có ý nghĩa khi input thiếu/sai
- [ ] Endpoint cần auth trả 401 khi không có token
- [ ] UI hiển thị đúng data từ API
- [ ] UI hiển thị thông báo lỗi khi API lỗi
- [ ] Không có lỗi trong console trình duyệt
- [ ] Code đã được format (`npm run lint` không báo lỗi)

---

## 5. Module 1: Auth

### Những thư mục phụ trách

```
backend/src/
├── routes/auth.routes.js          ← URL mapping
├── controllers/auth.controller.js ← Logic xử lý
├── models/User.js                 ← Sequelize model
├── models/Role.js
├── middleware/authenticate.js     ← ⭐ File này quan trọng: các dev khác dùng
├── middleware/authorize.js
└── seeders/[timestamp]-admin.js   ← Tài khoản admin mặc định

frontend/src/
└── pages/auth/
    ├── LoginPage.jsx
    └── UserManagementPage.jsx
```

### Những API bạn cần implement

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/auth/login` | Đăng nhập, trả về JWT |
| POST | `/auth/logout` | Đăng xuất (blacklist token) |
| POST | `/auth/change-password` | Đổi mật khẩu |
| GET | `/users` | Danh sách user (admin only) |
| POST | `/users` | Tạo user mới |
| PUT | `/users/:id` | Sửa user |
| DELETE | `/users/:id` | Xóa user |

### Điều quan trọng nhất của module bạn

Middleware `authenticate.js` và `authorize.js` là **nền tảng bảo mật của toàn hệ thống**. Các thành viên khác sẽ import và dùng. Format phải rõ ràng:

```javascript
// authenticate.js — kiểm tra token hợp lệ
// Dùng: router.get('/households', authenticate, controller)
// Sau khi chạy: req.user = { id, email, role }

// authorize.js — kiểm tra quyền
// Dùng: router.delete('/users/:id', authenticate, authorize('admin'), controller)
```

Viết comment rõ ràng và tạo file `middleware/README.md` hướng dẫn cách dùng cho team.

### Cách test middleware của bạn

```bash
# Test authenticate — token hợp lệ
curl http://localhost:3001/users \
  -H "Authorization: Bearer [TOKEN_HỢP_LỆ]"
# Mong đợi: 200 OK

# Test authenticate — không có token
curl http://localhost:3001/users
# Mong đợi: 401 {"message": "Token không tồn tại"}

# Test authenticate — token hết hạn / sai
curl http://localhost:3001/users \
  -H "Authorization: Bearer token_sai"
# Mong đợi: 401 {"message": "Token không hợp lệ"}

# Test authorize — đúng role
curl -X DELETE http://localhost:3001/users/2 \
  -H "Authorization: Bearer [TOKEN_ADMIN]"
# Mong đợi: 200 OK

# Test authorize — sai role
curl -X DELETE http://localhost:3001/users/2 \
  -H "Authorization: Bearer [TOKEN_KẾ_TOÁN]"
# Mong đợi: 403 {"message": "Không có quyền thực hiện"}
```

---

## 6. Module 2: Household

### Những thư mục phụ trách

```
backend/src/
├── routes/households.routes.js
├── controllers/households.controller.js
├── models/Household.js
├── models/Resident.js
├── models/DemographicChange.js
└── models/Vehicle.js

frontend/src/
└── pages/households/
    ├── HouseholdListPage.jsx
    ├── HouseholdDetailPage.jsx
    ├── HouseholdForm.jsx
    └── DemographicChangeForm.jsx
```

### Những API cần implement

| Method | Endpoint | Ghi chú |
|---|---|---|
| GET | `/households` | Bắt buộc có pagination (`?page=1&limit=20`) và filter (`?search=`) |
| POST | `/households` | Validate: tên hộ, mã hộ bắt buộc |
| GET | `/households/:id` | Trả về thông tin hộ + danh sách nhân khẩu |
| PUT | `/households/:id` | |
| DELETE | `/households/:id` | Soft delete (set `deleted_at`, không xóa thật) |
| GET | `/households/:id/residents` | |
| POST | `/households/:id/residents` | |
| GET | `/households/:id/vehicles` | ⭐ Module 4 (Chính) gọi API này — phải ổn định |
| POST | `/households/:id/vehicles` | |
| POST | `/residents/:id/absence` | Đăng ký tạm vắng |
| POST | `/residents/:id/temporary-residence` | Đăng ký tạm trú |

### API quan trọng nhất: GET /households/:id/vehicles

Module 4 (Chính) sẽ gọi API này để tính phí gửi xe. Response phải đúng format:

```json
{
  "data": [
    { "id": 1, "type": "motorbike", "licensePlate": "30A-12345" },
    { "id": 2, "type": "car", "licensePlate": "51G-999.99" }
  ]
}
```

Khi API này sẵn sàng, **thông báo ngay cho Chính** để bạn ấy tiếp tục làm Module 4.

### Cách test soft delete

```bash
# Xóa hộ (soft delete)
curl -X DELETE http://localhost:3001/households/1 \
  -H "Authorization: Bearer $TOKEN"

# Kiểm tra: hộ không còn xuất hiện trong danh sách
curl http://localhost:3001/households \
  -H "Authorization: Bearer $TOKEN"
# Mong đợi: hộ id=1 không có trong response

# Kiểm tra: dữ liệu vẫn còn trong DB (dùng MySQL Workbench hoặc terminal)
mysql -u root -p bluemoon_dev -e "SELECT id, name, deleted_at FROM households WHERE id=1;"
# Mong đợi: deleted_at có giá trị (không phải NULL)
```

---

## 7. Module 3: Fee Config

### Những thư mục phụ trách

```
backend/src/
├── routes/fees.routes.js
├── controllers/fees.controller.js
├── models/FeeType.js
├── models/FeePeriod.js
└── models/UtilityInvoice.js

frontend/src/
└── pages/fees/
    ├── FeeTypeListPage.jsx
    ├── FeeTypeForm.jsx
    ├── FeePeriodListPage.jsx
    ├── FeePeriodForm.jsx
    └── UtilityInvoiceForm.jsx
```

### Những API cần implement

| Method | Endpoint | Ghi chú |
|---|---|---|
| GET | `/fee-types` | Danh sách loại phí |
| POST | `/fee-types` | `calculation_type`: `per_m2` \| `fixed` \| `voluntary` |
| PUT | `/fee-types/:id` | Khi sửa đơn giá: lưu lịch sử (xem bên dưới) |
| DELETE | `/fee-types/:id` | |
| GET | `/fee-periods` | |
| POST | `/fee-periods` | Chọn tháng + chọn loại phí áp dụng |
| GET | `/fee-periods/:id` | ⭐ Module 4 gọi API này |
| POST | `/utility-invoices` | Nhập điện/nước/internet từng hộ |

### Xử lý số tiền

**Không dùng JavaScript `float` hoặc `Number` để tính tiền.**

```javascript
// ❌ SAI — float bị mất chính xác
const total = 150000.5 + 200000.3; // 350000.79999...

// ✅ ĐÚNG — dùng decimal.js
const Decimal = require('decimal.js');
const total = new Decimal('150000.5').plus('200000.3'); // 350000.8 chính xác

// ✅ HOẶC lưu đơn vị là "đồng nguyên" (số nguyên)
// 150,000 VNĐ → lưu là 150000 (integer)
```

### Versioning đơn giá

Khi admin sửa đơn giá của loại phí, **không được** ghi đè giá cũ. Phải lưu lịch sử:

```javascript
// Khi PUT /fee-types/:id với unitPrice mới:
// 1. Lưu giá cũ vào bảng fee_type_price_history (effective_to = hôm nay)
// 2. Tạo record mới với giá mới (effective_from = hôm nay)
// → Hóa đơn tháng trước vẫn tính theo giá cũ ✅
```

### API quan trọng nhất: GET /fee-periods/:id

Module 4 (Chính) gọi API này để biết đợt thu có những loại phí gì và đơn giá bao nhiêu. Response phải bao gồm:

```json
{
  "id": 1,
  "month": 5,
  "year": 2026,
  "feeTypes": [
    { "id": 1, "name": "Phí quản lý", "calculationType": "per_m2", "unitPrice": 15000 },
    { "id": 2, "name": "Phí vệ sinh", "calculationType": "fixed", "amount": 50000 }
  ]
}
```

---

## 8. Module 4: Billing

### Những thư mục phụ trách

```
backend/src/
├── routes/billing.routes.js
├── controllers/billing.controller.js
├── models/Invoice.js
├── models/InvoiceItem.js
└── models/Payment.js

frontend/src/
└── pages/billing/
    ├── InvoiceListPage.jsx
    ├── PaymentPage.jsx
    └── PaymentHistoryPage.jsx
```

### Những API cần implement

| Method | Endpoint | Ghi chú |
|---|---|---|
| GET | `/invoices` | Filter: `?periodId=&householdId=&status=` |
| GET | `/invoices/:id` | Chi tiết hóa đơn + danh sách items |
| POST | `/fee-periods/:id/generate-invoices` | ⭐ Logic này phức tạp nè — check bên dưới |
| POST | `/invoices/:id/pay` | Ghi nhận thanh toán |
| GET | `/payments` | Lịch sử thanh toán |

### Logic generate hóa đơn — từng bước

Đây là nghiệp vụ quan trọng nhất của module bạn. Khi được gọi:

```javascript
// POST /fee-periods/:id/generate-invoices
async function generateInvoices(periodId) {
  // Bước 1: Lấy thông tin đợt thu
  const period = await GET(`/fee-periods/${periodId}`); // Gọi Module 3 (Phương)
  
  // Bước 2: Lấy danh sách hộ gia đình
  const households = await Household.findAll({ where: { deleted_at: null } });
  
  for (const household of households) {
    // Bước 3: Với mỗi hộ, tính từng loại phí
    const items = [];
    
    for (const feeType of period.feeTypes) {
      if (feeType.calculationType === 'per_m2') {
        items.push({
          name: feeType.name,
          amount: feeType.unitPrice * household.area // diện tích hộ
        });
      } else if (feeType.calculationType === 'fixed') {
        items.push({ name: feeType.name, amount: feeType.amount });
      }
      // voluntary: không tự tạo, chờ người dùng nhập
    }
    
    // Bước 4: Tính phí xe (gọi API Module 2 - Duy)
    const vehicles = await GET(`/households/${household.id}/vehicles`);
    const vehicleFee = vehicles.data.reduce((sum, v) => {
      return sum + (v.type === 'motorbike' ? 70000 : 1200000);
    }, 0);
    if (vehicleFee > 0) items.push({ name: 'Phí gửi xe', amount: vehicleFee });
    
    // Bước 5: Tạo invoice + invoice_items trong 1 transaction
    await sequelize.transaction(async (t) => {
      const invoice = await Invoice.create({
        householdId: household.id,
        periodId,
        status: 'PENDING',
        totalAmount: items.reduce((s, i) => s + i.amount, 0)
      }, { transaction: t });
      
      await InvoiceItem.bulkCreate(
        items.map(item => ({ ...item, invoiceId: invoice.id })),
        { transaction: t }
      );
    });
  }
}
```

### State machine hóa đơn — không được vi phạm

```
PENDING ──(thanh toán một phần)──▶ PARTIAL ──(thanh toán đủ)──▶ PAID
  │                                                                  │
  └────────────────────────────────────────────────────────────────▶│
                (thanh toán đủ ngay lần đầu)
```

- Không thể đi ngược: `PAID → PARTIAL` hoặc `PAID → PENDING` → throw Error
- Kiểm tra sau mỗi lần thanh toán: nếu `paid_amount >= total_amount` → chuyển `PAID`

### Cách test generate hóa đơn

```bash
# 1. Đảm bảo có dữ liệu: hộ gia đình, loại phí, đợt thu
# 2. Gọi generate
curl -X POST http://localhost:3001/fee-periods/1/generate-invoices \
  -H "Authorization: Bearer $TOKEN"

# 3. Kiểm tra hóa đơn được tạo
curl http://localhost:3001/invoices?periodId=1 \
  -H "Authorization: Bearer $TOKEN"
# Mong đợi: số hóa đơn = số hộ gia đình đang hoạt động

# 4. Gọi generate lần 2 → phải báo lỗi (không tạo duplicate)
curl -X POST http://localhost:3001/fee-periods/1/generate-invoices \
  -H "Authorization: Bearer $TOKEN"
# Mong đợi: 409 {"message": "Hóa đơn đã được tạo cho đợt thu này"}
```

---

## 9. Module 5: Dashboard + Design System

### Trung phụ trách hai phần nhé

**Phần 1: Design System** (Sprint 1 — ưu tiên cao nhất, team khác chờ)
```
frontend/src/components/ui/
├── Button.jsx         ← 4 variants (primary, secondary, danger, ghost) × 3 sizes
├── Input.jsx
├── Select.jsx
├── Modal.jsx
├── Table.jsx          ← Props: columns, data, onRowClick, loading
├── Card.jsx
├── Badge.jsx          ← Màu theo status: pending=yellow, paid=green, partial=blue
├── Sidebar.jsx        ← Navigation menu
├── Topbar.jsx         ← User info + logout button
├── Toast.jsx          ← Thông báo success/error/warning
├── Spinner.jsx
├── FormLayout.jsx
├── PageHeader.jsx
└── README.md          ← Hướng dẫn dùng từng component (CỰC KỲ QUAN TRỌNG)
```

**Phần 2: Dashboard & Reports**
```
backend/src/routes/dashboard.routes.js + controllers
frontend/src/pages/dashboard/
├── DashboardPage.jsx   ← KPI cards + biểu đồ
└── ReportPage.jsx      ← Báo cáo chi tiết
```

### Design System README — phải viết rõ ràng

File `frontend/src/components/ui/README.md` là tài liệu quan trọng nhất với team. Mỗi component phải có:

```markdown
## Button

### Props
| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| variant | 'primary' \| 'secondary' \| 'danger' \| 'ghost' | 'primary' | Kiểu nút |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Kích thước |
| onClick | Function | - | Hàm xử lý click |
| disabled | Boolean | false | Vô hiệu hóa nút |
| loading | Boolean | false | Hiện spinner khi đang xử lý |

### Cách dùng
\`\`\`jsx
import { Button } from '../components/ui/Button';

// Nút lưu dữ liệu
<Button variant="primary" onClick={handleSave} loading={isSaving}>
  Lưu
</Button>

// Nút xóa (cần confirm)
<Button variant="danger" onClick={handleDelete}>
  Xóa hộ gia đình
</Button>
\`\`\`
```

### Dashboard APIs bạn cần implement

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/dashboard/summary` | Tổng thu tháng này, tỷ lệ đã nộp, số hộ còn nợ |
| GET | `/reports/by-period?periodId=` | Báo cáo theo đợt thu |
| GET | `/reports/by-household?householdId=` | Lịch sử đóng phí của 1 hộ |
| GET | `/search?q=` | Tìm kiếm toàn hệ thống (hộ, cư dân, hóa đơn) |

---

## 10. PR Checklist

Trước khi tạo PR, tự check những mục này:

**Code quality:**
- [ ] Không có `console.log` bị bỏ quên
- [ ] Không có code bị comment out mà không cần thiết
- [ ] Tên biến, hàm có ý nghĩa (không dùng `a`, `b`, `x`, `temp`)
- [ ] `npm run lint` không có lỗi

**Backend:**
- [ ] Tất cả routes đã có `authenticate` middleware
- [ ] Input validation: kiểm tra trường bắt buộc, kiểu dữ liệu
- [ ] Error handling: try/catch, trả lỗi có message rõ ràng
- [ ] Response format nhất quán: `{ data: ... }` hoặc `{ message: ..., error: ... }`

**Frontend:**
- [ ] Dùng components từ Design System (không tự style lại)
- [ ] Loading state khi đang fetch API
- [ ] Error state khi API lỗi (hiển thị Toast)
- [ ] Form validation trước khi submit

**Database:**
- [ ] Migration file chạy được (test `npx sequelize-cli db:migrate`)
- [ ] Không commit file `.env`

---

## 11. Lỗi thường gặp

### "Cannot find module '...'"
```bash
# Giải pháp: chạy lại npm install
cd backend  # hoặc frontend
npm install
```

### "Access denied for user 'root'@'localhost'"
Kiểm tra file `backend/.env`:
- `DB_PASSWORD` có đúng mật khẩu MySQL của máy bạn không?
- Thử kết nối thủ công: `mysql -u root -p`

### "JWT_SECRET is not defined"
File `backend/.env` chưa có `JWT_SECRET`. Thêm vào:
```
JWT_SECRET=bluemoon_super_secret_key_2026_minimum_32_chars
```

### Gọi API thấy lỗi "401 Unauthorized"
- Kiểm tra request có header `Authorization: Bearer [TOKEN]` không
- Token có hết hạn không? (đăng nhập lại để lấy token mới)

### Conflict khi merge
```bash
git checkout main
git pull origin main
git checkout feature/branch-của-bạn
git merge main
# → Sửa conflict trong file được đánh dấu
git add .
git commit -m "fix: resolve merge conflict"
```

### Frontend không lấy được data từ API
Kiểm tra:
1. Backend có đang chạy không? (`curl http://localhost:3001/health`)
2. File `frontend/src/services/api.js` có `baseURL` đúng không (`http://localhost:3001`)
3. Tab Network trong DevTools → xem request gửi đi và response nhận về

---

> 💬 Vẫn bị block sau khi đọc hết file này? Tag **@duy-pm** trong Zalo group mô tả vấn đề của bạn.
