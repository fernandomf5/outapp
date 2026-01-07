-- Add page_builder to all plans that already include page_cloner (keeps behavior consistent)
insert into public.plan_features (plan_id, feature_id)
select distinct pf.plan_id, f_builder.id
from public.plan_features pf
join public.features f_cloner on f_cloner.id = pf.feature_id and f_cloner.key = 'page_cloner'
join public.features f_builder on f_builder.key = 'page_builder'
left join public.plan_features pf_existing
  on pf_existing.plan_id = pf.plan_id
 and pf_existing.feature_id = f_builder.id
where pf_existing.plan_id is null;