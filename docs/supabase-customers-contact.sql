alter table public.customers
  add column if not exists cpf varchar(18),
  add column if not exists address varchar(255),
  add column if not exists phone varchar(30);

create index if not exists idx_customers_cpf
  on public.customers (cpf);

create index if not exists idx_customers_phone
  on public.customers (phone);
