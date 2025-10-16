-- Permitir que vouchers tenham plan_id nulo para recursos customizados
ALTER TABLE vouchers 
ALTER COLUMN plan_id DROP NOT NULL;