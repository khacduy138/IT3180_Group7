# UAT Script — BlueMoon AMS — Sprint 4

**Dự án:** BlueMoon Apartment Management System  
**Sprint:** 4 — Integration, Testing & Bug Fixes  
**Người thực hiện UAT:** Duy (PM) + cả team  
**Môi trường:** Local development (localhost:3000 / localhost:5000)  
**Ngày thực hiện:** ___/___/2026  

---

## Chuẩn bị trước khi chạy UAT

### Thiết lập môi trường

```bash
# Backend
cd backend
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed --seed 20260602000100-seed-auth-core.js
npx sequelize-cli db:seed --seed 20260609000200-uat-test-data.js
npm run dev   # chạy trên port 5000

# Frontend (tab mới)
cd frontend
npm install
npm run dev   # chạy trên port 3000
```

### Tài khoản test

| Username | Password     | Role       | Quyền hạn |
|----------|--------------|------------|-----------|
| admin    | admin123456  | admin      | Toàn quyền |
| *(tạo trong UAT)* | accountant123 | accountant | billing, invoices, payments, fees:read |
| *(tạo trong UAT)* | staff123      | staff      | households, residents |

### Dữ liệu mẫu đã có sẵn

| Loại | Mô tả |
|------|-------|
| **10 hộ gia đình** | P901–P910, diện tích 50–100 m² |
| **12 cư dân** | Phân bổ vào 10 hộ (P901, P902, P903 có 2 người) |
| **Phương tiện** | P901, P903, P905, P907, P909: 1 xe máy; P902: 1 ô tô |
| **3 loại phí** | [UAT-QL] per_m2 AUTO, [UAT-DIEN] MANUAL_INPUT, [UAT-XEM] CONDITIONAL_VEHICLE |
| **1 đợt thu** | [UAT] Tháng 6/2026 (DRAFT) — code: `UAT-2026-06` |

---

## Luồng 1: Thu phí định kỳ (End-to-End)

> **Mục tiêu:** Xác nhận luồng nghiệp vụ chính hoạt động hoàn chỉnh từ cấu hình phí đến thu tiền.  
> **Người thực hiện:** Admin / Kế toán  
> **Ước tính thời gian:** 20–30 phút  

---

### TC-1.1: Xem và xác nhận danh sách loại phí UAT

**Precondition:** Đã đăng nhập với tài khoản `admin`  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Mở menu **Cấu hình phí** → **Danh sách loại phí** | — | Trang hiển thị danh sách loại phí |
| 2 | Tìm kiếm với từ khóa `UAT` | keyword = "UAT" | Hiển thị đúng 3 loại phí: `[UAT-QL]`, `[UAT-DIEN]`, `[UAT-XEM]` |
| 3 | Click vào `[UAT-QL]` để xem chi tiết | — | Hiển thị: Tên = "[UAT] Phí quản lý", Loại tính = per_m2, Đơn giá = 15,000 VNĐ, Chế độ = AUTO |
| 4 | Click vào `[UAT-DIEN]` để xem chi tiết | — | Hiển thị: Tên = "[UAT] Tiền điện", Loại tính = fixed, Đơn giá = 3,500 VNĐ/kWh, Chế độ = MANUAL_INPUT |
| 5 | Click vào `[UAT-XEM]` để xem chi tiết | — | Hiển thị: Tên = "[UAT] Gửi xe máy", Loại tính = fixed, Đơn giá = 70,000 VNĐ, Chế độ = CONDITIONAL_VEHICLE, Loại xe = motorbike |

**Pass / Fail:** ___  
**Bug:** ___  

---

### TC-1.2: Tạo mới loại phí

**Precondition:** Đã đăng nhập với tài khoản `admin`  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Vào **Danh sách loại phí** → Click **"Tạo loại phí"** | — | Hiển thị form tạo loại phí |
| 2 | Điền thông tin | Mã: `UAT-NUOC`, Tên: `[UAT] Tiền nước`, Loại: fixed, Đơn giá: 12,000, Chế độ: MANUAL_INPUT | Form điền được, không có lỗi |
| 3 | Click **"Lưu"** | — | Thông báo thành công, redirect về danh sách |
| 4 | Tìm kiếm `UAT-NUOC` trong danh sách | — | Loại phí mới xuất hiện với đúng thông tin |
| 5 | Thử tạo loại phí trùng mã | Mã: `UAT-NUOC` (trùng) | Hiển thị lỗi: "Mã loại phí đã tồn tại" |

