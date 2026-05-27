// =====================================================
// APARTMENT MANAGEMENT SYSTEM ERD
// Final Version
// =====================================================


// =====================================================
// MODULE 1: AUTH & SYSTEM CORE - RBAC
// =====================================================

Table users {
  id integer [primary key, increment]

  username varchar [unique, not null, note: 'Login ID']
  password_hash varchar [not null]

  role_id integer [not null]

  is_active boolean [not null, default: true]

  created_at timestamp
  updated_at timestamp
}

Table roles {
  id integer [primary key, increment]

  name varchar [unique, not null, note: 'admin, accountant, staff, resident']
}

Table permissions {
  id integer [primary key, increment]

  name varchar [unique, not null, note: 'e.g. residents:read, invoices:write']
}

Table role_permissions {
  role_id integer [not null]
  permission_id integer [not null]

  indexes {
    (role_id, permission_id) [pk]
  }
}

Ref: users.role_id > roles.id
Ref: role_permissions.role_id > roles.id
Ref: role_permissions.permission_id > permissions.id


// =====================================================
// MODULE 2: HOUSEHOLD & RESIDENT
// =====================================================

Table households {
  id integer [primary key, increment]

  uuid char(36) [unique, not null]

  room_number varchar [unique, not null]
  square_meters decimal(8,2) [not null]

  status varchar [not null, note: 'ACTIVE, EMPTY']

  created_at timestamp
  updated_at timestamp
}

Table residents {
  id integer [primary key, increment]

  uuid char(36) [unique, not null]

  user_id integer [unique, null, note: 'Optional login account for this resident. One resident can have at most one user account.']

  full_name varchar [not null]
  phone_number varchar

  citizen_id varchar [unique, note: 'CCCD/CMND. Nullable for children or unknown records.']
  date_of_birth date
  gender varchar [not null, note: 'male, female, other']

  created_at timestamp
  updated_at timestamp
}

/*
Household member history.
move_out_date = NULL means the resident is currently living in this household.
*/
Table household_members {
  id integer [primary key, increment]

  household_id integer [not null]
  resident_id integer [not null]

  relationship_to_head varchar [note: 'head, spouse, child, other']

  move_in_date date [not null]
  move_out_date date [null]

  // In case someone is temporarily away. E.g. study/work elsewhere, military service, etc.
  is_temporary_absent boolean [not null, default: false]

  created_at timestamp
  updated_at timestamp

  indexes {
    (household_id, resident_id, move_in_date) [unique]
  }
}

/*
Vehicle history.
removed_at = NULL and is_active = true means the vehicle is currently registered.
*/
Table vehicles {
  id integer [primary key, increment]

  household_id integer [not null]

  license_plate varchar [unique, not null]
  vehicle_type varchar [not null, note: 'motorcycle, car']

  registered_at date [not null]
  removed_at date [null]

  is_active boolean [not null, default: true]

  created_at timestamp
  updated_at timestamp
}

Ref: household_members.household_id > households.id
/*
1 resident can appear in many household_members rows.
E.g: 
Resident A lived in household 101 from 2020 to 2023
Resident A moved to household 205 from 2023 to now
__
household_members row 1: resident_id = A, household_id = 101
household_members row 2: resident_id = A, household_id = 205
*/
Ref: household_members.resident_id > residents.id 
Ref: residents.user_id > users.id
Ref: vehicles.household_id > households.id


// =====================================================
// MODULE 3: FEE CONFIGURATION
// =====================================================

/*
fee_types defines:
1. How the fee is calculated.
2. Whether the fee is mandatory.
3. How backend should generate invoice items.

Important distinction:
- calculation_type tells how to calculate money.
- invoice_generation_mode tells when/how to add the fee into invoice.
*/

Table fee_types {
  id integer [primary key, increment]

  code varchar [unique, not null, note: 'SERVICE_FEE, ELECTRICITY, MOTORBIKE_PARKING, etc.']
  name varchar [not null]

  calculation_type varchar [not null, note: 'per_m2, per_unit, fixed, voluntary']

  unit varchar [null, note: 'm2, kWh, m3, cylinder, vehicle, or NULL']

  unit_price decimal(12,2) [not null, default: 0]

  is_mandatory boolean [not null, default: true]
  is_active boolean [not null, default: true]

  invoice_generation_mode varchar [not null, note: 'AUTO, MANUAL_INPUT, CONDITIONAL_VEHICLE, VOLUNTARY']

  vehicle_type varchar [null, note: 'Only used when invoice_generation_mode = CONDITIONAL_VEHICLE. motorcycle, car.']

  created_at timestamp
  updated_at timestamp
}

