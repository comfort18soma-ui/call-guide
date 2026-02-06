-- 管理者が承認時に status を更新できるようにする
create policy "Anyone can update call_requests"
  on public.call_requests for update
  using (true)
  with check (true);