**Pass / Fail:** ___  
**Bug:** ___  

---

### TC-1.3: Activate đợt thu phí

**Precondition:** Đợt thu `[UAT] Tháng 6/2026` đang ở trạng thái `DRAFT`  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Mở menu **Đợt thu** → **Danh sách đợt thu** | — | Hiển thị danh sách đợt thu |
| 2 | Tìm `[UAT] Tháng 6/2026` | — | Tìm thấy, trạng thái hiển thị là **DRAFT** |
| 3 | Click **"Activate"** (hoặc nút tương đương) | — | Confirm dialog xuất hiện |
| 4 | Xác nhận Activate | — | Trạng thái chuyển thành **ACTIVE**, thông báo thành công |
| 5 | Thử Activate lần 2 | — | Lỗi: "Đợt thu đã ở trạng thái ACTIVE" (hoặc nút Activate bị disable) |

**Pass / Fail:** ___  
**Bug:** ___  

---

### TC-1.4: Nhập chỉ số điện (MANUAL_INPUT)

**Precondition:** Đợt thu `[UAT] Tháng 6/2026` đang ACTIVE  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Mở **Nhập tiện ích** hoặc **Utility Invoices** | — | Form nhập tiện ích |
| 2 | Chọn đợt thu | `[UAT] Tháng 6/2026` | Dropdown hiển thị đúng |
| 3 | Nhập điện cho P901 | Hộ: P901, Loại: electricity, Số cũ: 100, Số mới: 250, Đơn giá: 3,500 | Tính usage = 150 kWh, tiền = 525,000 VNĐ |
| 4 | Lưu | — | Thành công, hiển thị trong danh sách |
| 5 | Nhập điện cho P902–P905 tương tự | Số cũ: 200–600 (tùy), Số mới: +100 mỗi hộ | Mỗi hộ lưu thành công |
| 6 | Thử nhập trùng hộ/đợt thu | P901, electricity, đợt UAT-2026-06 | Lỗi: "Đã nhập tiện ích cho hộ này trong đợt thu này" |

**Pass / Fail:** ___  
**Bug:** ___  

---

### TC-1.5: Generate hóa đơn hàng loạt

**Precondition:** Đợt thu ACTIVE, đã nhập utility cho P901–P910  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Vào chi tiết đợt thu `[UAT] Tháng 6/2026` | — | Hiển thị thông tin đợt thu |
| 2 | Click **"Generate hóa đơn"** | — | Confirm dialog: "Tạo hóa đơn cho X hộ?" |
| 3 | Xác nhận | — | Thông báo thành công: "Đã tạo 10 hóa đơn" |
| 4 | Vào danh sách hóa đơn, lọc theo đợt thu UAT | — | Hiển thị đúng 10 hóa đơn, trạng thái PENDING |
| 5 | Xem chi tiết hóa đơn P901 | — | Invoice items: QL = 750,000 (50×15,000) + XEM = 70,000 + ĐIỆN = 525,000 = **tổng 1,345,000** |
| 6 | Xem chi tiết hóa đơn P902 | — | Invoice items: QL = 900,000 (60×15,000) + ĐIỆN (theo số nhập) — **không có XEM** (P902 chỉ có ô tô, không có xe máy) |
| 7 | Xem chi tiết hóa đơn P904 | — | Invoice items: QL = 1,200,000 (80×15,000) + ĐIỆN — **không có XEM** (P904 không có xe) |
| 8 | Generate lại lần 2 | — | Lỗi 409: "Hóa đơn cho đợt thu này đã được tạo" |

**Pass / Fail:** ___  
**Bug:** ___  

