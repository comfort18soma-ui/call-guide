-- 管理者がコール表を物理削除できるようにする（call_sections は CASCADE で削除）
create policy "Anyone can delete call_charts"
  on public.call_charts for delete
  using (true);
