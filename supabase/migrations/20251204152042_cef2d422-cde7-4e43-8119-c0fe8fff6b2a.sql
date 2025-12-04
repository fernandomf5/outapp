-- Atualizar footer do blog de Bot Reals Zapp para Out App
UPDATE blog_settings 
SET footer_content = REPLACE(footer_content, 'Bot Reals Zapp', 'Out App')
WHERE footer_content LIKE '%Bot Reals Zapp%';