> **Bảng kiểm tra số tiền Phí quản lý:**
> | Hộ | Diện tích | Phí QL = m² × 15,000 | Có xe máy | Phí XEM |
> |----|-----------|----------------------|-----------|---------|
> | P901 | 50 m² | 750,000 | ✅ | 70,000 |
> | P902 | 60 m² | 900,000 | ❌ (ô tô) | 0 |
> | P903 | 70 m² | 1,050,000 | ✅ | 70,000 |
> | P904 | 80 m² | 1,200,000 | ❌ | 0 |
> | P905 | 90 m² | 1,350,000 | ✅ | 70,000 |
> | P906 | 100 m² | 1,500,000 | ❌ | 0 |
> | P907 | 55 m² | 825,000 | ✅ | 70,000 |
> | P908 | 65 m² | 975,000 | ❌ | 0 |
> | P909 | 75 m² | 1,125,000 | ✅ | 70,000 |
> | P910 | 85 m² | 1,275,000 | ❌ | 0 |

---

### TC-1.6: Thu tiền (thanh toán hóa đơn)

**Precondition:** Hóa đơn đã được generate, trạng thái PENDING  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Tìm hóa đơn của P901 | — | Hóa đơn P901, tổng tiền hiển thị đúng, trạng thái PENDING |
| 2 | Click **"Thu tiền"** | — | Form thanh toán hiển thị: tổng tiền, đã nộp = 0, còn lại = tổng |
| 3 | Nhập **thanh toán một phần** | Số tiền: 500,000, Phương thức: cash | — |
| 4 | Lưu | — | Thành công, trạng thái hóa đơn chuyển **PARTIAL**, paid_amount = 500,000 |
| 5 | Xem hóa đơn P901 | — | Hiển thị: đã nộp = 500,000, còn lại = (tổng - 500,000), trạng thái PARTIAL |
| 6 | Thu nốt phần còn lại | Số tiền = (tổng - 500,000), Phương thức: transfer | — |
| 7 | Lưu | — | Trạng thái hóa đơn chuyển **PAID** |
| 8 | Thử thu thêm khi đã PAID | Số tiền: 100,000 | Lỗi: "Hóa đơn đã được thanh toán đủ" hoặc nút Thu bị disable |
| 9 | Thử nhập số tiền > số còn lại | Số tiền: 9,999,999 (cho hóa đơn P902) | Lỗi: "Số tiền vượt quá số còn lại cần thanh toán" |
| 10 | Thu toàn bộ hóa đơn P903–P907 một lần | Số tiền = tổng hóa đơn, Phương thức: transfer | Trạng thái PAID cho mỗi hóa đơn |

**Pass / Fail:** ___  
**Bug:** ___  

---

### TC-1.7: Xem Dashboard sau thu phí

**Precondition:** Đã thu tiền ít nhất 5/10 hóa đơn  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Mở **Dashboard** | — | Trang Dashboard load thành công |
| 2 | Xem KPI card **"Tổng thu"** | — | Hiển thị tổng số tiền đã thu (tổng paid_amount của các invoice PAID) |
| 3 | Xem KPI card **"Tỷ lệ đã nộp"** | — | Hiển thị % = (số hóa đơn PAID / tổng hóa đơn) × 100 |
| 4 | Xem KPI card **"Số hộ còn nợ"** | — | Hiển thị số hộ có hóa đơn PENDING hoặc PARTIAL |
| 5 | Xem biểu đồ thu phí | — | Biểu đồ hiển thị dữ liệu không lỗi |
| 6 | Xem **"Thanh toán gần đây"** | — | Hiển thị các payment vừa thu |
| 7 | Thu thêm hóa đơn P908–P910 | Tổng tiền | Sau khi thu, KPI cards tự cập nhật (sau reload) |

**Pass / Fail:** ___  
**Bug:** ___  

---

## Luồng 2: Quản lý hộ khẩu & nhân khẩu

> **Mục tiêu:** Xác nhận các tính năng quản lý hộ gia đình, cư dân, phương tiện, biến động nhân khẩu.  
> **Người thực hiện:** Staff / Admin  
> **Ước tính thời gian:** 20–25 phút  

---

### TC-2.1: Tạo hộ gia đình mới

