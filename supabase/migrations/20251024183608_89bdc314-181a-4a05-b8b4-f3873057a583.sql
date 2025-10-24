-- Habilitar replica identity full para capturar todos os dados nas atualizações
ALTER TABLE ticket_notifications REPLICA IDENTITY FULL;