import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { areaId, blockId } = await req.json();
    if (!areaId || !blockId) return json({ error: 'missing_params' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: area } = await supabase
      .from('simple_members_areas')
      .select('id, user_id, sections, is_active')
      .eq('id', areaId)
      .maybeSingle();

    if (!area || area.is_active === false) return json({ error: 'area_not_found' }, 404);

    // Locate the block inside the area sections (source of truth for authorization)
    let block: any = null;
    for (const section of (area.sections as any[]) || []) {
      const found = (section?.blocks || []).find((b: any) => b?.id === blockId);
      if (found) { block = found; break; }
    }
    if (!block) return json({ error: 'block_not_found' }, 404);

    const source: string = block.type;
    const customerId: string | null = block.customer_id || null;
    if (!customerId) return json({ error: 'customer_not_set' }, 400);

    // Cadastros ("Gestão Livre") live in the contacts table; fall back to legacy customers
    let customer: any = null;
    let categoryName: string | null = null;

    const { data: contactRow } = await supabase
      .from('contacts')
      .select('*, registration_categories(name)')
      .eq('id', customerId)
      .eq('user_id', area.user_id)
      .maybeSingle();

    if (contactRow) {
      customer = contactRow;
      categoryName = (contactRow as any).registration_categories?.name ?? null;
    } else {
      const { data: legacy } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('user_id', area.user_id)
        .maybeSingle();
      customer = legacy;
    }

    if (!customer) return json({ error: 'customer_not_found' }, 404);


    // Resources attributed to this contact
    const { data: links } = await supabase
      .from('contact_resource_links')
      .select('resource_type, resource_id')
      .eq('contact_id', customerId)
      .eq('user_id', area.user_id);

    const idsFor = (type: string) =>
      (links || []).filter((l) => l.resource_type === type).map((l) => l.resource_id).filter(Boolean);

    let payload: any = {};

    switch (source) {
      case 'client_profile': {
        payload = {
          customer: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            company: customer.company,
            position: customer.position,
            document: customer.document,
            status: customer.status,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            country: customer.country,
            postal_code: customer.postal_code,
            website: customer.website,
            contact_person: customer.contact_person,
            market_area: customer.market_area,
            category: categoryName,
            custom_fields: customer.custom_fields || null,
            notes: customer.notes,
            tags: customer.tags,
            created_at: customer.created_at,
          },
        };
        break;
      }

      case 'timeline':
      case 'customer_history': {
        const { data: history } = await supabase
          .from('contact_history')
          .select('id, service_type, title, description, start_date, end_date, status, attachments, created_at')
          .eq('user_id', area.user_id)
          .eq('contact_id', customerId)
          .order('start_date', { ascending: false, nullsFirst: false })
          .limit(300);
        payload = { history: history || [] };
        break;
      }

      case 'payment_history': {
        const { data: payments } = await supabase
          .from('customer_payments_history')
          .select('id, amount, payment_method, payment_date, description, notes, reference_type, created_at')
          .eq('user_id', area.user_id)
          .eq('contact_id', customerId)
          .order('payment_date', { ascending: false, nullsFirst: false })
          .limit(300);
        payload = { payments: payments || [] };
        break;
      }


      case 'client_tasks': {
        const ids = idsFor('task');
        const filters = [`client_id.eq.${customerId}`];
        if (ids.length) filters.push(`id.in.(${ids.join(',')})`);
        const { data } = await supabase
          .from('tasks')
          .select('id, title, description, status, priority, due_date, category, checklist, created_at')
          .eq('user_id', area.user_id)
          .or(filters.join(','))
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(200);
        payload = { tasks: data || [] };
        break;
      }

      case 'client_routines': {
        const ids = idsFor('routine');
        if (!ids.length) { payload = { routines: [] }; break; }
        const { data: routines } = await supabase
          .from('routines')
          .select('id, name, is_active')
          .eq('user_id', area.user_id)
          .in('id', ids);
        const { data: items } = await supabase
          .from('routine_items')
          .select('id, routine_id, title, description, day_of_week, start_time, end_time, color, is_completed, order_index')
          .in('routine_id', ids)
          .order('order_index', { ascending: true });
        payload = {
          routines: (routines || []).map((r) => ({
            ...r,
            items: (items || []).filter((i) => i.routine_id === r.id),
          })),
        };
        break;
      }

      case 'client_agenda': {
        const ids = idsFor('agenda_event');
        if (!ids.length) { payload = { events: [] }; break; }
        const { data } = await supabase
          .from('agenda_events')
          .select('id, title, description, start_date, end_date, all_day, color')
          .eq('user_id', area.user_id)
          .in('id', ids)
          .order('start_date', { ascending: true });
        payload = { events: data || [] };
        break;
      }

      case 'client_table': {
        const ids = idsFor('organization_table');
        if (!ids.length) { payload = { tables: [] }; break; }
        const { data: tables } = await supabase
          .from('organization_tables')
          .select('id, name, description, color')
          .eq('user_id', area.user_id)
          .in('id', ids);
        const { data: columns } = await supabase
          .from('organization_table_columns')
          .select('id, table_id, name, type, order_index')
          .in('table_id', ids)
          .order('order_index', { ascending: true });
        const { data: rows } = await supabase
          .from('organization_table_rows')
          .select('id, table_id, order_index')
          .in('table_id', ids)
          .order('order_index', { ascending: true });
        const rowIds = (rows || []).map((r) => r.id);
        let cells: any[] = [];
        if (rowIds.length) {
          const { data: cellData } = await supabase
            .from('organization_table_cells')
            .select('row_id, column_id, value')
            .in('row_id', rowIds);
          cells = cellData || [];
        }
        payload = {
          tables: (tables || []).map((t) => ({
            ...t,
            columns: (columns || []).filter((c) => c.table_id === t.id),
            rows: (rows || [])
              .filter((r) => r.table_id === t.id)
              .map((r) => ({ id: r.id, cells: cells.filter((c) => c.row_id === r.id) })),
          })),
        };
        break;
      }

      case 'client_financial': {
        const ids = idsFor('financial_business');
        if (!ids.length) { payload = { businesses: [] }; break; }
        const { data: businesses } = await supabase
          .from('financial_businesses')
          .select('id, name, business_type, description')
          .eq('user_id', area.user_id)
          .in('id', ids);
        const { data: transactions } = await supabase
          .from('financial_transactions')
          .select('id, business_id, type, category, description, amount, date, status, payment_method')
          .eq('user_id', area.user_id)
          .in('business_id', ids)
          .order('date', { ascending: false })
          .limit(500);
        payload = {
          businesses: (businesses || []).map((b) => ({
            ...b,
            transactions: (transactions || []).filter((t) => t.business_id === b.id),
          })),
        };
        break;
      }

      case 'client_receipts': {
        const ids = idsFor('receipt');
        const { data: byName } = await supabase
          .from('saved_receipts')
          .select('id, receipt_number, receipt_data, total_amount, client_name, created_at')
          .eq('user_id', area.user_id)
          .eq('client_name', customer.name)
          .order('created_at', { ascending: false });
        let byLink: any[] = [];
        if (ids.length) {
          const { data } = await supabase
            .from('saved_receipts')
            .select('id, receipt_number, receipt_data, total_amount, client_name, created_at')
            .eq('user_id', area.user_id)
            .in('id', ids);
          byLink = data || [];
        }
        const map = new Map<string, any>();
        [...(byName || []), ...byLink].forEach((r) => map.set(r.id, r));
        payload = {
          receipts: Array.from(map.values()).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
        };
        break;
      }

      case 'client_mindmap':
      case 'mindmap': {
        const ids = idsFor('mind_map');
        if (!ids.length) { payload = { mindMaps: [] }; break; }
        const { data } = await supabase
          .from('mind_maps')
          .select('id, name, description, nodes, edges, updated_at')
          .eq('user_id', area.user_id)
          .in('id', ids);
        payload = { mindMaps: data || [] };
        break;
      }

      default:
        return json({ error: 'unsupported_source' }, 400);
    }

    return json({ source, customerName: customer.name, ...payload });
  } catch (e) {
    console.error('members-client-data error', e);
    return json({ error: 'internal_error' }, 500);
  }
});
