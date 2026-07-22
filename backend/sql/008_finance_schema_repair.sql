CREATE TABLE IF NOT EXISTS service_prices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  service_code VARCHAR(80) NOT NULL,
  service_name VARCHAR(160) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'KES',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(id),
  UNIQUE KEY uq_service_code(service_code),
  CONSTRAINT fk_price_admin FOREIGN KEY(updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_methods (
  method_code VARCHAR(40) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  configuration JSON NULL,
  updated_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(method_code),
  CONSTRAINT fk_payment_method_admin FOREIGN KEY(updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS financial_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payer_user_id BIGINT UNSIGNED NOT NULL,
  service_price_id BIGINT UNSIGNED NULL,
  contract_id BIGINT UNSIGNED NULL,
  reference_code VARCHAR(50) NOT NULL,
  purpose VARCHAR(180) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'KES',
  method_code VARCHAR(40) NULL,
  detected_method VARCHAR(40) NULL,
  status ENUM('pending','processing','paid','failed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  external_reference VARCHAR(120) NULL,
  paid_at DATETIME NULL,
  recorded_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id),
  UNIQUE KEY uq_financial_reference(reference_code),
  KEY idx_financial_payer(payer_user_id,created_at),
  CONSTRAINT fk_financial_payer FOREIGN KEY(payer_user_id) REFERENCES users(id),
  CONSTRAINT fk_financial_price FOREIGN KEY(service_price_id) REFERENCES service_prices(id) ON DELETE SET NULL,
  CONSTRAINT fk_financial_method FOREIGN KEY(method_code) REFERENCES payment_methods(method_code) ON DELETE SET NULL,
  CONSTRAINT fk_financial_staff FOREIGN KEY(recorded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS receipts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  transaction_id BIGINT UNSIGNED NOT NULL,
  receipt_number VARCHAR(50) NOT NULL,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  issued_by BIGINT UNSIGNED NULL,
  PRIMARY KEY(id),
  UNIQUE KEY uq_receipt_number(receipt_number),
  UNIQUE KEY uq_receipt_transaction(transaction_id),
  CONSTRAINT fk_receipt_transaction FOREIGN KEY(transaction_id) REFERENCES financial_transactions(id),
  CONSTRAINT fk_receipt_staff FOREIGN KEY(issued_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
