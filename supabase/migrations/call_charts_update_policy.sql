-- 管理者が承認・却下時に status を更新できるようにする
create policy "Anyone can update call_charts"
  on public.call_charts for update
  using (true)
  with check (true);
