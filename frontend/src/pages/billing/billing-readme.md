# M4 - Billing (Frontend)

## Purpose
This folder contains the minimal UI for **Module 4: Billing**.

## API (current backend placeholders)
- `GET /api/billing` → list invoices (placeholder: `{ message, data: [] }`)
- `POST /api/billing` → create invoice (placeholder: `{ message }`)

## Dev notes
- Frontend uses `REACT_APP_API_BASE_URL` (defaults to `/api`).
- With CRA proxy, requests to `/api/*` should be proxied to backend.
