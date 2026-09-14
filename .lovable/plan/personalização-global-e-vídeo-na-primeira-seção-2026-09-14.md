# Personalização global e vídeo na primeira seção

## Objetivo

- Remover definitivamente do painel master qualquer item ou configuração de Blog.
- Permitir que o administrador escolha uma cor principal única para todo o produto.
- Exibir um vídeo configurável entre o título e a descrição da primeira seção pública.

## Implementação

### 1. Remoção do Blog no master

- Revisar menu, imports e seções renderizadas do painel master.
- Remover os textos residuais de Blog e Configurações do Blog das traduções.
- Manter apenas dados históricos já existentes no banco, sem qualquer acesso visível no produto.

### 2. Cor principal global

- Adicionar em **Painel Master → Configurações do Site → Marca** um seletor visual e campo hexadecimal.
- Validar o formato da cor antes de salvar e mostrar uma prévia.
- Persistir a escolha nas configurações do site.
- Criar um carregador global que converta a cor escolhida para os tokens de tema e aplique automaticamente em:
  - página inicial;
  - painel do usuário;
  - painel master;
  - botões, links, destaques, bordas e menu lateral;
  - temas claro e escuro.
- Atualizar a cor em tempo real quando o master salvar, sem exigir alteração manual no código.

### 3. Vídeo na primeira seção

- Reaproveitar o campo de vídeo existente nas configurações do site.
- Renderizar o vídeo entre o título principal e a descrição na primeira seção.
- Aceitar links do YouTube, Vimeo, Google Drive e arquivos de vídeo diretos.
- Não renderizar espaço vazio quando nenhuma URL estiver configurada.
- Manter proporção correta, controles de reprodução e adaptação para celular e computador.

## Verificação

- Confirmar por busca que Blog e Configurações do Blog não aparecem no painel master.
- Validar salvamento e aplicação global de uma cor de teste nos dois temas.
- Conferir a primeira seção com e sem vídeo em telas de celular e computador.
- Executar os testes do projeto e verificar erros no navegador.
