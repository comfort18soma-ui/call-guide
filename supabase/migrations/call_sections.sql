-- コール表の各行（場所＋内容）
create table if not exists public.call_sections (
  id uuid primary key default gen_random_uuid(),
  call_chart_id uuid not null references public.call_charts(id) on delete cascade,
  section_name text not null,
  content text not null,
  order_index integer not null default 0
);

create index if not exists call_sections_call_chart_id_idx on public.call_sections (call_chart_id);

comment on table public.call_sections is 'コール表の1行（場所＋MIX内容）';

alter table public.call_sections enable row level security;

create policy "Anyone can insert call_sections"
  on public.call_sections for insert with check (true);

create policy "Anyone can select call_sections"
  on public.call_sections for select using (true);
