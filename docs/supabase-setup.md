# Setup do Supabase

Este projeto ja esta preparado para usar `@supabase/ssr` com Next.js 16.

Arquivos criados no projeto:

- `lib/env.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/proxy.ts`
- `lib/supabase/database.types.ts`
- `proxy.ts`

## O que voce precisa fazer agora no painel do Supabase

### 1. Conferir as chaves do projeto

No painel do Supabase:

1. Abra `Project Settings > API`.
2. Copie:
   - `Project URL`
   - `Publishable key`
   - `service_role key` apenas para uso futuro no servidor

No arquivo `.env.local`, deixe assim:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

Observacao:

- O projeto aceita temporariamente `NEXT_PUBLIC_SUPABASE_ANON_KEY`, porque voce ja estava usando esse nome.
- O nome recomendado hoje e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### 2. Validar que as tabelas foram criadas

No `SQL Editor`, rode:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'products',
    'variant_metadata',
    'inventory_levels',
    'transactions',
    'transaction_items'
  )
order by table_name;
```

Se todas aparecerem, seguimos.

### 3. Rodar o SQL complementar de seguranca e performance

O seu SQL inicial criou as tabelas, mas ainda faltam:

- habilitar RLS
- criar policies
- criar indices auxiliares
- atualizar `last_updated` automaticamente no estoque

Rode este bloco no `SQL Editor`:

```sql
-- Extensao UUID, caso nao esteja ativa no projeto
create extension if not exists pgcrypto;

-- Indices uteis para busca e joins
create index if not exists idx_variant_metadata_product_id
  on public.variant_metadata (product_id);

create index if not exists idx_transaction_items_transaction_id
  on public.transaction_items (transaction_id);

create index if not exists idx_transaction_items_product_id
  on public.transaction_items (product_id);

create index if not exists idx_transactions_employee_id
  on public.transactions (employee_id);

create index if not exists idx_products_created_at
  on public.products (created_at desc);

-- Trigger para manter inventory_levels.last_updated correto em updates
create or replace function public.touch_inventory_last_updated()
returns trigger
language plpgsql
as $$
begin
  new.last_updated = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_touch_inventory_last_updated on public.inventory_levels;

create trigger trg_touch_inventory_last_updated
before update on public.inventory_levels
for each row
execute function public.touch_inventory_last_updated();

-- RLS: tabelas criadas pelo SQL Editor nao habilitam RLS automaticamente
alter table public.products enable row level security;
alter table public.variant_metadata enable row level security;
alter table public.inventory_levels enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;

-- Policies iniciais: qualquer usuario autenticado do sistema pode operar
-- Isso e um ponto de partida. Depois refinamos por perfil/cargo.

create policy "authenticated can read products"
on public.products
for select
to authenticated
using (true);

create policy "authenticated can insert products"
on public.products
for insert
to authenticated
with check (true);

create policy "authenticated can update products"
on public.products
for update
to authenticated
using (true)
with check (true);

create policy "authenticated can read variant metadata"
on public.variant_metadata
for select
to authenticated
using (true);

create policy "authenticated can insert variant metadata"
on public.variant_metadata
for insert
to authenticated
with check (true);

create policy "authenticated can update variant metadata"
on public.variant_metadata
for update
to authenticated
using (true)
with check (true);

create policy "authenticated can read inventory levels"
on public.inventory_levels
for select
to authenticated
using (true);

create policy "authenticated can insert inventory levels"
on public.inventory_levels
for insert
to authenticated
with check (true);

create policy "authenticated can update inventory levels"
on public.inventory_levels
for update
to authenticated
using (true)
with check (true);

create policy "authenticated can read transactions"
on public.transactions
for select
to authenticated
using (true);

create policy "authenticated can insert transactions"
on public.transactions
for insert
to authenticated
with check (true);

create policy "authenticated can read transaction items"
on public.transaction_items
for select
to authenticated
using (true);

create policy "authenticated can insert transaction items"
on public.transaction_items
for insert
to authenticated
with check (true);
```

### 4. Se voce ainda nao tiver login, decida como quer testar

Opcao recomendada:

- manter as policies em `authenticated`
- implementar login antes de consumir dados no browser

Opcao temporaria de demo:

- adicionar leitura publica apenas para catalogo
- remover depois que o login entrar

SQL opcional de demo:

```sql
create policy "anon can read products temporarily"
on public.products
for select
to anon
using (true);

create policy "anon can read inventory temporarily"
on public.inventory_levels
for select
to anon
using (true);

create policy "anon can read variant metadata temporarily"
on public.variant_metadata
for select
to anon
using (true);
```

### 5. Gerar tipos reais do banco

Hoje eu deixei um `database.types.ts` manual para o projeto ja compilar.
O ideal e substituir esse arquivo pelos tipos gerados do banco.

Pelo dashboard:

1. Abra `Project Settings > API`.
2. Procure a opcao de gerar ou baixar os tipos TypeScript.
3. Substitua `lib/supabase/database.types.ts`.

Ou pela CLI:

```bash
npx supabase login
npx supabase gen types typescript --project-id SEU_PROJECT_REF --schema public > lib/supabase/database.types.ts
```

### 6. Validar no painel

Depois do SQL, rode:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'products',
    'variant_metadata',
    'inventory_levels',
    'transactions',
    'transaction_items'
  )
order by tablename;
```

Todos devem aparecer com `rowsecurity = true`.

### 7. Proximo passo no codigo

Depois disso, o proximo marco no app e:

1. criar schemas Zod para produto, estoque e venda
2. criar Server Actions de cadastro e listagem
3. substituir a home template por um catalogo real

### 8. Instalar o checkout atomico no banco

Agora que o app ja tem carrinho e fechamento de venda, o recomendado e mover a baixa de estoque e a gravacao da transacao para uma funcao SQL unica.

No `SQL Editor`, crie uma nova query e rode o arquivo:

- `docs/supabase-checkout-rpc.sql`

Essa funcao:

- trava as linhas de estoque no Postgres durante o fechamento
- recalcula subtotal e total com os precos do banco
- insere `transactions` e `transaction_items`
- baixa o estoque dentro da mesma transacao do banco

Depois de rodar, valide com:

```sql
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'process_checkout';
```

Se aparecer `process_checkout`, o app ja passa a usar o fluxo atomico automaticamente.

### 9. Clientes e recibo

Para habilitar cliente opcional na venda e recibo com identificacao do comprador, rode no `SQL Editor`:

- `docs/supabase-customers-receipt.sql`

Esse arquivo:

- cria a tabela `customers`
- adiciona `customer_id` e `customer_name` em `transactions`
- atualiza a funcao `process_checkout` para salvar o cliente da venda

Depois valide com:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'customers';

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'transactions'
  and column_name in ('customer_id', 'customer_name')
order by column_name;
```

Se a tabela `customers` e as duas colunas aparecerem, a etapa de recibo e clientes ja esta pronta para uso.

## Referencias

- Supabase recomenda clientes separados para browser e server com `@supabase/ssr`: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase recomenda habilitar RLS manualmente em tabelas criadas por SQL: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase recomenda gerar tipos TypeScript a partir do schema: https://supabase.com/docs/guides/api/rest/generating-types