**Precondition:** Đăng nhập với tài khoản có quyền `households:write`  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Mở **Hộ gia đình** → Click **"Thêm hộ"** | — | Form tạo hộ hiển thị |
| 2 | Điền thông tin hợp lệ | Phòng: P911, Diện tích: 72.5, Trạng thái: active | Form nhận dữ liệu |
| 3 | Lưu | — | Thành công, hộ P911 xuất hiện trong danh sách |
| 4 | Thử tạo hộ trùng phòng | Phòng: P911 (trùng) | Lỗi: "Số phòng đã tồn tại" |
| 5 | Thử tạo hộ thiếu trường bắt buộc | Phòng: rỗng | Lỗi validation trước khi submit |
| 6 | Thử tạo hộ với diện tích âm | Diện tích: -10 | Lỗi: "Diện tích phải là số dương" |

**Pass / Fail:** ___  
**Bug:** ___  

---

### TC-2.2: Thêm, sửa, xóa cư dân

**Precondition:** Hộ P911 đã tồn tại  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Vào chi tiết P911 → tab **Nhân khẩu** → **"Thêm nhân khẩu"** | — | Form thêm cư dân |
| 2 | Điền thông tin | Họ tên: Nguyễn Test UAT, CCCD: 099UAT999991, Giới tính: Nam, SĐT: 0909999991 | Form nhận dữ liệu |
| 3 | Lưu | — | Cư dân xuất hiện trong danh sách hộ P911 |
| 4 | Thêm cư dân thứ 2 | Họ tên: Trần Test UAT, CCCD: 099UAT999992, Quan hệ: Vợ/Chồng | Thành công |
| 5 | Sửa thông tin cư dân thứ 2 | SĐT: 0909999993 (mới) | Thông tin cập nhật thành công |
| 6 | Thử thêm cư dân với CCCD trùng | CCCD: 099UAT999991 (trùng) | Lỗi: "CCCD/CMND đã tồn tại trong hệ thống" |
| 7 | Xóa cư dân thứ 2 khỏi hộ | — | Cư dân không còn trong danh sách P911 |

**Pass / Fail:** ___  
**Bug:** ___  

---

### TC-2.3: Quản lý phương tiện

**Precondition:** Hộ P911 đã có cư dân  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Vào chi tiết P911 → tab **Phương tiện** → **"Đăng ký xe"** | — | Form đăng ký xe |
| 2 | Đăng ký xe máy | Loại: motorbike, Biển số: 30UAT999 | Thành công, xe xuất hiện trong danh sách |
| 3 | Đăng ký ô tô | Loại: car, Biển số: 51UAT999 | Thành công |
| 4 | Thử đăng ký biển số trùng | Biển số: 30UAT999 (trùng) | Lỗi: "Biển số đã đăng ký" |
| 5 | Xóa xe máy | — | Xe biến mất khỏi danh sách |
| 6 | Xem lại danh sách | — | Chỉ còn ô tô 51UAT999 |

**Pass / Fail:** ___  
**Bug:** ___  

---

### TC-2.4: Ghi nhận biến động nhân khẩu

**Precondition:** Hộ P901 có cư dân Nguyễn Văn An (cccd: 099UAT000001)  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Vào chi tiết P901 → **"Đăng ký biến động"** | — | Form biến động nhân khẩu |
| 2 | Ghi nhận **Tạm vắng** | Loại: absence, Người: Nguyễn Văn An, Từ ngày: 01/06/2026, Đến ngày: 30/06/2026, Địa điểm: Quê quán Hà Tĩnh | — |
| 3 | Lưu | — | Thành công, hiển thị trong lịch sử biến động |
| 4 | Ghi nhận **Tạm trú** cho cư dân từ nơi khác | Loại: temporary_residence, Họ tên: Người mới, Địa chỉ cũ: Hà Nội, Từ ngày: 01/06/2026 | Thành công |
| 5 | Xem **Lịch sử biến động** | — | Hiển thị 2 bản ghi vừa tạo với đúng type và ngày tháng |
| 6 | Kiểm tra Dashboard → Thống kê nhân khẩu | — | Số biến động 30 ngày gần nhất tăng lên |

**Pass / Fail:** ___  
**Bug:** ___  

---

### TC-2.5: Xóa hộ gia đình (soft delete)

