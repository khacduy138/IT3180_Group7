# 🚀 BlueMoon-AMS (Apartment Management System)

Tài liệu này quy định các chuẩn mực về viết code, quản lý source code (Git Workflow) và cấu trúc thư mục của dự án **BlueMoon-AMS** nhằm đảm bảo sự thống nhất và hiệu quả làm việc nhóm.

---

## 1. 📋 Quy chuẩn Đặt tên (Naming Conventions)

### 1.1. Tên Nhánh (Branch Naming)
Luôn tạo nhánh mới từ nhánh `develop`. Sử dụng format sau:
*Lưu ý: `m{số}` tương ứng với số thứ tự Module của từng thành viên.*

| Loại nhánh | Cú pháp | Ví dụ | Quy mô sử dụng |
| :--- | :--- | :--- | :--- |
| **Feature** | `feature/m{số}-{tên-tính-năng}` | `feature/m2-household-crud` | Phát triển tính năng mới |
| **Bug Fix** | `fix/m{số}-{mô-tả-lỗi}` | `fix/m4-invoice-state-machine` | Sửa lỗi trong quá trình dev |
| **Hotfix** | `hotfix/{mô-tả-lỗi}` | `hotfix/crash-on-login` | **Chỉ dùng** khi sửa lỗi khẩn cấp trên Production |

