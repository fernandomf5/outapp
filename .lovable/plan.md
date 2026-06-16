## Objetivo

Permitir atrelar qualquer recurso criado na plataforma (tabelas, tarefas, notas, mapas, funis, briefings, etc.) a um cliente específico do Cadastro. Ao abrir "Ver Detalhes" do cliente, uma nova aba **Atividades** mostra cronologicamente tudo que foi criado/atribuído a ele.

## Modelo de dados

Para evitar adicionar coluna `customer_id` em ~20 tabelas e ter que migrar dado a dado, criamos UMA tabela central de vínculos polimórfica:

```sql
CREATE TABLE public.customer_resource_links (
  id uuid PK,
  user_id uuid NOT NULL,          -- dono (RLS)
  customer_id uuid NOT NULL,       -- ref customers.id (FK + ON DELETE CASCADE)
  resource_type text NOT NULL,     -- 'organization_table' | 'task' | 'quick_note' | 'mind_map' | 'funnel' | 'briefing' | 'invoice' | 'proposal' | 'receipt' | 'qr_code' | 'short_link' | 'cloned_page' | 'catalog' | 'checkout' | 'popup' | 'floating_button' | 'link_bio' | 'agenda_event' | 'service_order' | 'contract'
  resource_id uuid NOT NULL,
  resource_title text,             -- snapshot do título p/ exibir mesmo se renomeado
  resource_url text,               -- rota interna p/ "abrir"
  created_at timestamptz
);
-- UNIQUE (customer_id, resource_type, resource_id)
-- INDEX (customer_id, created_at desc)
```

Vantagens: zero alteração nas tabelas existentes, novos módulos só registram um link.

## Componentes reutilizáveis (frontend)

1. **`<CustomerPicker>`** — Select agrupado por categoria (`customer_categories` + `customers`) idêntico ao usado no diálogo de anúncios. Reusável em todo módulo. Props: `value`, `onChange`, `allowClear`.
2. **`useCustomerLink(resourceType, resourceId)`** — hook que: (a) carrega vínculo atual, (b) `setCustomer(customerId)` faz upsert/delete em `customer_resource_links`.
3. **`<LinkCustomerButton resourceType resourceId resourceTitle resourceUrl />`** — botão "Atrelar a cliente" pronto p/ dropar em qualquer painel.

## Integração nos módulos (fase 1)

Adicionar `<LinkCustomerButton>` (ou campo no formulário) em:

- Tabelas de Organização (`OrganizationTablePanel` / `FullOrganizationTable`)
- Tarefas (`TaskDialog`)
- Notas Rápidas (`QuickNotesPanel`)
- Mapas Mentais (`MindMapCreatorPanel`)
- Funis (`SalesFunnelPanel`)
- Briefings, Propostas, Invoices, Recibos, QR Codes, Links Curtos, Páginas Clonadas, Catálogos, Checkouts, Popups, Botões Flutuantes, Link Bio, Agenda, OS, Contratos

Fase 1 entrega o componente + integração em **Tabelas, Tarefas, Notas, Mapas, Funis, Briefings**. Restante segue padrão e entramos por demanda.

## Aba "Atividades" no Ver Detalhes do cliente

Novo arquivo `src/components/customer/CustomerActivitiesTab.tsx`:
- Consulta `customer_resource_links` por `customer_id` ordenado `created_at desc`
- Filtro por tipo (chips) e busca
- Cada item: ícone por tipo + título + data + botão "Abrir" (usa `resource_url`)

Adicionado como nova aba em `CustomerHistoryPanel.tsx` (entre as existentes).

## Detalhes técnicos

- Migration cria tabela + GRANTs (`authenticated`, `service_role`) + RLS (`auth.uid() = user_id`) + índices.
- `resource_url` é montado no momento do link (ex: `/dashboard?tab=tables&id=...`) para evitar lookup futuro.
- Ao deletar o recurso original: não há trigger cross-table; o item simplesmente aparece como "indisponível" se o "Abrir" falhar (tratado no front). Podemos adicionar cleanup posterior.
- `resource_type` validado por enum no front (constante `RESOURCE_TYPES`).

## Entregáveis desta etapa

1. Migration `customer_resource_links` (tabela + RLS + grants).
2. `CustomerPicker`, `useCustomerLink`, `LinkCustomerButton`.
3. Integração em 6 módulos iniciais (Tabelas, Tarefas, Notas, Mapas, Funis, Briefings).
4. Aba **Atividades** no histórico do cliente.

Próximas fases (depois de aprovado): replicar `LinkCustomerButton` nos demais módulos listados.