**Precondition:** Hộ P911 không có hóa đơn pending  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Tìm hộ P911 trong danh sách | — | Hiển thị P911 |
| 2 | Click **"Xóa hộ"** | — | Confirm dialog |
| 3 | Xác nhận xóa | — | Thông báo thành công |
| 4 | Tìm lại P911 trong danh sách | — | P911 **không còn** trong danh sách |
| 5 | Truy vấn DB trực tiếp (tùy chọn) | `SELECT * FROM households WHERE room_number='P911'` | Record vẫn tồn tại, `deleted_at` không null |

**Pass / Fail:** ___  
**Bug:** ___  

---

## Luồng 3: Quản lý phí tiện ích & cấu hình phí nâng cao

> **Mục tiêu:** Xác nhận nhập liệu tiện ích (MANUAL_INPUT), versioning đơn giá, edge cases.  
> **Người thực hiện:** Kế toán / Admin  
> **Ước tính thời gian:** 15–20 phút  

---

### TC-3.1: Nhập chỉ số tiện ích nhiều loại

**Precondition:** Đợt thu [UAT] Tháng 6/2026 đang ACTIVE  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Vào **Nhập tiện ích** | — | Form nhập |
| 2 | Nhập điện cho P906 | Hộ: P906, Loại: electricity, Số cũ: 500, Số mới: 650, Đơn giá: 3,500 | Usage = 150, Tiền = 525,000 |
| 3 | Nhập nước cho P906 | Hộ: P906, Loại: water, Số cũ: 10, Số mới: 25, Đơn giá: 12,000 | Usage = 15, Tiền = 180,000 |
| 4 | Nhập internet cho P906 | Hộ: P906, Loại: internet, Số tiền cố định: 250,000 | Tiền = 250,000 |
| 5 | Xem danh sách utility cho P906 | — | Hiển thị 3 bản ghi đúng |
| 6 | Thử nhập số mới < số cũ | Số cũ: 500, Số mới: 400 | Lỗi: "Chỉ số mới phải lớn hơn chỉ số cũ" |

**Pass / Fail:** ___  
**Bug:** ___  

---

### TC-3.2: Versioning đơn giá loại phí

**Precondition:** Loại phí `[UAT-QL]` đang có đơn giá 15,000  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Vào chi tiết `[UAT-QL]` → Click **"Sửa đơn giá"** | — | Form sửa giá |
| 2 | Cập nhật đơn giá | Đơn giá mới: 16,000, Hiệu lực từ: 01/07/2026 | — |
| 3 | Lưu | — | Thông báo thành công |
| 4 | Xem **Lịch sử giá** của `[UAT-QL]` | — | Hiển thị 2 records: 15,000 (từ 01/01/2026) và 16,000 (từ 01/07/2026) |
| 5 | Xem lại hóa đơn P901 (đã generate theo giá cũ) | — | Hóa đơn vẫn tính theo **15,000/m²** (giá tại thời điểm generate) — **không bị ảnh hưởng** |

**Pass / Fail:** ___  
**Bug:** ___  

---

### TC-3.3: Quản lý đợt thu phí

**Precondition:** Đăng nhập Admin  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Vào **Đợt thu** → **"Tạo đợt thu mới"** | — | Form tạo đợt thu |
| 2 | Tạo đợt thu tháng 7/2026 | Code: UAT-2026-07, Tháng: 7, Năm: 2026, Chọn phí: UAT-QL, UAT-DIEN | Tạo thành công, trạng thái DRAFT |
| 3 | Sửa tên đợt thu vừa tạo | Tên: [UAT] Tháng 7/2026 (edited) | Cập nhật thành công |
| 4 | Xóa đợt thu vừa tạo (đang DRAFT) | — | Xóa thành công |
| 5 | Thử xóa đợt thu ACTIVE (`UAT-2026-06`) | — | Lỗi: "Không thể xóa đợt thu đang hoạt động" |

**Pass / Fail:** ___  
**Bug:** ___  

---

## Luồng 4: Phân quyền & xác thực người dùng

> **Mục tiêu:** Xác nhận RBAC hoạt động đúng — mỗi role chỉ thấy và làm được những gì được phép.  
> **Người thực hiện:** Admin  
> **Ước tính thời gian:** 15–20 phút  

---

