# 📅 Sprint Backlog — BlueMoon AMS

---

## Tổng quan lịch sprint

| Sprint | Tuần | Mục tiêu |
|---|---|---|
| Sprint 0 | Tuần 1 | Kickoff: Schema DB + API contract + Setup |
| Sprint 1 | Tuần 2–3 | Foundation: Auth backend + Design System + DB migrations |
| Sprint 2 | Tuần 4–5 | Core Backend: CRUD APIs đầy đủ + Frontend bắt đầu |
| Sprint 3 | Tuần 6–7 | Hoàn thiện: Tính năng nâng cao + Frontend assembly |
| Sprint 4 | Tuần 8–9 | Testing + Bug fixes + UAT |
| Sprint 5 | Tuần 10 | Deploy + Documentation + Demo |

[Link docs tổng hợp các sprints (Có mục lục cho dễ theo dõi)](https://docs.google.com/document/d/1ou5UNHPKGEX4TELiZ1RT6NRiSArdgtu4a0vzP9doIDM/edit?usp=sharing)

---

## Sprint 0 — Kickoff (Tuần 1)

> **Mục tiêu**: Toàn team thống nhất được nền tảng kỹ thuật trước khi ai code bất cứ thứ gì.  
> Kết quả: DB schema, API contract, project structure được merge vào `main`.

---

### 🏷️ [S0-PM] Setup hạ tầng dự án
**Phụ trách:** Duy (PM)  
**Ước tính:** 2–3 buổi

**Mục tiêu:** Tạo môi trường làm việc chung cho cả team — repo, board quản lý, CI/CD cơ bản.

**Bước thực hiện:**

*Buổi 1 — Repo & Project structure:*
- Khởi tạo GitHub repository với cấu trúc thư mục theo thiết kế
- Tạo file `.gitignore` (loại trừ `node_modules/`, `.env`, `dist/`)
- Tạo `.env.example` với tất cả biến môi trường cần thiết (không điền giá trị thật)
- Tạo file `README.md` tạm thời (sẽ được thay bằng file đã thiết kế)
- Tạo `CONTRIBUTING.md` và `SPRINTS.md`
- Tạo GitHub Projects board với các cột: Backlog | Sprint X | In Progress | Review | Done
- Import tất cả task từ SPRINTS.md vào board, assign đúng thành viên

*Buổi 2 — CI/CD & Templates:*
- Tạo file `.github/workflows/ci.yml`: tự động chạy `npm install` và `npm run lint` khi có PR
- Tạo `.github/PULL_REQUEST_TEMPLATE.md` với checklist: mô tả thay đổi, đã test chưa, liên quan sprint nào
- Tạo file `docs/API-contract.md` — template Swagger/OpenAPI cơ bản với format request/response chuẩn
- Invite toàn team vào repo với quyền Write

*Buổi 3 — Review & Sprint 0 meeting:*
- Tổ chức meeting cả team (online): review DB schema của Tuấn, API contract của các dev
- Ghi lại quyết định trong `docs/decisions.md`
- Chốt tech stack, cấu trúc response API, format lỗi
- Merge `setup/initial-structure` vào `main` sau khi được team approve

**Definition of Done:**
- [ ] Repo có cấu trúc thư mục đầy đủ
- [ ] GitHub Projects board có task cho Sprint 1
- [ ] CI pipeline chạy xanh trên PR test
- [ ] `docs/API-contract.md` có ít nhất format chuẩn cho request/response/error
- [ ] Toàn team có thể clone repo và đọc hiểu cấu trúc

---

### 🏷️ [S0-T1] Thiết kế Database Schema toàn hệ thống
**Phụ trách:** Tuấn  
**Ước tính:** 2–3 buổi

**Mục tiêu:** Tạo schema DB đầy đủ cho tất cả 5 module, được cả team review và chấp thuận. Đây là nền tảng — nếu schema sai thì sửa sau rất tốn công.

**Bước thực hiện:**

*Buổi 1 — Nghiên cứu & Draft:*
- Đọc kỹ mô tả từng module trong kế hoạch dự án
- Liệt kê tất cả "thực thể" cần lưu trữ: User, Role, Household, Resident, Vehicle, FeeType, FeePeriod, Invoice...
- Với mỗi bảng: xác định columns, kiểu dữ liệu, constraints (NOT NULL, UNIQUE, DEFAULT)
- Xác định quan hệ: 1-1, 1-N, N-N (bảng trung gian)
- Draft schema dạng text hoặc SQL trong file `docs/ERD.md`

*Buổi 2 — Vẽ ERD & Review nội bộ:*
- Vẽ ERD bằng dbdiagram.io (miễn phí) hoặc draw.io
- Kiểm tra: có bảng nào thiếu? Quan hệ có đúng không? Index cần thiết chưa?
- Xem xét các quy tắc nghiệp vụ: soft delete cần cột `deleted_at`, lịch sử giá phí cần bảng riêng
- Chia sẻ với PM và các thành viên để lấy feedback
- **Gợi ý hỏi AI**: *"Review database schema này cho hệ thống quản lý chung cư. Tôi cần lưu: [liệt kê thực thể]. Bạn thấy thiếu gì hoặc có quan hệ nào chưa đúng không?"*

*Buổi 3 — Finalize & Viết migration:*
- Sửa schema theo feedback
- Viết file SQL tạo bảng: `docs/schema.sql` (để team tham khảo)
- Viết Sequelize migration đầu tiên cho bảng `users`, `roles`, `permissions`
- Test migration chạy được: `npx sequelize-cli db:migrate`
- Export ERD thành ảnh, commit vào `docs/ERD.md`

**Definition of Done:**
- [ ] `docs/ERD.md` có sơ đồ ERD rõ ràng
- [ ] `docs/schema.sql` có SQL đầy đủ tất cả bảng
- [ ] Migration cho `users/roles/permissions` chạy được
- [ ] Không có thành viên nào có câu hỏi về cấu trúc bảng mình phụ trách

---

### 🏷️ [S0-D2] Định nghĩa API contract cho Module 2 (Household)
**Phụ trách:** Duy  
**Ước tính:** 2 buổi

**Mục tiêu:** Viết đặc tả đầy đủ tất cả API của Module 2 — trước khi code, mọi người đã biết API của Duy sẽ trả về gì.

**Bước thực hiện:**

*Buổi 1 — Liệt kê & Draft:*
- Liệt kê tất cả endpoints Module 2 cần có (xem CONTRIBUTING.md phần Duy)
- Với **mỗi endpoint**, viết đầy đủ:
  - HTTP Method + URL
  - Request: Headers, Body (JSON schema), Query params
  - Response thành công: status code, JSON format
  - Response lỗi: các trường hợp có thể xảy ra (404, 400, 401...)
- Viết vào `docs/API-contract.md` dưới section Module 2

*Buổi 2 — Review & Thống nhất với Module 4:*
- Gặp Chính (Module 4) để confirm format của `GET /households/:id/vehicles`
- Vì Module 4 phụ thuộc API này, response format phải được 2 bên đồng ý
- Update `docs/API-contract.md` với format đã thống nhất
- **Gợi ý hỏi AI**: *"Tôi cần thiết kế response cho API GET /households với pagination và filter. Best practice cho REST API pagination là gì? Cho tôi xem ví dụ cụ thể."*

**Definition of Done:**
- [ ] Tất cả endpoints Module 2 có đặc tả đầy đủ trong `docs/API-contract.md`
- [ ] Chính đã review và approve format `GET /households/:id/vehicles`
- [ ] Schema bảng `households/residents/vehicles` đã review cùng Tuấn

---

### 🏷️ [S0-P3] Định nghĩa API contract cho Module 3 (Fee Config)
**Phụ trách:** Phương  
**Ước tính:** 2 buổi

**Mục tiêu:** Viết đặc tả API Module 3, đặc biệt endpoint mà Module 4 phụ thuộc.

**Bước thực hiện:**

*Buổi 1 — Nghiên cứu nghiệp vụ + Draft:*
- Hiểu rõ 3 loại phí: `per_m2` (tính theo diện tích), `fixed` (cố định mỗi hộ), `voluntary` (tự nguyện)
- Hiểu khái niệm "versioning đơn giá": tại sao cần lưu lịch sử khi sửa giá?
- Thiết kế schema bảng `fee_type_price_history` nếu cần
- Draft API contract cho tất cả endpoints Module 3
- **Gợi ý hỏi AI**: *"Tôi cần thiết kế API quản lý cấu hình phí với versioning. Khi admin thay đổi đơn giá, hóa đơn cũ phải vẫn tính theo giá cũ. Cách thiết kế database và API cho use case này là gì?"*

*Buổi 2 — Chi tiết endpoint cho Module 4:*
- Thiết kế chi tiết `GET /fee-periods/:id` — response phải đủ thông tin để Module 4 tính hóa đơn
- Gặp Chính để confirm format response
- Hoàn thiện và commit `docs/API-contract.md` phần Module 3

**Definition of Done:**
- [ ] Tất cả endpoints Module 3 có đặc tả đầy đủ
- [ ] Chính đã approve format `GET /fee-periods/:id`
- [ ] Rõ ràng cách handle số tiền (decimal.js, không dùng float)

---

### 🏷️ [S0-C4] Định nghĩa API contract cho Module 4 (Billing)
**Phụ trách:** Chính  
**Ước tính:** 2 buổi

**Mục tiêu:** Thiết kế luồng nghiệp vụ phức tạp nhất hệ thống, đảm bảo tích hợp Module 2 + 3 + 4.

**Bước thực hiện:**

*Buổi 1 — Thiết kế luồng nghiệp vụ:*
- Vẽ sơ đồ Activity cho luồng: Tạo đợt thu → Generate hóa đơn → Thu tiền → Cập nhật trạng thái
- Thiết kế state machine hóa đơn: PENDING → PARTIAL → PAID (viết ra trường hợp nào trigger mỗi chuyển trạng thái)
- Liệt kê tất cả API cần có
- Xác định API nào cần gọi từ Module 2 và Module 3 (dependency)

*Buổi 2 — Draft API contract + Coordinate:*
- Viết đặc tả đầy đủ tất cả endpoints Module 4
- Confirm với Duy: format response `GET /households/:id/vehicles`
- Confirm với Phương: format response `GET /fee-periods/:id`
- Thiết kế schema bảng `invoices`, `invoice_items`, `payments`
- **Gợi ý hỏi AI**: *"Giải thích Sequelize Transactions. Khi nào cần dùng transaction? Cho tôi ví dụ: tạo Invoice và nhiều InvoiceItem cùng lúc, đảm bảo atomic."*

**Definition of Done:**
- [ ] Tất cả endpoints Module 4 có đặc tả đầy đủ
- [ ] State machine diagram rõ ràng
- [ ] Đã coordinate xong với Duy và Phương về format API

---

### 🏷️ [S0-TR5] Tạo Figma project + Wireframe layout cơ bản
**Phụ trách:** Trung  
**Ước tính:** 2–3 buổi

**Mục tiêu:** Tạo design foundation — màu sắc, font, spacing — và wireframe layout chính. Đây sẽ là "style guide" cho cả dự án.

**Bước thực hiện:**

*Buổi 1 — Setup Figma:*
- Tạo Figma project "BlueMoon AMS", invite toàn team (view access)
- Tạo Design Tokens page: màu sắc primary/secondary/neutral/semantic (success, warning, error), font sizes, spacing scale (4, 8, 12, 16, 24, 32, 48px), border radius, shadow
- Chụp màn hình các dashboard quản lý đẹp (Vercel dashboard, Linear, tham khảo) để lấy ý tưởng

*Buổi 2 — Component Wireframes:*
- Thiết kế wireframe các shared components: Button (4 variants), Table, Modal, Form, Badge
- Thiết kế App Shell: Sidebar layout, Topbar
- **Gợi ý hỏi AI**: *"Tôi đang thiết kế Design System cho web app quản lý. Gợi ý color palette phù hợp và các component cần thiết nhất là gì?"*

*Buổi 3 — Page Wireframes:*
- Thiết kế wireframe Dashboard page (KPI cards + biểu đồ)
- Thiết kế wireframe danh sách (Table page pattern — dùng lại cho Household, Fee, Invoice)
- Export và share link Figma với team trước Sprint Review

**Definition of Done:**
- [ ] Figma project có Design Tokens rõ ràng
- [ ] Ít nhất 3 shared component wireframes
- [ ] App Shell (Sidebar + Topbar) được thiết kế
- [ ] Link Figma được share trong channel team

---

## Sprint 1 — Foundation (Tuần 2–3)

> **Mục tiêu**: Auth backend hoạt động (team có thể bảo vệ API) + Design System (team có thể build UI) + DB migrations + backend skeleton.

---

### 🏷️ [S1-T1] Auth backend hoàn chỉnh + Database migrations
**Phụ trách:** Tuấn  
**Ước tính:** 3 buổi

**Mục tiêu:** Implement Login/Logout/Change Password + JWT middleware mà cả team dùng chung. **Đây là task quan trọng nhất Sprint 1** — team không thể bảo vệ API của họ nếu task này chưa xong.

**Bước thực hiện:**

*Buổi 1 — Database setup:*
- Viết Sequelize migrations cho bảng: `users`, `roles`, `permissions`, `user_roles`
- Chạy test migration: `npx sequelize-cli db:migrate` (không có lỗi)
- Viết seeder cho tài khoản admin mặc định và 3 roles: `admin`, `accountant`, `staff`
- Tạo Sequelize models với associations: `User.belongsToMany(Role)`, `Role.belongsToMany(Permission)`
- Test: `npx sequelize-cli db:seed:all` sau đó query MySQL kiểm tra dữ liệu

*Buổi 2 — Auth API:*
- Implement `POST /auth/login`: validate email/password → bcrypt.compare → JWT sign → return token
- Implement `POST /auth/logout`: thêm token vào blacklist (dùng Set trong memory hoặc bảng `token_blacklist`)
- Implement `POST /auth/change-password`: verify old password → bcrypt hash new password → update DB
- **Gợi ý hỏi AI**: *"Hướng dẫn implement JWT authentication với Node.js/Express và Sequelize. Tôi cần: login trả về token, logout blacklist token, và middleware kiểm tra token cho protected routes."*

*Buổi 3 — Middleware + Demo cho team:*
- Viết `middleware/authenticate.js`: verify JWT → decode → set `req.user = {id, email, role}` → next()
- Viết `middleware/authorize.js`: nhận `role` param → check `req.user.role` → next() hoặc 403
- Viết `middleware/README.md`: hướng dẫn import và dùng (ví dụ code cụ thể)
- Test toàn bộ: các endpoint bảo vệ đúng, lỗi trả về có ý nghĩa
- Demo cho team cuối sprint, giải thích cách import middleware

**Definition of Done:**
- [ ] Login → nhận token → dùng token gọi API protected → thành công
- [ ] Logout → token bị từ chối ở lần gọi tiếp theo
- [ ] Middleware authenticate và authorize có thể import được trong `routes` của dev khác
- [ ] `middleware/README.md` có ví dụ code rõ ràng
- [ ] Tất cả DB migrations chạy clean trên máy mới (test bằng cách drop DB và migrate lại)

---

### 🏷️ [S1-TR1] Design System implementation
**Phụ trách:** Trung  
**Ước tính:** 3 buổi

**Mục tiêu:** Build tất cả shared components trong `/components/ui/`. Đây là "bộ công cụ" cho cả team — phải xong trước để Duy, Phương, Chính có thể bắt đầu frontend trong Sprint 2.

**Bước thực hiện:**

*Buổi 1 — Form components + Layout atoms:*
- Setup Tailwind CSS với custom config (màu từ Figma tokens)
- Implement: `Button` (4 variants × 3 sizes, loading state), `Input` (label, error state, disabled), `Select` (options, default value)
- Implement: `Spinner`, `Badge` (màu theo status)
- Test visual: render tất cả components trong 1 file test tạm để xem có đúng design không

*Buổi 2 — Complex components:*
- Implement: `Modal` (header, body, footer, onClose, isOpen)
- Implement: `Table` (columns config, data array, loading state, empty state)
- Implement: `Card`, `Toast` (success/error/warning, auto-dismiss)
- Implement: `FormLayout`, `PageHeader` (title, breadcrumb, actions slot)
- **Gợi ý hỏi AI**: *"Tôi đang build Table component với React. Cần hỗ trợ: columns config (header + render function), loading skeleton, empty state. Cho tôi xem cách thiết kế props interface tốt."*

*Buổi 3 — App Shell + Usage Guide:*
- Implement `Sidebar` (navigation menu items, active state, collapse trên mobile)
- Implement `Topbar` (tên user, avatar initials, logout button)
- Build App shell trong `App.jsx`: sidebar + topbar + main content area
- Route protection: nếu chưa login → redirect `/login`
- Viết `components/ui/README.md` với props table + code example cho **mỗi component**

**Definition of Done:**
- [ ] Tất cả 13 component files tồn tại trong `/components/ui/`
- [ ] Mỗi component có ít nhất 2 variants/states hoạt động
- [ ] `README.md` có props table và code example cho từng component
- [ ] App shell render được sidebar + topbar khi đã login
- [ ] Duy, Phương, Chính có thể import và dùng được component mà không cần hỏi

---

### 🏷️ [S1-D2] Backend skeleton + DB migration (Module 2)
**Phụ trách:** Duy  
**Ước tính:** 2–3 buổi

**Mục tiêu:** Tạo migration bảng Module 2 + route skeleton để auth middleware có thể được test với routes của Duy.

**Bước thực hiện:**

*Buổi 1 — Database migrations:*
- Viết Sequelize migration: bảng `households` (id, code, name, area, floor, address, deleted_at)
- Viết migration: bảng `residents` (id, household_id, full_name, cccd, dob, gender, relationship)
- Viết migration: bảng `demographic_changes` (id, resident_id, type, start_date, end_date, note)
- Viết migration: bảng `vehicles` (id, household_id, type: motorbike|car, license_plate)
- Test: chạy migrate, kiểm tra bảng tồn tại trong MySQL
- Viết Sequelize models với associations: `Household.hasMany(Resident)`, `Resident.hasMany(Vehicle)` (thông qua Household)...

*Buổi 2 — Route Skeleton + Middleware integration:*
- Tạo `src/routes/households.routes.js` với **skeleton** tất cả endpoints:
  ```javascript
  router.get('/', authenticate, (req, res) => res.json({ data: [], message: 'Coming soon' }));
  router.get('/:id/vehicles', authenticate, (req, res) => res.json({ data: [] }));
  // ... tất cả endpoint khác tương tự
  ```
- Import `authenticate` từ middleware của Tuấn (sau khi Tuấn xong)
- Test: gọi endpoint không có token → nhận 401, có token → nhận skeleton response

*Buổi 3 (nếu cần) — Fix & Coordinate:*
- Test middleware integration cùng Tuấn trong buổi "blocking point cuối S1"
- Fix nếu có lỗi import hoặc format response không khớp
- **Gợi ý hỏi AI**: *"Trong Sequelize, cách viết migration cho bảng có soft delete (cột deleted_at) và cách dùng paranoid: true trong model là gì?"*

**Definition of Done:**
- [ ] 4 migration files chạy thành công
- [ ] Tất cả routes Module 2 đã có skeleton với authenticate middleware
- [ ] Test: gọi `GET /households` với token hợp lệ → 200 `{data: []}`

---

### 🏷️ [S1-P3] Backend skeleton + DB migration (Module 3)
**Phụ trách:** Phương  
**Ước tính:** 2–3 buổi

**Bước thực hiện:**

*Buổi 1 — Database migrations:*
- Viết migration: bảng `fee_types` (id, name, calculation_type: enum, unit_price, description, is_active)
- Viết migration: bảng `fee_type_price_history` (id, fee_type_id, unit_price, effective_from, effective_to)
- Viết migration: bảng `fee_periods` (id, month, year, status: draft|active|closed, created_by)
- Viết migration: bảng `fee_period_fee_types` (bảng trung gian: period_id, fee_type_id)
- Viết migration: bảng `utility_invoices` (id, household_id, period_id, type: electricity|water|internet, amount)
- Test chạy migrate thành công

*Buổi 2 — Route Skeleton + Nghiên cứu decimal.js:*
- Tạo skeleton tất cả routes Module 3 với authenticate middleware
- Đọc docs và test thử `decimal.js`:
  ```javascript
  const Decimal = require('decimal.js');
  const result = new Decimal('15000').times('72.5'); // 1,087,500 đúng
  ```
- Viết hàm helper `calculateFee(type, unitPrice, area)` và test với các trường hợp

*Buổi 3 (nếu cần):*
- Test tích hợp middleware cùng Tuấn
- Thảo luận với Chính về format `GET /fee-periods/:id`
- **Gợi ý hỏi AI**: *"Giải thích tại sao không nên dùng JavaScript float để tính tiền. Và cách dùng decimal.js để tính chính xác."*

**Definition of Done:**
- [ ] 5 migration files chạy thành công (bao gồm bảng price_history)
- [ ] Đã hiểu và có thể dùng decimal.js
- [ ] Tất cả routes Module 3 skeleton có authenticate middleware

---

### 🏷️ [S1-C4] Backend skeleton + DB migration + Nghiên cứu Transactions (Module 4)
**Phụ trách:** Chính  
**Ước tính:** 2–3 buổi

**Bước thực hiện:**

*Buổi 1 — Database migrations:*
- Viết migration: bảng `invoices` (id, household_id, period_id, status: PENDING|PARTIAL|PAID, total_amount, paid_amount)
- Viết migration: bảng `invoice_items` (id, invoice_id, name, amount, fee_type_id)
- Viết migration: bảng `payments` (id, invoice_id, amount, payment_method, paid_at, note)
- Viết Sequelize models với associations

*Buổi 2 — Nghiên cứu Sequelize Transactions + Skeleton:*
- Đọc docs Sequelize Transactions, tự viết ví dụ thử:
  ```javascript
  const t = await sequelize.transaction();
  try {
    const invoice = await Invoice.create({...}, { transaction: t });
    await InvoiceItem.bulkCreate([...], { transaction: t });
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
  ```
- Test: tạo invoice + items trong 1 transaction, ném lỗi giữa chừng → kiểm tra không có record nào được tạo
- Tạo skeleton routes Module 4

*Buổi 3 — State machine design:*
- Viết class hoặc service function `InvoiceStateMachine`:
  ```javascript
  function canTransition(currentStatus, targetStatus) { ... }
  function getNewStatus(paidAmount, totalAmount) { ... }
  ```
- Viết unit tests cho state machine bằng Jest (không cần DB)
- **Gợi ý hỏi AI**: *"Giải thích State Machine pattern. Tôi cần implement: Invoice có 3 trạng thái PENDING/PARTIAL/PAID, không được đi ngược. Cách implement đơn giản nhất trong Node.js?"*

**Definition of Done:**
- [ ] 3 migration files chạy thành công
- [ ] Đã tự viết và hiểu được Sequelize Transaction
- [ ] State machine có unit tests (pass hết)
- [ ] Tất cả routes Module 4 skeleton với authenticate

---

## Sprint 2 — Core Features Backend (Tuần 4–5)

> **Mục tiêu**: Tất cả CRUD APIs hoạt động thực sự. Frontend bắt đầu dùng Design System để build pages.

---

### 🏷️ [S2-T1] RBAC hoàn chỉnh + Quản lý user
**Phụ trách:** Tuấn  
**Ước tính:** 2–3 buổi

**Mục tiêu:** Admin có thể tạo/sửa/xóa/phân quyền user. Các route nhạy cảm chỉ admin mới vào được.

**Bước thực hiện:**

*Buổi 1 — Seed dữ liệu roles & permissions:*
- Seed bảng `roles`: admin, accountant, staff (với mô tả)
- Seed bảng `permissions`: `user:create`, `user:delete`, `household:write`, `fee:write`, `billing:write`...
- Seed bảng `role_permissions`: admin có tất cả, accountant có `billing:*` và `fee:read`, staff có `household:*`

*Buổi 2 — User management APIs:*
- `GET /users`: danh sách user với role, pagination
- `POST /users`: tạo user mới (hash password, assign role)
- `PUT /users/:id`: sửa info + role (admin only)
- `DELETE /users/:id`: soft delete, không được xóa chính mình
- Test từng endpoint với các role khác nhau

*Buổi 3 — Nâng cấp authorize + Viết hướng dẫn:*
- Nâng cấp `authorize.js` để support permission-based (không chỉ role-based)
- Update `middleware/README.md` với ví dụ mới
- Test toàn bộ với JWT middleware
- **Gợi ý hỏi AI**: *"Thiết kế RBAC (Role-Based Access Control) cho web app. Cách phân biệt role-based vs permission-based và khi nào nên dùng cái nào?"*

**Definition of Done:**
- [ ] Admin có thể create/edit/delete user qua API
- [ ] Route admin-only từ chối user không phải admin
- [ ] `middleware/README.md` đã update với ví dụ mới

---

### 🏷️ [S2-D2] Full CRUD Household + Resident APIs
**Phụ trách:** Duy  
**Ước tính:** 3 buổi

**Mục tiêu:** Implement đầy đủ CRUD với validation, pagination, soft delete, và API vehicles.

**Bước thực hiện:**

*Buổi 1 — CRUD Households:*
- `GET /households`: pagination (`?page=1&limit=20`), filter (`?search=tên/mã hộ`, `?floor=`)
- `POST /households`: validate required fields, check mã hộ unique
- `PUT /households/:id`: validate, kiểm tra tồn tại
- `DELETE /households/:id`: soft delete (set `deleted_at = now()`)
- Test đầy đủ: pagination có đúng không, soft delete không hiển thị trong GET list

*Buổi 2 — CRUD Residents + Vehicles:*
- `GET /households/:id/residents`: danh sách nhân khẩu của hộ
- `POST /households/:id/residents`: validate CCCD unique trong hệ thống
- `PUT /residents/:id`: sửa thông tin nhân khẩu
- `GET /households/:id/vehicles`: ⭐ test kỹ, Chính cần API này
- `POST /households/:id/vehicles`: thêm phương tiện
- `DELETE /vehicles/:id`: xóa phương tiện

*Buổi 3 — Frontend trang danh sách hộ:*
- Trang `HouseholdListPage.jsx`: dùng `Table` component, search bar (`Input`), nút "Thêm hộ" (`Button`)
- Connect với `GET /households` API (dùng axios)
- Hiển thị loading state (dùng `Spinner`) và empty state
- **Gợi ý hỏi AI**: *"Viết custom React hook `useHouseholds()` để fetch và cache dữ liệu từ API GET /households. Cần handle loading, error, và refetch."*

**Definition of Done:**
- [ ] CRUD households hoạt động với validation đúng
- [ ] `GET /households/:id/vehicles` hoạt động và Chính đã test được
- [ ] Trang danh sách hộ hiển thị dữ liệu từ API

---

### 🏷️ [S2-P3] Full CRUD Fee Config APIs + Frontend danh sách
**Phụ trách:** Phương  
**Ước tính:** 3 buổi

**Bước thực hiện:**

*Buổi 1 — CRUD Fee Types:*
- `GET /fee-types`: danh sách loại phí
- `POST /fee-types`: validate `calculation_type` là enum hợp lệ, `unit_price` > 0
- `PUT /fee-types/:id`: khi thay đổi `unit_price`, lưu vào `fee_type_price_history`
- `DELETE /fee-types/:id`: không xóa nếu đã có hóa đơn dùng loại phí này (trả lỗi 409)
- Test versioning: sửa đơn giá 2 lần, kiểm tra bảng history có 2 records

*Buổi 2 — CRUD Fee Periods + Utility Invoices:*
- `GET /fee-periods`: danh sách đợt thu
- `POST /fee-periods`: chọn tháng/năm + mảng `feeTypeIds[]`
- `GET /fee-periods/:id`: ⭐ trả về đầy đủ thông tin + list feeTypes (Chính cần API này)
- `POST /utility-invoices`: nhập điện/nước/internet cho 1 hộ trong 1 đợt thu

*Buổi 3 — Frontend 2 trang:*
- `FeeTypeListPage.jsx`: Table + Badge cho calculation_type, nút "Tạo loại phí"
- `FeePeriodListPage.jsx`: Table với trạng thái đợt thu
- Connect APIs, handle loading/error states
- **Gợi ý hỏi AI**: *"Implement lịch sử giá (price versioning) với Sequelize. Khi update bảng fee_types, tự động tạo record trong fee_type_price_history."*

**Definition of Done:**
- [ ] Versioning đơn giá hoạt động đúng
- [ ] `GET /fee-periods/:id` trả về đủ feeTypes với unit_price — Chính test được
- [ ] 2 trang frontend hiển thị dữ liệu từ API

---

### 🏷️ [S2-C4] Generate Invoice API + Frontend danh sách hóa đơn
**Phụ trách:** Chính  
**Ước tính:** 3 buổi

**Mục tiêu:** Implement nghiệp vụ cốt lõi — tự động tạo hóa đơn cho toàn bộ hộ trong 1 đợt thu.

**Bước thực hiện:**

*Buổi 1 — Invoice generation service:*
- Implement `POST /fee-periods/:id/generate-invoices`
- Lấy danh sách households từ DB (không deleted)
- Với mỗi household: gọi `GET /fee-periods/:id` (Phương) để lấy config phí, gọi `GET /households/:id/vehicles` (Duy) để tính phí xe
- Tạo Invoice + InvoiceItems trong 1 Sequelize transaction
- Kiểm tra idempotency: nếu đã generate rồi thì báo lỗi 409
- Test với 3-5 hộ mẫu: kiểm tra số tiền tính đúng không

*Buổi 2 — Invoice query APIs:*
- `GET /invoices`: filter theo `periodId`, `householdId`, `status` (dùng Sequelize `where` + `Op`)
- `GET /invoices/:id`: chi tiết hóa đơn + danh sách invoice_items
- Test: tạo hóa đơn rồi query theo nhiều filter khác nhau

*Buổi 3 — Frontend danh sách hóa đơn:*
- `InvoiceListPage.jsx`: Table với cột: Mã hộ, Tên hộ, Số tiền, Trạng thái (Badge)
- Filter bar: dropdown kỳ thu, dropdown trạng thái
- Connect `GET /invoices` API
- **Gợi ý hỏi AI**: *"Tôi cần gọi 2 API khác nhau (từ Module 2 và Module 3) trong 1 Node.js service function. Cách dùng Promise.all để gọi song song và xử lý lỗi khi 1 trong 2 API fail?"*

**Definition of Done:**
- [ ] Generate hóa đơn cho 5 hộ mẫu → số tiền tính đúng với config phí
- [ ] Tạo duplicate invoice cùng period → nhận 409
- [ ] Trang danh sách hóa đơn filter được theo kỳ và trạng thái

---

### 🏷️ [S2-TR2] Dashboard API + User Management Page
**Phụ trách:** Trung  
**Ước tính:** 2–3 buổi

**Bước thực hiện:**

*Buổi 1 — Dashboard APIs:*
- `GET /dashboard/summary`: trả về `totalCollected`, `collectionRate` (%), `householdsWithDebt`, `totalHouseholds`
- `GET /reports/by-period?periodId=`: chi tiết đợt thu
- `GET /search?q=`: tìm trong households (tên, mã), residents (tên, CCCD)
- Test với dữ liệu mẫu: số liệu có đúng không

*Buổi 2–3 — User Management Page + Login Page:*
- `LoginPage.jsx`: form email + password, gọi `POST /auth/login`, lưu token vào localStorage, redirect đến Dashboard
- `UserManagementPage.jsx` (admin only): Table user + Badge role, Modal thêm/sửa user
- Trang Dashboard bắt đầu: layout KPI cards (số liệu từ `/dashboard/summary`)
- **Gợi ý hỏi AI**: *"Implement authentication flow trong React. Token JWT lưu ở đâu (localStorage vs cookie vs Context)? Cách protect route: nếu chưa login redirect về /login?"*

**Definition of Done:**
- [ ] `GET /dashboard/summary` trả về số liệu đúng
- [ ] Login page hoạt động, sau login redirect đến Dashboard
- [ ] User Management page hiển thị danh sách user

---

## Sprint 3 — Advanced Features & Frontend Completion (Tuần 6–7)

> **Mục tiêu**: Tất cả tính năng v1.0 hoàn thiện. Tích hợp liên module. Integration session cuối sprint.

---

### 🏷️ [S3-D2] Biến động nhân khẩu + Trang chi tiết hộ
**Phụ trách:** Duy  
**Ước tính:** 3 buổi

**Bước thực hiện:**

*Buổi 1 — Demographic Change APIs:*
- `POST /residents/:id/absence`: tạm vắng với `start_date`, `end_date`, `destination`
- `POST /residents/:id/temporary-residence`: tạm trú với `origin_address`, `start_date`
- `POST /residents/:id/transfer`: chuyển đi — set household status inactive
- Validate: ngày tháng hợp lý, không tạo bản ghi trùng lặp
- `GET /demographic-changes?householdId=`: lịch sử biến động của hộ

*Buổi 2 — Hoàn thiện Vehicle APIs:*
- Fix nếu có feedback từ Chính về `GET /households/:id/vehicles`
- Thêm validation: license plate unique trong hệ thống
- `DELETE /vehicles/:id`: xóa phương tiện (soft delete)
- Test end-to-end với Module 4

*Buổi 3 — Trang chi tiết hộ gia đình:*
- `HouseholdDetailPage.jsx`: 3 tab — Nhân khẩu | Phương tiện | Lịch sử biến động
- Tab Nhân khẩu: Table cư dân + nút "Thêm nhân khẩu"
- Tab Phương tiện: Table phương tiện + nút "Đăng ký xe"
- Tab Lịch sử biến động: Timeline biến động nhân khẩu
- Form đăng ký biến động: dropdown loại biến động → form fields tương ứng

**Definition of Done:**
- [ ] 3 loại biến động nhân khẩu hoạt động đúng
- [ ] Trang chi tiết hộ với 3 tab hoạt động
- [ ] Chính xác nhận `GET /households/:id/vehicles` trả đúng data

---

### 🏷️ [S3-P3] Utility invoices + Trang tạo đợt thu đầy đủ
**Phụ trách:** Phương  
**Ước tính:** 3 buổi

**Bước thực hiện:**

*Buổi 1 — Utility Invoice API hoàn chỉnh:*
- `POST /utility-invoices`: nhập điện (kWh + đơn giá), nước (m3 + đơn giá), internet (fixed amount)
- Tính tiền: `electricity_kwh × unit_price` với decimal.js
- Validate: hộ phải tồn tại, đợt thu phải active, không nhập duplicate trong cùng đợt
- `GET /utility-invoices?householdId=&periodId=`: xem hóa đơn đã nhập

*Buổi 2 — Đảm bảo API cho Module 4:*
- Chính test `GET /fee-periods/:id` với đợt thu có nhiều loại phí
- Fix nếu có vấn đề về format
- Test edge case: đợt thu không có loại phí nào

*Buổi 3 — Frontend trang tạo đợt thu + nhập tiện ích:*
- `FeePeriodForm.jsx`: chọn tháng/năm, checkbox chọn loại phí áp dụng, preview
- `UtilityInvoiceForm.jsx`: chọn hộ, nhập chỉ số điện/nước, internet
- Handle validation errors từ API (hiển thị error message dưới field)

**Definition of Done:**
- [ ] Utility invoices tính tiền chính xác với decimal.js
- [ ] Form tạo đợt thu hoạt động end-to-end
- [ ] Chính test được toàn bộ API Module 3

---

### 🏷️ [S3-C4] Payment API + Trang thu phí hoàn chỉnh
**Phụ trách:** Chính  
**Ước tính:** 3 buổi

**Bước thực hiện:**

*Buổi 1 — Payment API:*
- `POST /invoices/:id/pay`: nhận `amount`, `paymentMethod`
- Tạo Payment record + cập nhật `invoice.paid_amount`
- Chạy state machine: tính `newStatus` dựa trên paid_amount vs total_amount
- Dùng Sequelize transaction cho toàn bộ operation này
- Test: thanh toán 1 lần đủ → PAID; thanh toán 2 lần → PARTIAL → PAID

*Buổi 2 — Phí xe tự động + Lịch sử:*
- Đảm bảo generate hóa đơn tính phí xe tự động từ `vehicles`
- `GET /payments?invoiceId=`: lịch sử thanh toán của 1 hóa đơn
- Test rollback: tạo payment thành công nhưng update invoice fail → không có gì được lưu

*Buổi 3 — Trang thu phí frontend:*
- `PaymentPage.jsx`: search box tìm hộ → hiển thị danh sách hóa đơn outstanding → click → modal thu tiền
- Form thu tiền: hiển thị tổng tiền, đã nộp, còn lại; nhập số tiền + phương thức
- Sau thu: cập nhật Badge trạng thái ngay (không cần reload trang)
- `PaymentHistoryPage.jsx`: lịch sử giao dịch với filter

**Definition of Done:**
- [ ] Thanh toán nhiều lần state chuyển đúng PENDING → PARTIAL → PAID
- [ ] Transaction rollback khi có lỗi giữa chừng
- [ ] Trang thu phí UX mượt: tìm hộ → thu tiền → cập nhật ngay

---

### 🏷️ [S3-TR3] Dashboard hoàn chỉnh + UI Review
**Phụ trách:** Trung  
**Ước tính:** 3 buổi

**Bước thực hiện:**

*Buổi 1 — Dashboard page hoàn chỉnh:*
- 4 KPI Cards: Tổng thu tháng này, Tỷ lệ đã nộp (%), Số hộ còn nợ, Tổng số hộ
- Biểu đồ cột (Recharts `BarChart`): thu phí 6 tháng gần nhất
- Biểu đồ tròn (Recharts `PieChart`): tỷ lệ theo loại phí
- Responsive: đẹp trên desktop lẫn tablet

*Buổi 2 — Reports + Search:*
- `ReportPage.jsx`: chọn kỳ → hiển thị bảng chi tiết từng hộ đã/chưa nộp
- Nút xuất Excel (gọi API backend dùng `exceljs`)
- Search bar toàn hệ thống: gọi `GET /search?q=`, hiển thị kết quả nhóm theo loại

*Buổi 3 — UI Review Round 1:*
- Review từng trang của Duy, Phương, Chính:
  - Component có đúng theo Design System không?
  - Spacing, màu sắc có nhất quán không?
  - Responsive cơ bản có ổn không?
- Tạo GitHub Issues cho từng điểm cần sửa, tag người phụ trách
- **Gợi ý hỏi AI**: *"Cho tôi xem cách dùng Recharts BarChart với data là mảng {month, amount}. Cần responsive và custom tooltip hiển thị số tiền theo định dạng VNĐ."*

**Definition of Done:**
- [ ] Dashboard có biểu đồ hiển thị dữ liệu thực từ API
- [ ] Xuất Excel hoạt động (file download được)
- [ ] Đã tạo GitHub Issues cho toàn bộ điểm cần sửa UI

---

## Sprint 4 — Integration, Testing & Bug Fixes (Tuần 8–9)

> **Mục tiêu**: Hệ thống chạy ổn định end-to-end. Tất cả bugs critical được fix.

---

### 🏷️ [S4-PM] UAT + Bug triage
**Phụ trách:** Duy (PM)  
**Ước tính:** 2–3 buổi

**Bước thực hiện:**

*Buổi 1 — Chuẩn bị UAT:*
- Chuẩn bị dữ liệu test: 10 hộ mẫu, 3 loại phí, 1 đợt thu
- Viết UAT script (kịch bản test) cho 4 luồng chính theo template:
  ```
  Luồng 1: Tạo loại phí → Tạo đợt thu → Generate hóa đơn → Thu tiền → Xem Dashboard
  Kết quả mong đợi: [...]
  ```

*Buổi 2 — Chạy UAT:*
- Chạy 4 luồng nghiệp vụ, ghi lại bug: mô tả, steps to reproduce, severity (critical/minor)
- Tạo GitHub Issues cho từng bug, assign đúng người

*Buổi 3 — Track & Verify:*
- Theo dõi tiến độ fix bugs
- Verify lại các bugs được báo là đã fix
- Cập nhật issue status trên GitHub Projects

---

### 🏷️ [S4-D2] Unit Tests + Bug fixes (Module 2)
**Phụ trách:** Duy  
**Ước tính:** 2–3 buổi

**Bước thực hiện:**

*Buổi 1 — Viết unit tests:*
- Setup Jest trong backend: `npm install --save-dev jest supertest`
- Test validation API: tên hộ bắt buộc, CCCD duy nhất, mã hộ duy nhất
- Test soft delete: household không xuất hiện trong list sau khi xóa nhưng vẫn trong DB

*Buổi 2 — Đảm bảo API vehicles cho Module 4:*
- Test `GET /households/:id/vehicles` với nhiều trường hợp: hộ có 0 xe, 1 xe, nhiều xe
- Test format response chính xác với những gì Chính cần
- Fix bugs từ UAT liên quan Module 2

*Buổi 3 — Edge cases:*
- Test biến động nhân khẩu: tạm vắng quá dài, tạm trú đã có bản ghi active
- Fix và verify các bugs được assign

---

### 🏷️ [S4-P3] Unit Tests + Bug fixes (Module 3)
**Phụ trách:** Phương  
**Ước tính:** 2–3 buổi

**Bước thực hiện:**

*Buổi 1 — Unit test tính phí:*
- Test `per_m2`: diện tích 72.5m² × đơn giá 15,000 = 1,087,500 (không dùng float)
- Test `fixed`: mỗi hộ như nhau, không phụ thuộc diện tích
- Test `voluntary`: không tự động tạo, chờ nhập thủ công
- Test edge case: phí = 0, diện tích = 0

*Buổi 2 — Test versioning + Bug fixes:*
- Test: sửa đơn giá 3 lần → bảng history có 3 record đúng
- Test: hóa đơn tháng cũ vẫn tính theo giá cũ (không bị ảnh hưởng bởi thay đổi giá)
- Fix bugs từ UAT

*Buổi 3 — Integration test với Module 4:*
- Cùng Chính chạy test end-to-end: tạo fee period → generate invoices → kiểm tra số tiền đúng với config phí

---

### 🏷️ [S4-C4] Integration test + Bug fixes (Module 4)
**Phụ trách:** Chính  
**Ước tính:** 3 buổi

**Bước thực hiện:**

*Buổi 1 — Test generate invoice end-to-end:*
- Test với nhiều cấu hình phí: per_m2 + fixed + xe máy + ô tô
- Verify từng invoice item tính đúng không
- Test hộ không có xe: không có invoice item phí xe
- Test rollback: mock lỗi khi đang tạo invoice item → toàn bộ transaction bị rollback

*Buổi 2 — Test thanh toán:*
- Test PARTIAL: thanh toán 300,000 cho hóa đơn 500,000 → status PARTIAL, paid_amount = 300,000
- Test thanh toán đủ nhiều lần: 200,000 + 300,000 → status PAID
- Test thanh toán quá số tiền: hóa đơn 500,000 mà thanh toán 600,000 → lỗi hoặc tự động điều chỉnh

*Buổi 3 — Bug fixes + Security:*
- Fix bugs từ UAT
- Kiểm tra SQL injection prevention (Sequelize parameterized queries)
- Test: không thể truy cập invoice của người khác (kiểm tra authorization)

---

### 🏷️ [S4-TR4] Final UI Review + Unit tests Dashboard
**Phụ trách:** Trung  
**Ước tính:** 2–3 buổi

**Bước thực hiện:**

*Buổi 1 — Unit test số liệu Dashboard:*
- Test `GET /dashboard/summary`: mock data trong DB, verify số liệu tổng hợp đúng
- Test collection rate (%): 7 hộ đã PAID / 10 hộ tổng = 70%
- Test xuất Excel: file có đúng columns và data không

*Buổi 2 — Final UI Review:*
- Test responsive: desktop 1920px, laptop 1366px, tablet 768px
- Kiểm tra consistency: màu sắc, font, spacing nhất quán qua tất cả trang
- Kiểm tra browser: Chrome, Firefox, Edge (ít nhất 1 phiên bản gần nhất)
- Tạo danh sách final bugs cần fix trước Sprint 5

*Buổi 3 — Fix UI bugs:*
- Fix các vấn đề tìm được từ UI Review
- Verify lại trên 3 browsers

---

## Sprint 5 — Finalization & Delivery (Tuần 10)

> **Mục tiêu**: Deploy, hoàn thiện tài liệu, demo.

---

### 🏷️ [S5-PM] Documentation hoàn chỉnh
**Phụ trách:** Duy (PM)  
**Ước tính:** 2–3 buổi

**Bước thực hiện:**

*Buổi 1 — SRS + Risk Management:*
- Hoàn thiện `docs/SRS.md`: use case diagram, actors, functional/non-functional requirements
- Update Risk Management document với kết quả thực tế

*Buổi 2 — User Manual:*
- Viết `docs/user-manual.md`: hướng dẫn sử dụng từng tính năng cho ban quản lý chung cư
- Kèm screenshots màn hình thực tế

*Buổi 3 — Chuẩn bị demo:*
- Tạo slide demo (Canva hoặc Google Slides)
- Chuẩn bị kịch bản demo 4 luồng nghiệp vụ
- Chuẩn bị dữ liệu demo thực tế (không dùng dữ liệu test)

---

### 🏷️ [S5-TR+T1] Deploy production
**Phụ trách:** Trung + Tuấn  
**Ước tính:** 2–3 buổi

**Bước thực hiện:**

*Buổi 1 — Database + Backend deploy:*
- Tạo MySQL database trên PlanetScale hoặc TiDB Cloud (free tier)
- Deploy backend lên Railway hoặc Render: connect DB, set environment variables
- Test API endpoint production: `curl https://[your-app].railway.app/health`

*Buổi 2 — Frontend deploy:*
- Build frontend: `npm run build`
- Deploy lên Vercel, set `VITE_API_URL=https://[backend-url]`
- Test đăng nhập trên production URL

*Buổi 3 — README + Deployment Guide:*
- Viết `docs/deployment-guide.md`: steps deploy từ đầu cho người mới
- Update `README.md` với link production
- Final smoke test tất cả tính năng trên production

---

### 🏷️ [S5-D2+P3+C4] API Documentation hoàn chỉnh
**Phụ trách:** Duy, Phương, Chính (mỗi người module của mình)  
**Ước tính:** 1–2 buổi mỗi người

**Bước thực hiện (mỗi người):**

*Buổi 1 — Swagger docs:*
- Update `docs/API-contract.md` với tất cả endpoints thực tế (có thể khác so với Sprint 0 draft)
- Viết Swagger YAML/JSON cho module của mình
- Test: Swagger UI hiển thị đúng, "Try it out" hoạt động được

*Buổi 2 — Local dev guide + Final bugs:*
- Viết section trong README: "Setup local development cho Module X"
- Fix remaining bugs được assign
- Verify trên production URL

---

### 🏷️ [S5-ALL] Demo toàn team
**Tất cả thành viên**  
**Ước tính:** 1 buổi chuẩn bị + buổi demo

**Chuẩn bị:**
- Mỗi người biết demo phần module của mình (không đọc script)
- Test kịch bản demo trước ít nhất 1 lần toàn team

**4 luồng demo:**
1. Admin tạo tài khoản kế toán → kế toán đăng nhập
2. Tạo loại phí → tạo đợt thu → generate hóa đơn cho tất cả hộ
3. Kế toán thu tiền → trạng thái hóa đơn cập nhật
4. Admin xem Dashboard → xuất báo cáo Excel

---

## 📌 Ghi chú quan trọng

### Ưu tiên khi bị trễ tiến độ
1. **Không được bỏ test** — code không test là code bị hỏng chờ sẵn
2. Cắt tính năng "nice to have" (dark mode, animation đẹp) trước khi cắt core feature
3. Báo PM **sớm** khi thấy không kịp — đừng chờ đến cuối sprint

### Integration dependencies
```
Module 4 (Chính) phụ thuộc:
  ← Module 2 (Duy): GET /households/:id/vehicles  [sẵn sàng từ Sprint 2]
  ← Module 3 (Phương): GET /fee-periods/:id        [sẵn sàng từ Sprint 2]

Module 5 (Trung) phụ thuộc:
  ← Module 4 (Chính): invoices, payments data       [sẵn sàng từ Sprint 3]
  ← Tất cả modules: có data để hiển thị
```

### Thứ tự ưu tiên khi có blocker
Nếu API của người khác chưa ready, **ĐỪNG** bỏ task — làm với mock data:
```javascript
// Thay vì gọi API thật:
const vehicles = await axios.get(`/households/${id}/vehicles`);

// Dùng mock tạm:
const vehicles = { data: [
  { type: 'motorbike' }, 
  { type: 'car' }
]};
```
Sau khi API thật sẵn sàng → bỏ mock, test lại.
