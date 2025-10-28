-- Adicionar campos de header e footer em cloned_pages
ALTER TABLE cloned_pages 
ADD COLUMN IF NOT EXISTS custom_header_code TEXT,
ADD COLUMN IF NOT EXISTS custom_footer_code TEXT;