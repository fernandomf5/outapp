## Contexto encontrado no projeto

Boa notícia: parte da base já existe e pode ser reaproveitada em vez de recriar do zero.

- **Catálogo**: as tabelas (`catalogs`, `catalog_orders`, `catalog_customers`, `catalog_banners`, `product_categories`, `products`, `stock_movements`) e os componentes (`CatalogCreatorPanel`, `CatalogDashboard`, `CatalogOrdersPanel`, `CatalogProductSelector`, `CatalogCart`, `CatalogBannersManager`, página pública `/catalogo/:slug`) **ainda existem no código**, apenas foram desligados do menu/dashboard.
- **Produtos**: `ProductsServicesPanel` + estoque + categorias também existem, desligados do menu.
- **Portfólio**: as tabelas `portfolios` e `portfolio_items` existem, mas **não há nenhuma interface** construída.
- **Página de Captura**: existem `builder_pages` + `PageEditor` (editor de elementos) e `cloned_page_leads`, mas não há um criador de landing page com formulário configurável.

Observação: catálogo e produtos foram removidos do menu numa etapa anterior a pedido seu. Este plano os **reativa e evolui**, conforme o novo pedido.

---

## Escopo e faseamento

O pedido completo (3 construtores visuais + captura de leads + pedidos + pagamentos + métricas) é grande demais para uma entrega única com qualidade. Proponho entregar em 3 fases, cada uma funcional de ponta a ponta.

### Fase 1 — Criador de Página de Captura

Novo item no menu **Recursos Avançados: "Página de Captura"**.

- **Lista**: criar, duplicar, editar, excluir, publicar/despublicar, copiar link, compartilhar, visualizar prévia.
- **Construtor de formulário**: campos arrastáveis (nome, e-mail, telefone, WhatsApp, cidade, estado, nascimento, empresa, cargo, texto livre, seleção, checkbox, upload de arquivo, campo personalizado). Editar rótulo, placeholder, obrigatoriedade, opções; reordenar por arrastar e soltar.
- **Editor visual da página** em blocos (adicionar/editar/excluir/reordenar): hero com título/subtítulo, texto, imagem, vídeo incorporado, botão, ícones, benefícios, depoimentos, FAQ, contador, cards, galeria, redes sociais, rodapé, bloco de formulário.
- **Estilo global**: cor de fundo, imagem de fundo, paleta, tipografia, tamanho de texto, espaçamento, bordas, arredondamento, estilo de botão, animações.
- **Página pública** em `/captura/:slug`, responsiva, com pixels/tracking já existentes na plataforma.
- **Painel de leads**: listar, pesquisar, filtrar, ver dados enviados, alterar status, exportar CSV, ver origem. Botão "Enviar para Cadastro" (cria contato em `contacts`) e "Enviar para Funil de Vendas" (`funnel_leads`).
- Botão **"Atribuir a cadastro"** (padrão `ResourceAssignmentsButton` já usado nos demais recursos).

### Fase 2 — Criador de Portfólio

Novo item no menu **Recursos Avançados: "Portfólio"**.

- **Assistente inicial**: escolha do tipo (Desenvolvedor, Designer, Fotógrafo, Videomaker, Social Media, Marketing, Arquitetura, Engenharia, Freelancer, Artista, Projetos, Empresas, Serviços, Profissional, Personalizado, Criar do Zero) → gera automaticamente o esquema de campos dos projetos daquele nicho.
- **Editor de campos dos projetos**: criar, editar, excluir e reordenar campos; tipos texto, texto longo, data, link, tags/tecnologias, imagem, galeria, vídeo, arquivo.
- **Projetos**: cadastro, categorias, ordenação por arrastar e soltar, destaque.
- **Personalização visual**: templates prontos, cores, fundo/imagem de fundo, fontes, cabeçalho, menu, seções (sobre, serviços, depoimentos, contato, galeria), redes sociais, WhatsApp, botões, rodapé, layouts de grade.
- **Página pública** em `/portfolio/:slug`, responsiva, com prévia, publicar/despublicar, link e compartilhamento.
- Formulário de contato do portfólio grava nos leads da plataforma.

### Fase 3 — Criador de Catálogo (reativação + evolução)

- Reativar no menu **Recursos Avançados: "Catálogo"** e **Básicos: "Produtos e Serviços"** (necessário para alimentar o catálogo).
- Revisar e corrigir o que quebrou desde a remoção; integrar seleção de produtos já cadastrados, categorias/subcategorias, variações (tamanho/cor), promoção, destaque, estoque sincronizado.
- **Aparência**: templates, cores, fundo, logo, banners promocionais, layouts de card, botões, redes sociais, WhatsApp, dados da empresa, endereço, horário.
- **Status**: aberto/fechado, ativo/inativo, mensagem de fechado, horário de funcionamento.
- **Pedidos**: painel com novo → confirmado → em preparo → pronto → concluído/cancelado, histórico e notificação em tempo real.
- **Pagamentos**: PIX manual, Mercado Pago (integração já existente) e redirecionamento para o Criador de Checkout.
- **Painel administrativo**: total de produtos, ativos/inativos, sem estoque, pedidos por status, faturamento, mais vendidos, catálogo mais acessado.

---

## Detalhes técnicos

- **Banco (Fase 1)**: `capture_pages` (slug, publicado, config JSONB de blocos/estilo, esquema de campos JSONB, contadores de visita) e `capture_leads` (page_id, dados JSONB, status, origem, UTM). RLS por `auth.uid()`, inserção pública liberada para o formulário, GRANTs explícitos para `anon`/`authenticated`/`service_role`.
- **Banco (Fase 2)**: reutiliza `portfolios`/`portfolio_items`; migração adiciona `kind`, `field_schema` e `theme` JSONB se ausentes.
- **Banco (Fase 3)**: ajustes pontuais em `catalogs` (horário, mensagem de fechado, meios de pagamento) e variações em `products`.
- **Padrões**: tokens semânticos do design system, sem cores fixas; upload via buckets existentes (`portfolio-images`, `blog-images`, novo bucket para capturas); arrastar e soltar com `@dnd-kit` (já no projeto); páginas públicas registradas no `App.tsx` acima do catch-all.
- **Integrações**: `contact_resource_links` para atribuição a cadastros; `funnel_leads` para funil; `checkouts` para pagamento do catálogo.

## Entrega

Começo pela Fase 1 completa nesta rodada. Ao aprovar, seguimos para a Fase 2 e depois a Fase 3.
