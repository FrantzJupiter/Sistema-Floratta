create table if not exists public.inventory_movements (
  id uuid default gen_random_uuid() primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  movement_type varchar(30) not null,
  quantity_delta integer not null check (quantity_delta <> 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_inventory_movements_product_id
  on public.inventory_movements (product_id);

create index if not exists idx_inventory_movements_created_at
  on public.inventory_movements (created_at desc);

create index if not exists idx_inventory_movements_transaction_id
  on public.inventory_movements (transaction_id);

alter table public.inventory_movements enable row level security;

drop policy if exists "authenticated can read inventory movements" on public.inventory_movements;
drop policy if exists "authenticated can insert inventory movements" on public.inventory_movements;

create policy "authenticated can read inventory movements"
on public.inventory_movements
for select
to authenticated
using (true);

create policy "authenticated can insert inventory movements"
on public.inventory_movements
for insert
to authenticated
with check (true);