### TC-4.1: Đăng nhập & đăng xuất

**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Truy cập `http://localhost:3000` khi chưa đăng nhập | — | Redirect về trang `/login` |
| 2 | Đăng nhập với thông tin sai | Username: admin, Password: saicmnd | Lỗi: "Tên đăng nhập hoặc mật khẩu không đúng" |
| 3 | Đăng nhập với thông tin đúng | Username: admin, Password: admin123456 | Redirect về Dashboard, hiển thị tên user góc phải |
| 4 | Đăng xuất | Click avatar → Logout | Redirect về `/login`, token bị vô hiệu |
| 5 | Thử dùng token cũ sau logout | Gọi API `GET /api/households` với token vừa logout | 401 Unauthorized |

**Pass / Fail:** ___  
**Bug:** ___  

---

### TC-4.2: Tạo tài khoản mới và phân quyền

**Precondition:** Đăng nhập Admin  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Vào **Quản lý người dùng** → **"Tạo tài khoản"** | — | Form tạo tài khoản |
| 2 | Tạo tài khoản kế toán | Username: accountant_uat, Password: accountant123, Role: accountant | Tạo thành công |
| 3 | Tạo tài khoản nhân viên | Username: staff_uat, Password: staff123, Role: staff | Tạo thành công |
| 4 | Thử tạo tài khoản trùng username | Username: accountant_uat (trùng) | Lỗi: "Tên đăng nhập đã tồn tại" |

**Pass / Fail:** ___  
**Bug:** ___  

---

### TC-4.3: Kiểm tra quyền hạn Role Accountant

**Precondition:** Đăng nhập với `accountant_uat / accountant123`  
**Steps:**

| # | Hành động | Kết quả mong đợi |
|---|-----------|------------------|
| 1 | Mở Dashboard | ✅ Thấy được Dashboard |
| 2 | Mở Danh sách hóa đơn | ✅ Thấy danh sách hóa đơn |
| 3 | Thu tiền cho hóa đơn PENDING | ✅ Thực hiện được |
| 4 | Mở **Quản lý người dùng** | ❌ Không thấy menu hoặc nhận 403 |
| 5 | Thử tạo hộ gia đình mới (gọi API `POST /api/households`) | ❌ 403 Forbidden |
| 6 | Xem danh sách loại phí | ✅ Thấy được (fees:read) |
| 7 | Thử tạo loại phí mới | ❌ Nút không có, hoặc 403 nếu gọi API |

**Pass / Fail:** ___  
**Bug:** ___  

---

### TC-4.4: Kiểm tra quyền hạn Role Staff

**Precondition:** Đăng nhập với `staff_uat / staff123`  
**Steps:**

| # | Hành động | Kết quả mong đợi |
|---|-----------|------------------|
| 1 | Mở Danh sách hộ gia đình | ✅ Thấy được |
| 2 | Thêm cư dân vào hộ | ✅ Thực hiện được |
| 3 | Mở Danh sách hóa đơn | ❌ Không thấy menu hoặc 403 |
| 4 | Thử thu tiền (gọi API `POST /api/billing/:id/payments`) | ❌ 403 Forbidden |
| 5 | Mở **Quản lý người dùng** | ❌ Không thấy menu hoặc 403 |
| 6 | Xem Dashboard | ✅ Thấy được (hoặc thấy được với dữ liệu giới hạn) |

**Pass / Fail:** ___  
**Bug:** ___  

---

### TC-4.5: Đổi mật khẩu

**Precondition:** Đăng nhập với `accountant_uat`  
**Steps:**

| # | Hành động | Dữ liệu nhập | Kết quả mong đợi |
|---|-----------|--------------|------------------|
| 1 | Vào **Hồ sơ / Cài đặt** → **"Đổi mật khẩu"** | — | Form đổi mật khẩu |
| 2 | Nhập sai mật khẩu cũ | MK cũ: saimat, MK mới: newpass123 | Lỗi: "Mật khẩu cũ không đúng" |
| 3 | Đổi mật khẩu đúng | MK cũ: accountant123, MK mới: newpass456 | Thành công |
| 4 | Đăng xuất và đăng nhập lại | Username: accountant_uat, Password: newpass456 | Đăng nhập thành công |
| 5 | Đăng nhập với mật khẩu cũ | Password: accountant123 | Lỗi: "Mật khẩu không đúng" |

