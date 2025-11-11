-- Adicionar campo para código de verificação TXT na tabela user_domains
ALTER TABLE user_domains 
ADD COLUMN IF NOT EXISTS verification_code TEXT;

-- Gerar códigos únicos para domínios existentes que não têm
UPDATE user_domains 
SET verification_code = encode(gen_random_bytes(16), 'hex')
WHERE verification_code IS NULL;