/*
fee_periods defines collection periods.

Examples:
- Monthly collection: MONTHLY_2026_04
- Yearly voluntary fund: VOLUNTARY_FUND_2026

When accountants create a new period, they choose which fee_types are collected
through period_fees. A new monthly period can copy period_fees from the previous
monthly period, then add/remove fees if needed.
*/

Table fee_periods {
  id integer [primary key, increment]

  code varchar [unique, not null, note: 'MONTHLY_2026_04, VOLUNTARY_FUND_2026']
  name varchar [not null]

  period_type varchar [not null, note: 'MONTHLY, YEARLY']

  month integer [null, note: '1-12 for monthly periods. NULL for yearly periods.']
  year integer [not null]

  start_date date [not null]
  end_date date [not null]

  status varchar [not null, note: 'DRAFT, ACTIVE, CLOSED']

  created_at timestamp
  updated_at timestamp

  indexes {
    (year)
    (period_type, year)
    (start_date, end_date)
  }
}

/*
period_fees defines which fee_types are collected in each fee_period.
This is the saved setting for a period. Later periods can copy these rows from
an earlier period, then add/remove fee_types before invoice generation.
*/
Table period_fees {
  id integer [primary key, increment]

  fee_period_id integer [not null]
  fee_type_id integer [not null]

  created_at timestamp
  updated_at timestamp

  indexes {
    (fee_period_id, fee_type_id) [unique]
    (fee_type_id)
  }
}

Ref: period_fees.fee_period_id > fee_periods.id
Ref: period_fees.fee_type_id > fee_types.id


// =====================================================
// MODULE 4: BILLING INPUTS
// =====================================================

/*
fee_usages stores manual input before invoice generation.

Used for:
- Electricity
- Water
- Gas
- Other usage-based/manual-input fees

Backend rule:
Only period_fees whose fee_type has invoice_generation_mode = MANUAL_INPUT
should use fee_usages.
*/

Table fee_usages {
  id integer [primary key, increment]

  household_id integer [not null]
  period_fee_id integer [not null]

  quantity decimal(12,2) [not null]

  note varchar

  entered_by integer [not null]

  created_at timestamp
  updated_at timestamp

  indexes {
    (household_id, period_fee_id) [unique]
  }
}

Ref: fee_usages.household_id > households.id
Ref: fee_usages.period_fee_id > period_fees.id
Ref: fee_usages.entered_by > users.id


// =====================================================
// MODULE 5: BILLING & PAYMENT
// =====================================================

/*
One invoice per household per fee_period.
If household needs to pay multiple kinds of fee in the same period,
store them as multiple invoice_items.
*/

Table invoices {
  id integer [primary key, increment]

  uuid char(36) [unique, not null]
  invoice_number varchar [unique, not null, note: 'Human-readable invoice code, e.g. INV-202604-101A']

  household_id integer [not null]
  fee_period_id integer [not null]

  total_amount decimal(12,2) [not null, default: 0]

  status varchar [not null, note: 'PENDING, PARTIAL, PAID, CANCELLED']

  due_date date [null]

  created_by integer [not null]

  created_at timestamp
  updated_at timestamp

  indexes {
    (household_id, fee_period_id) [unique]
    (fee_period_id)
    (status)
  }
}

/*
invoice_items stores immutable invoice line snapshots.

Important:
- price_snapshot preserves historical price.
- line_total preserves historical calculated amount.
- Do not recalculate old invoice_items from current fee_types.
*/

Table invoice_items {
  id integer [primary key, increment]

  invoice_id integer [not null]
  fee_type_id integer [not null]

  fee_usage_id integer [null, note: 'Used when source = MANUAL_INPUT']
  vehicle_id integer [null, note: 'Used when source = VEHICLE']

  quantity decimal(12,2) [not null]
  price_snapshot decimal(12,2) [not null]
  line_total decimal(12,2) [not null]

  source varchar [not null, note: 'AUTO, MANUAL_INPUT, VEHICLE, VOLUNTARY']

  description varchar

  created_at timestamp

  indexes {
    (invoice_id)
    (fee_type_id)
  }
}

