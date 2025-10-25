-- Adicionar campo de imagem nos links
ALTER TABLE link_bio_links 
ADD COLUMN image_url text;

-- Adicionar campo de imagem de fundo nos bios
ALTER TABLE link_bios 
ADD COLUMN background_image text;