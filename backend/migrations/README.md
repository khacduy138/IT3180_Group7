# Migrations

Sequelize migration files for the BlueMoon AMS database schema.

Current migration order:

1. `20260526000100-create-auth-core.js`
   - `roles`
   - `permissions`
   - `users`
   - `role_permissions`

2. `20260526000200-create-household-resident.js`
   - `households`
   - `residents`
   - `household_members`
   - `vehicles`

3. `20260526000300-create-fee-configuration.js`
   - `fee_types`
   - `fee_periods`
   - `period_fees`

4. `20260526000400-create-billing-payment.js`
   - `fee_usages`
   - `invoices`
   - `invoice_items`
   - `payments`

5. `20260605000100-add-description-to-roles.js`
   - adds nullable `roles.description`

Run migrations from `backend/`:

```bash
npm run db:migrate
```