Table payments {
  id integer [primary key, increment]

  invoice_id integer [not null]

  amount decimal(12,2) [not null]

  payment_method varchar [not null, note: 'cash, bank_transfer']
  payment_date timestamp [not null]

  note varchar

  created_by integer [not null]

  created_at timestamp
}

Ref: invoices.household_id > households.id
Ref: invoices.fee_period_id > fee_periods.id
Ref: invoices.created_by > users.id

Ref: invoice_items.invoice_id > invoices.id
Ref: invoice_items.fee_type_id > fee_types.id
Ref: invoice_items.fee_usage_id > fee_usages.id
Ref: invoice_items.vehicle_id > vehicles.id

Ref: payments.invoice_id > invoices.id
Ref: payments.created_by > users.id


// =====================================================
// SEED DATA / MOCK RECORDS
// =====================================================


// -------------------------
// Roles
// -------------------------

Records roles(id, name) {
  1, 'admin'
  2, 'accountant'
  3, 'staff'
  4, 'resident'
}


// -------------------------
// Permissions
// -------------------------

Records permissions(id, name) {
  1, 'residents:read'
  2, 'residents:write'

  3, 'households:read'
  4, 'households:write'

  5, 'vehicles:read'
  6, 'vehicles:write'

  7, 'fee_types:read'
  8, 'fee_types:write'

  9, 'fee_periods:read'
  10, 'fee_periods:write'

  11, 'fee_usages:read'
  12, 'fee_usages:write'

  13, 'invoices:read'
  14, 'invoices:write'

  15, 'payments:read'
  16, 'payments:write'

  17, 'reports:read'
}


// -------------------------
// Role Permissions
// -------------------------

Records role_permissions(role_id, permission_id) {
  // admin: all permissions
  1, 1
  1, 2
  1, 3
  1, 4
  1, 5
  1, 6
  1, 7
  1, 8
  1, 9
  1, 10
  1, 11
  1, 12
  1, 13
  1, 14
  1, 15
  1, 16
  1, 17

  // accountant
  2, 3
  2, 5
  2, 7
  2, 9
  2, 11
  2, 12
  2, 13
  2, 14
  2, 15
  2, 16
  2, 17

  // staff
  3, 1
  3, 2
  3, 3
  3, 4
  3, 5
  3, 6
  3, 9
  3, 11
  3, 12

  // resident: self-service read access
  4, 3
  4, 13
  4, 15
}


// -------------------------
// Users
// -------------------------

Records users(id, username, password_hash, role_id, is_active) {
  1, 'admin', 'hashed_password_here', 1, true
  2, 'accountant01', 'hashed_password_here', 2, true
  3, 'staff01', 'hashed_password_here', 3, true
  4, 'resident101a', 'hashed_password_here', 4, true
}


// -------------------------
// Households
// -------------------------

Records households(id, uuid, room_number, square_meters, status) {
  1, '00000000-0000-0000-0000-000000000101', '101A', 75.50, 'ACTIVE'
  2, '00000000-0000-0000-0000-000000000102', '102A', 80.00, 'ACTIVE'
}


// -------------------------
// Residents
// -------------------------

Records residents(id, uuid, user_id, full_name, phone_number, citizen_id, date_of_birth, gender) {
  1, '00000000-0000-0000-0000-000000000201', 4, 'Nguyễn Văn A', '0912345678', '001201000001', '1980-01-15', 'male'
  2, '00000000-0000-0000-0000-000000000202', null, 'Trần Thị B', '0987654321', '001201000002', '1984-03-20', 'female'
}


// -------------------------
// Household Members
// -------------------------

Records household_members(id, household_id, resident_id, relationship_to_head, move_in_date, move_out_date, is_temporary_absent) {
  1, 1, 1, 'head', '2020-01-01', null, false
  2, 1, 2, 'spouse', '2020-01-01', null, false
}


// -------------------------
// Vehicles
// -------------------------

Records vehicles(id, household_id, license_plate, vehicle_type, registered_at, removed_at, is_active) {
  1, 1, '29A1-12345', 'motorcycle', '2026-01-01', null, true
  2, 2, '30A-56789', 'car', '2026-01-01', null, true
}