**Pass / Fail:** ___  
**Bug:** ___  

---

## Phụ lục A — Bug Report Template

Mỗi bug được ghi lại theo format sau. Tạo GitHub Issue tương ứng.

```
**[BUG-XXX] Tiêu đề mô tả ngắn gọn**

**Severity:** critical / major / minor / cosmetic
  - critical: Chức năng core bị hỏng, không có workaround
  - major: Chức năng quan trọng bị lỗi, có workaround
  - minor: Lỗi nhỏ, UX kém, không ảnh hưởng nghiệp vụ
  - cosmetic: Vấn đề giao diện thuần túy

**Module:** Auth / Households / FeeConfig / Billing / Dashboard

**Tester:** [Tên]
**Ngày phát hiện:** DD/MM/YYYY
**Test Case:** TC-X.X

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Result:** Điều gì đáng lẽ phải xảy ra

**Actual Result:** Điều gì thực sự xảy ra

**Screenshot/Log:** [đính kèm nếu có]

**Assign to:** [tên thành viên phụ trách module]
```

---

## Phụ lục B — Danh sách Checklist tổng hợp

| TC | Tên test | Pass | Fail | Skip | Bug ID |
|----|----------|------|------|------|--------|
| TC-1.1 | Xem danh sách loại phí UAT | ☐ | ☐ | ☐ | |
| TC-1.2 | Tạo mới loại phí | ☐ | ☐ | ☐ | |
| TC-1.3 | Activate đợt thu | ☐ | ☐ | ☐ | |
| TC-1.4 | Nhập chỉ số điện | ☐ | ☐ | ☐ | |
| TC-1.5 | Generate hóa đơn hàng loạt | ☐ | ☐ | ☐ | |
| TC-1.6 | Thu tiền (partial + full) | ☐ | ☐ | ☐ | |
| TC-1.7 | Xem Dashboard sau thu phí | ☐ | ☐ | ☐ | |
| TC-2.1 | Tạo hộ gia đình mới | ☐ | ☐ | ☐ | |
| TC-2.2 | Thêm/sửa/xóa cư dân | ☐ | ☐ | ☐ | |
| TC-2.3 | Quản lý phương tiện | ☐ | ☐ | ☐ | |
| TC-2.4 | Ghi nhận biến động nhân khẩu | ☐ | ☐ | ☐ | |
| TC-2.5 | Soft delete hộ gia đình | ☐ | ☐ | ☐ | |
| TC-3.1 | Nhập tiện ích nhiều loại | ☐ | ☐ | ☐ | |
| TC-3.2 | Versioning đơn giá | ☐ | ☐ | ☐ | |
| TC-3.3 | Quản lý đợt thu phí | ☐ | ☐ | ☐ | |
| TC-4.1 | Đăng nhập & đăng xuất | ☐ | ☐ | ☐ | |
| TC-4.2 | Tạo tài khoản & phân quyền | ☐ | ☐ | ☐ | |
| TC-4.3 | Quyền hạn Accountant | ☐ | ☐ | ☐ | |
| TC-4.4 | Quyền hạn Staff | ☐ | ☐ | ☐ | |
| TC-4.5 | Đổi mật khẩu | ☐ | ☐ | ☐ | |

**Tổng:** 20 test cases | Pass: ___ | Fail: ___ | Skip: ___

---

## Phụ lục C — Kết quả UAT

**Ngày chạy UAT:** ___/___/2026  
**Người thực hiện:** ___  
**Môi trường:** Local / Staging  

| Metric | Số liệu |
|--------|---------|
| Tổng test cases | 20 |
| Pass | ___ |
| Fail | ___ |
| Skip | ___ |
| Bugs critical | ___ |
| Bugs major | ___ |
| Bugs minor | ___ |
| **UAT Status** | **PASS / FAIL / CONDITIONAL PASS** |

**UAT Conditional Pass:** Tất cả bugs critical được fix trước Sprint 5 demo.

**Chữ ký PM:** ___________________ Ngày: ___/___/2026
