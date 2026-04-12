# Branch naming:

- `feature/m{số}-{tên-tính-năng}` # ví dụ: feature/m2-household-crud
- `fix/m{số}-{mô-tả-lỗi}` # ví dụ: fix/m4-invoice-state-machine
- `hotfix/{mô-tả}` # chỉ dùng khi lỗi production

# Commit message (Conventional Commits):

- `feat(m2): add CRUD API for households`
- `fix(m4): correct PARTIAL payment state transition`
- `chore: update .gitignore for node_modules`
- `docs: add API contract for Module 3`
- `test(m1): add unit test for JWT middleware`

# File naming:

- **Source files:** `camelCase.js` / `PascalCase.jsx`
- **Docs:** `kebab-case.md`
- **Không dùng khoảng trắng, ký tự đặc biệt**

# Cấu trúc thư mục dự án BlueMoon-AMS
```
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
│   ├── API-contract.md          # Swagger/OpenAPI cho cả team thống nhất
│   ├── ERD.md
│   ├── deployment-guide.md
│   └── user-manual.md
├── frontend/                    # React.js (Dev 5 setup chính)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/              # Design System — Dev 5 Trung sở hữu
│   │   │       ├── Button.jsx
│   │   │       ├── Table.jsx
│   │   │       └── README.md
│   │   ├── pages/
│   │   │   ├── auth/            # Module 1 — Dev 1 Tuấn
│   │   │   ├── households/      # Module 2 — Dev 2 Duy
│   │   │   ├── fees/            # Module 3 — Dev 3 Phương
│   │   │   ├── billing/         # Module 4 — Dev 4 Chính
│   │   │   └── dashboard/       # Module 5 — Dev 5 Trung
│   │   ├── hooks/
│   │   ├── services/            # API calls (axios)
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
├── backend/                     # Node.js/Express (Dev 1 setup DB schema)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── households.routes.js
│   │   │   ├── fees.routes.js
│   │   │   ├── billing.routes.js
│   │   │   └── dashboard.routes.js
│   │   ├── controllers/
│   │   ├── models/              # Sequelize models
│   │   ├── middleware/
│   │   │   ├── authenticate.js  # Dev 1 viết, team import
│   │   │   └── authorize.js
│   │   └── utils/
│   ├── migrations/              # DB migrations theo từng sprint
│   ├── seeders/
│   ├── config/
│   │   └── config.json          # DB config (không commit thật)
│   ├── .env.example             # Template biến môi trường
│   └── package.json
└── .env.example                 # Root level env template
```
