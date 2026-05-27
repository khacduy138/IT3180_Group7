# Database Schema

This document summarizes the current relational schema implemented by the Sequelize migrations in `backend/migrations`.

## Module 1: Auth & System Core

- `roles`: RBAC role names such as `admin`, `accountant`, `staff`, and `resident`.
- `permissions`: permission keys such as `residents:read` and `invoices:write`.
- `role_permissions`: many-to-many join table between roles and permissions.
- `users`: login accounts. Each user belongs to one role.

## Module 2: Household & Resident

- `households`: apartment/room records.
- `residents`: personal resident records. `user_id` is nullable and unique, so a resident can have zero or one login account.
- `household_members`: household membership history. A resident can appear in multiple rows over time.
- `vehicles`: vehicle registration history per household.

## Module 3: Fee Configuration

- `fee_types`: catalog of fee definitions, for example service fee, electricity, water, internet, parking, and voluntary fund.
- `fee_periods`: collection periods such as `MONTHLY_2026_04` or `VOLUNTARY_FUND_2026`.
- `period_fees`: saved setting for which fee types are collected in each period.

Monthly periods can copy `period_fees` from the previous month and then add/remove fees before activation.

## Module 4: Billing Inputs

- `fee_usages`: manual usage input for selected period fees, such as electricity kWh or water m3.

`fee_usages.period_fee_id` points to `period_fees`, so a usage row can only be entered for a fee type that belongs to that period.

## Module 5: Billing & Payment

- `invoices`: one invoice per household per fee period.
- `invoice_items`: invoice line snapshots. These keep `quantity`, `price_snapshot`, and `line_total` so old invoices do not change when fee settings change later.
- `payments`: payment records against invoices.

## Billing Flow

1. Create or update `fee_types`.
2. Create a `fee_periods` row, for example `MONTHLY_2026_04`.
3. Add selected fees to `period_fees`.
4. Enter manual quantities in `fee_usages` for fees whose generation mode is `MANUAL_INPUT`.
5. Generate one `invoices` row per household for the period.
6. Generate `invoice_items` from `period_fees`, `fee_usages`, household area, and vehicles.
7. Record payments in `payments` and update invoice status.

## Migration Files

- `20260526000100-create-auth-core.js`
- `20260526000200-create-household-resident.js`
- `20260526000300-create-fee-configuration.js`
- `20260526000400-create-billing-payment.js`
