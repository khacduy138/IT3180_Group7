-- BlueMoon Apartment Management System schema
-- MySQL-compatible DDL generated from docs/ERD.md and backend migrations.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS fee_usages;
DROP TABLE IF EXISTS period_fees;
DROP TABLE IF EXISTS fee_periods;
DROP TABLE IF EXISTS fee_types;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS household_members;
DROP TABLE IF EXISTS residents;
DROP TABLE IF EXISTS households;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY roles_name_unique (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY permissions_name_unique (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_username_unique (username),
  KEY users_role_id (role_id),
  CONSTRAINT users_role_id_fk
    FOREIGN KEY (role_id) REFERENCES roles (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  KEY role_permissions_permission_id (permission_id),
  CONSTRAINT role_permissions_role_id_fk
    FOREIGN KEY (role_id) REFERENCES roles (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT role_permissions_permission_id_fk
    FOREIGN KEY (permission_id) REFERENCES permissions (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE households (
  id INT NOT NULL AUTO_INCREMENT,
  uuid CHAR(36) NOT NULL,
  room_number VARCHAR(255) NOT NULL,
  square_meters DECIMAL(8, 2) NOT NULL,
  status VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY households_uuid_unique (uuid),
  UNIQUE KEY households_room_number_unique (room_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE residents (
  id INT NOT NULL AUTO_INCREMENT,
  uuid CHAR(36) NOT NULL,
  user_id INT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(255) NULL,
  citizen_id VARCHAR(255) NULL,
  date_of_birth DATE NULL,
  gender VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY residents_uuid_unique (uuid),
  UNIQUE KEY residents_user_id_unique (user_id),
  UNIQUE KEY residents_citizen_id_unique (citizen_id),
  CONSTRAINT residents_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE household_members (
  id INT NOT NULL AUTO_INCREMENT,
  household_id INT NOT NULL,
  resident_id INT NOT NULL,
  relationship_to_head VARCHAR(255) NULL,
  move_in_date DATE NOT NULL,
  move_out_date DATE NULL,
  is_temporary_absent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY household_members_household_resident_move_in_unique (
    household_id,
    resident_id,
    move_in_date
  ),
  KEY household_members_resident_id (resident_id),
  CONSTRAINT household_members_household_id_fk
    FOREIGN KEY (household_id) REFERENCES households (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT household_members_resident_id_fk
    FOREIGN KEY (resident_id) REFERENCES residents (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vehicles (
  id INT NOT NULL AUTO_INCREMENT,
  household_id INT NOT NULL,
  license_plate VARCHAR(255) NOT NULL,
  vehicle_type VARCHAR(255) NOT NULL,
  registered_at DATE NOT NULL,
  removed_at DATE NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY vehicles_license_plate_unique (license_plate),
  KEY vehicles_household_id (household_id),
  CONSTRAINT vehicles_household_id_fk
    FOREIGN KEY (household_id) REFERENCES households (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE fee_types (
  id INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  calculation_type VARCHAR(255) NOT NULL,
  unit VARCHAR(255) NULL,
  unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  invoice_generation_mode VARCHAR(255) NOT NULL,
  vehicle_type VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY fee_types_code_unique (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE fee_periods (
  id INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  period_type VARCHAR(255) NOT NULL,
  month INT NULL,
  year INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY fee_periods_code_unique (code),
  KEY fee_periods_year (year),
  KEY fee_periods_period_type_year (period_type, year),
  KEY fee_periods_start_end_date (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE period_fees (
  id INT NOT NULL AUTO_INCREMENT,
  fee_period_id INT NOT NULL,
  fee_type_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY period_fees_period_fee_type_unique (fee_period_id, fee_type_id),
  KEY period_fees_fee_type_id (fee_type_id),
  CONSTRAINT period_fees_fee_period_id_fk
    FOREIGN KEY (fee_period_id) REFERENCES fee_periods (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT period_fees_fee_type_id_fk
    FOREIGN KEY (fee_type_id) REFERENCES fee_types (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE fee_usages (
  id INT NOT NULL AUTO_INCREMENT,
  household_id INT NOT NULL,
  period_fee_id INT NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL,
  note VARCHAR(255) NULL,
  entered_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY fee_usages_household_period_fee_unique (household_id, period_fee_id),
  KEY fee_usages_period_fee_id (period_fee_id),
  KEY fee_usages_entered_by (entered_by),
  CONSTRAINT fee_usages_household_id_fk
    FOREIGN KEY (household_id) REFERENCES households (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fee_usages_period_fee_id_fk
    FOREIGN KEY (period_fee_id) REFERENCES period_fees (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fee_usages_entered_by_fk
    FOREIGN KEY (entered_by) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invoices (
  id INT NOT NULL AUTO_INCREMENT,
  uuid CHAR(36) NOT NULL,
  invoice_number VARCHAR(255) NOT NULL,
  -- human-readable identifier, e.g. "2024-08-0001", "2024-08-HH01-001" etc.
  household_id INT NOT NULL,
  fee_period_id INT NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(255) NOT NULL,
  due_date DATE NULL,
  created_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY invoices_uuid_unique (uuid),
  UNIQUE KEY invoices_invoice_number_unique (invoice_number),
  UNIQUE KEY invoices_household_fee_period_unique (household_id, fee_period_id),
  KEY invoices_fee_period_id (fee_period_id),
  KEY invoices_status (status),
  KEY invoices_created_by (created_by),
  CONSTRAINT invoices_household_id_fk
    FOREIGN KEY (household_id) REFERENCES households (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT invoices_fee_period_id_fk
    FOREIGN KEY (fee_period_id) REFERENCES fee_periods (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT invoices_created_by_fk
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invoice_items (
  id INT NOT NULL AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  fee_type_id INT NOT NULL,
  fee_usage_id INT NULL,
  vehicle_id INT NULL,
  quantity DECIMAL(12, 2) NOT NULL,
  price_snapshot DECIMAL(12, 2) NOT NULL,
  line_total DECIMAL(12, 2) NOT NULL,
  source VARCHAR(255) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY invoice_items_invoice_id (invoice_id),
  KEY invoice_items_fee_type_id (fee_type_id),
  KEY invoice_items_fee_usage_id (fee_usage_id),
  KEY invoice_items_vehicle_id (vehicle_id),
  CONSTRAINT invoice_items_invoice_id_fk
    FOREIGN KEY (invoice_id) REFERENCES invoices (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT invoice_items_fee_type_id_fk
    FOREIGN KEY (fee_type_id) REFERENCES fee_types (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT invoice_items_fee_usage_id_fk
    FOREIGN KEY (fee_usage_id) REFERENCES fee_usages (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT invoice_items_vehicle_id_fk
    FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id INT NOT NULL AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(255) NOT NULL,
  payment_date DATETIME NOT NULL,
  note VARCHAR(255) NULL,
  created_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY payments_invoice_id (invoice_id),
  KEY payments_created_by (created_by),
  CONSTRAINT payments_invoice_id_fk
    FOREIGN KEY (invoice_id) REFERENCES invoices (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT payments_created_by_fk
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
