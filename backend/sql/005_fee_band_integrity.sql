ALTER TABLE fee_bands ADD UNIQUE KEY uq_fee_band(payer_role,salary_min,salary_max);
