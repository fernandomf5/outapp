-- Atualizar video_section_title
UPDATE site_settings SET value = 'Conheça a Out App' WHERE key = 'video_section_title';

-- Atualizar landing_features para remover referências ao Bot Reals Zap
UPDATE site_settings 
SET value = REPLACE(REPLACE(value, 'Bot Reals Zap', 'Out App'), 'Bot Reals Zapp', 'Out App')
WHERE key = 'landing_features';

-- Atualizar footer_code para usar o novo domínio
UPDATE site_settings 
SET value = REPLACE(value, 'botrealszapp.com.br', 'outapp.com.br')
WHERE key = 'footer_code';

-- Atualizar custom_footer_code para usar o novo domínio
UPDATE site_settings 
SET value = REPLACE(value, 'botrealszapp.com.br', 'outapp.com.br')
WHERE key = 'custom_footer_code';