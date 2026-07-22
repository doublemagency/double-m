CREATE TABLE IF NOT EXISTS knowledge_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(180) NOT NULL,
  audience ENUM('all','candidate','employer','staff') NOT NULL DEFAULT 'all',
  category VARCHAR(80) NOT NULL,
  title VARCHAR(180) NOT NULL,
  summary VARCHAR(320) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  requires_acknowledgement BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(id), UNIQUE KEY uq_knowledge_slug(slug),
  CONSTRAINT fk_knowledge_editor FOREIGN KEY(updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS knowledge_acknowledgements (
  knowledge_item_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  acknowledged_version INT UNSIGNED NOT NULL,
  acknowledged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(64) NULL,
  PRIMARY KEY(knowledge_item_id,user_id),
  CONSTRAINT fk_ack_item FOREIGN KEY(knowledge_item_id) REFERENCES knowledge_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_ack_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fee_bands (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payer_role ENUM('employer','candidate') NOT NULL,
  fee_name VARCHAR(120) NOT NULL,
  salary_min DECIMAL(12,2) NOT NULL,
  salary_max DECIMAL(12,2) NOT NULL,
  fee_amount DECIMAL(12,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(id), KEY idx_fee_salary(payer_role,is_active,salary_min,salary_max),
  CONSTRAINT fk_fee_editor FOREIGN KEY(updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS staff_activity (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  staff_user_id BIGINT UNSIGNED NOT NULL,
  action_code VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(80) NOT NULL,
  context JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id), KEY idx_staff_activity(staff_user_id,created_at),
  CONSTRAINT fk_activity_staff FOREIGN KEY(staff_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contract_amendments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  contract_id BIGINT UNSIGNED NOT NULL,
  previous_candidate_user_id BIGINT UNSIGNED NULL,
  replacement_candidate_user_id BIGINT UNSIGNED NULL,
  reason VARCHAR(1000) NOT NULL,
  terms_snapshot MEDIUMTEXT NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id), KEY idx_amendment_contract(contract_id,created_at),
  CONSTRAINT fk_amendment_contract FOREIGN KEY(contract_id) REFERENCES employment_contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_amendment_previous FOREIGN KEY(previous_candidate_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_amendment_replacement FOREIGN KEY(replacement_candidate_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_amendment_staff FOREIGN KEY(created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE jobs ADD COLUMN staffing_request_id BIGINT UNSIGNED NULL AFTER id;
ALTER TABLE jobs ADD COLUMN employer_user_id BIGINT UNSIGNED NULL AFTER staffing_request_id;
ALTER TABLE jobs ADD COLUMN created_by BIGINT UNSIGNED NULL AFTER employer_user_id;
ALTER TABLE jobs ADD KEY idx_job_request(staffing_request_id), ADD KEY idx_job_employer(employer_user_id);
ALTER TABLE jobs ADD CONSTRAINT fk_job_request_owner FOREIGN KEY(staffing_request_id) REFERENCES staffing_requests(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD CONSTRAINT fk_job_employer_owner FOREIGN KEY(employer_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD CONSTRAINT fk_job_creator FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE replacement_requests ADD COLUMN replacement_candidate_user_id BIGINT UNSIGNED NULL AFTER employer_user_id;
ALTER TABLE replacement_requests ADD COLUMN resolved_by BIGINT UNSIGNED NULL AFTER replacement_candidate_user_id;
ALTER TABLE replacement_requests ADD COLUMN resolved_at DATETIME NULL AFTER resolved_by;
ALTER TABLE replacement_requests ADD CONSTRAINT fk_replacement_candidate FOREIGN KEY(replacement_candidate_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE replacement_requests ADD CONSTRAINT fk_replacement_resolver FOREIGN KEY(resolved_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE employment_contracts ADD COLUMN salary_amount DECIMAL(12,2) NULL AFTER role_title;
ALTER TABLE employment_contracts ADD COLUMN agency_fee_amount DECIMAL(12,2) NULL AFTER salary_amount;
ALTER TABLE employment_contracts ADD COLUMN candidate_fee_amount DECIMAL(12,2) NULL AFTER agency_fee_amount;
ALTER TABLE employment_contracts ADD COLUMN last_edited_by BIGINT UNSIGNED NULL AFTER created_by;
ALTER TABLE employment_contracts ADD CONSTRAINT fk_contract_last_editor FOREIGN KEY(last_edited_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE financial_transactions ADD COLUMN contract_id BIGINT UNSIGNED NULL AFTER service_price_id;
ALTER TABLE financial_transactions ADD COLUMN detected_method VARCHAR(40) NULL AFTER method_code;
ALTER TABLE financial_transactions ADD CONSTRAINT fk_transaction_contract FOREIGN KEY(contract_id) REFERENCES employment_contracts(id) ON DELETE SET NULL;