// -------------------------
// Fee Periods
// -------------------------

Records fee_periods(id, code, name, period_type, month, year, start_date, end_date, status) {
  1, 'MONTHLY_2026_04', 'Monthly billing period 04/2026', 'MONTHLY', 4, 2026, '2026-04-01', '2026-04-30', 'ACTIVE'
  2, 'MONTHLY_2026_05', 'Monthly billing period 05/2026', 'MONTHLY', 5, 2026, '2026-05-01', '2026-05-31', 'DRAFT'
  3, 'VOLUNTARY_FUND_2026', 'Voluntary fund 2026', 'YEARLY', null, 2026, '2026-01-01', '2026-12-31', 'ACTIVE'
}


// -------------------------
// Fee Types
// -------------------------

Records fee_types(id, code, name, calculation_type, unit, unit_price, is_mandatory, is_active, invoice_generation_mode, vehicle_type) {
  1, 'SERVICE_FEE', 'Apartment service fee', 'per_m2', 'm2', 12000, true, true, 'AUTO', null
  2, 'MANAGEMENT_FEE', 'Management fee', 'per_m2', 'm2', 8000, true, true, 'AUTO', null

  3, 'ELECTRICITY', 'Electricity fee', 'per_unit', 'kWh', 3500, true, true, 'MANUAL_INPUT', null
  4, 'WATER', 'Water fee', 'per_unit', 'm3', 12000, true, true, 'MANUAL_INPUT', null
  5, 'GAS', 'Gas fee', 'per_unit', 'cylinder', 400000, true, true, 'MANUAL_INPUT', null
  6, 'INTERNET', 'Internet fee', 'fixed', 'month', 150000, true, true, 'MANUAL_INPUT', null

  7, 'MOTORBIKE_PARKING', 'Motorbike parking fee', 'fixed', 'vehicle', 70000, true, true, 'CONDITIONAL_VEHICLE', 'motorcycle'
  8, 'CAR_PARKING', 'Car parking fee', 'fixed', 'vehicle', 1200000, true, true, 'CONDITIONAL_VEHICLE', 'car'

  9, 'VOLUNTARY_FUND', 'Voluntary fund', 'voluntary', null, 0, false, true, 'VOLUNTARY', null
}


// -------------------------
// Period Fees
// -------------------------

Records period_fees(id, fee_period_id, fee_type_id) {
  // MONTHLY_2026_04
  1, 1, 1
  2, 1, 2
  3, 1, 3
  4, 1, 4
  5, 1, 6
  6, 1, 7
  7, 1, 8

  // MONTHLY_2026_05 copies the April setup, then can be changed before activation
  8, 2, 1
  9, 2, 2
  10, 2, 3
  11, 2, 4
  12, 2, 6
  13, 2, 7
  14, 2, 8

  // VOLUNTARY_FUND_2026
  15, 3, 9
}


// -------------------------
// Fee Usages
// -------------------------

Records fee_usages(id, household_id, period_fee_id, quantity, note, entered_by) {
  1, 1, 3, 100, 'Electricity usage for 04/2026', 3
  2, 1, 4, 15, 'Water usage for 04/2026', 3
}


// -------------------------
// Invoices
// -------------------------

Records invoices(id, uuid, invoice_number, household_id, fee_period_id, total_amount, status, due_date, created_by) {
  1, '00000000-0000-0000-0000-000000000301', 'INV-202604-101A', 1, 1, 2110000, 'PENDING', '2026-05-10', 2
}


// -------------------------
// Invoice Items
// -------------------------

Records invoice_items(id, invoice_id, fee_type_id, fee_usage_id, vehicle_id, quantity, price_snapshot, line_total, source, description) {
  1, 1, 1, null, null, 75.50, 12000, 906000, 'AUTO', 'Apartment service fee for 04/2026'
  2, 1, 2, null, null, 75.50, 8000, 604000, 'AUTO', 'Management fee for 04/2026'

  3, 1, 3, 1, null, 100, 3500, 350000, 'MANUAL_INPUT', 'Electricity fee for 04/2026'
  4, 1, 4, 2, null, 15, 12000, 180000, 'MANUAL_INPUT', 'Water fee for 04/2026'

  5, 1, 7, null, 1, 1, 70000, 70000, 'VEHICLE', 'Motorbike parking fee for 04/2026'
}