### 1.2. Lịch sử Commit (Conventional Commits)
Áp dụng chuẩn [Conventional Commits](https://www.conventionalcommits.org/). Luôn gắn tag module `(m{số})` vào các commit liên quan trực tiếp đến tính năng.

| Loại | Cú pháp | Ví dụ | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| **feat** | `feat(m{số}): {mô tả}` | `feat(m2): add CRUD API for households` | Thêm tính năng mới |
| **fix** | `fix(m{số}): {mô tả}` | `fix(m4): correct PARTIAL payment state` | Sửa lỗi (bug) |
| **chore** | `chore: {mô tả}` | `chore: update .gitignore for node_modules` | Cập nhật cấu hình, tool, thư viện... |
| **docs** | `docs: {mô tả}` | `docs: add API contract for Module 3` | Thêm/sửa tài liệu |
| **test** | `test(m{số}): {mô tả}`| `test(m1): add unit test for JWT middleware`| Thêm/sửa test case |

### 1.3. Tên File & Thư mục
*   **Source files (JS/TS):** Sử dụng `camelCase.js` (VD: `householdController.js`).
*   **React Components:** Sử dụng `PascalCase.jsx` (VD: `HouseholdList.jsx`).
*   **Tài liệu (Docs):** Sử dụng `kebab-case.md` (VD: `deployment-guide.md`).
*   ⚠️ **Lưu ý:** Không sử dụng khoảng trắng, tiếng Việt có dấu hoặc ký tự đặc biệt trong tên file/thư mục.

---

## 2. 👨‍💻 Phân công Module & Vai trò
*(Dựa trên cấu trúc dự án)*

| Module | Phụ trách | Tên Module | Trách nhiệm chính / Ghi chú |
| :---: | :--- | :--- | :--- |
| **M1** | **Tuấn** | Authentication | Init Backend, setup DB Schema, viết Middleware dùng chung |
| **M2** | **Duy** | Households | Quản lý hộ gia đình, nhân khẩu |
| **M3** | **Phương** | Fees | Quản lý các loại phí (chung cư, dịch vụ...) |
| **M4** | **Chính** | Billing | Quản lý hóa đơn, thu phí, state thanh toán |
| **M5** | **Trung** | Dashboard / UI | Init Frontend, setup React, xây dựng Design System (UI components) |

---

## 3. 📁 Cấu trúc Thư mục (Project Structure)

```text
BlueMoon-AMS/
├── README.md
├── CHANGELOG.md
├── .gitignore
├── LICENSE
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── SRS.md
│   ├── API-contract.md # Swagger/OpenAPI cho cả team thống nhất
│   ├── ERD.md
│   ├── deployment-guide.md
│   └── user-manual.md
├── frontend/ # React.js (Dev 5 setup chính)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/ # Design System — Dev 5 Trung sở hữu
│   │   │       ├── Button.jsx
│   │   │       ├── Table.jsx
│   │   │       └── README.md
│   │   ├── pages/
│   │   │   ├── auth/ # Module 1 — Dev 1 Tuấn
│   │   │   ├── households/ # Module 2 — Dev 2 Duy
│   │   │   ├── fees/ # Module 3 — Dev 3 Phương
│   │   │   ├── billing/ # Module 4 — Dev 4 Chính
│   │   │   └── dashboard/ # Module 5 — Dev 5 Trung
│   │   ├── hooks/
│   │   ├── services/ # API calls (axios)
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
├── backend/ # Node.js/Express (Dev 1 setup DB schema)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── households.routes.js
│   │   │   ├── fees.routes.js
│   │   │   ├── billing.routes.js
│   │   │   └── dashboard.routes.js
│   │   ├── controllers/
│   │   ├── models/ # Sequelize models
│   │   ├── middleware/
│   │   │   ├── authenticate.js # Dev 1 viết, team import
│   │   │   └── authorize.js
│   │   └── utils/
│   ├── migrations/ # DB migrations theo từng sprint
│   ├── seeders/
│   ├── config/
│   │   └── config.json # DB config (không commit thật)
│   ├── .env.example # Template biến môi trường
│   └── package.json
└── .env.example # Root level env template
```

---

## 4. 🌿 Quy trình Làm việc (Git Workflow)

Luôn tuân thủ quy trình dưới đây để hạn chế tối đa Conflict code.

**Bước 1: Luôn bắt đầu bằng việc cập nhật nhánh `develop` mới nhất**
```bash
git checkout develop
git pull origin develop
```

**Bước 2: Tạo nhánh tính năng (feature) từ `develop`**
```bash
git checkout -b feature/m2-household-soft-delete
```

**Bước 3: Code & Commit thường xuyên**
```bash
git add src/controllers/householdController.js
git commit -m "feat(m2): implement soft delete for households"
```

**Bước 4: Cập nhật lại `develop` trước khi đẩy code lên (QUAN TRỌNG)**
```bash
git checkout develop
git pull origin develop
git checkout feature/m2-household-soft-delete
git merge develop   # Giải quyết conflict tại bước này nếu có
```

**Bước 5: Push nhánh tính năng lên GitHub**
```bash
git push origin feature/m2-household-soft-delete
```

**Bước 6: Tạo Pull Request (PR)**
*   Lên GitHub, tạo Pull Request từ nhánh `feature/...` target vào nhánh `develop`.
*   Điền đầy đủ thông tin theo PR Template.
*   Tag các thành viên liên quan (Reviewers) để kiểm tra chéo (Cross-review).

---

## 5. ⚔️ Xử lý Xung đột (Merge Conflict)

Nếu ở **Bước 4** phía trên Git thông báo có Conflict, hãy bình tĩnh xử lý theo các bước sau:

1. **Kiểm tra các file bị Conflict:**
   ```bash
   git status
   ```
2. **Mở các file báo đỏ trên VS Code (hoặc IDE đang dùng):**
   Tìm kiếm các đoạn code được đánh dấu bởi Git:
   ```text
   <<<<<<< HEAD
   (Code hiện tại của bạn)
   =======
   (Code từ nhánh develop được pull về)
   >>>>>>> develop
   ```
3. **Chỉnh sửa thủ công:** Xóa các dòng đánh dấu (`<<<<`, `====`, `>>>>`) và giữ lại phần code đúng nhất (hoặc kết hợp cả hai).
4. **Lưu file và Commit phần đã sửa:**
   ```bash
   git add .
   git commit -m "fix: resolve merge conflict in household model"
   git push origin <tên-nhánh-của-bạn>
   ```

---

## 6. 📊 Tổng quan tiến trình dự án

<div align="center">
  <img src="https://github.com/user-attachments/assets/7a728c27-113f-44b9-b36c-70ac9a9709e6" alt="System Architecture / ERD" width="80%">
  <br>
  <i>Sơ đồ thiết kế hệ thống BlueMoon-AMS</i>
</div>
