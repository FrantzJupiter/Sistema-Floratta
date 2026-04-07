create or replace function public.process_checkout(
  p_cart_items jsonb,
  p_discount_amount numeric default 0,
  p_employee_id uuid default null
)
returns table (
  transaction_id uuid,
  subtotal_amount numeric,
  total_amount numeric
)
language plpgsql
set search_path = public
as $$
declare
  v_discount numeric(10, 2) := coalesce(p_discount_amount, 0);
  v_subtotal numeric(10, 2) := 0;
  v_total numeric(10, 2);
  v_transaction_id uuid;
  v_requested_items integer := 0;
  v_resolved_items integer := 0;
  v_item record;
begin
  if p_cart_items is null
    or jsonb_typeof(p_cart_items) <> 'array'
    or jsonb_array_length(p_cart_items) = 0 then
    raise exception 'O carrinho esta vazio.';
  end if;

  if v_discount < 0 then
    raise exception 'O desconto nao pode ser negativo.';
  end if;

  select count(*)
  into v_requested_items
  from (
    select item.product_id
    from jsonb_to_recordset(p_cart_items) as item(product_id uuid, quantity integer)
    group by item.product_id
  ) requested_items;

  if v_requested_items = 0 then
    raise exception 'O carrinho esta vazio.';
  end if;

  select count(*)
  into v_resolved_items
  from (
    with normalized_items as (
      select item.product_id, sum(item.quantity) as quantity
      from jsonb_to_recordset(p_cart_items) as item(product_id uuid, quantity integer)
      group by item.product_id
    )
    select normalized_items.product_id
    from normalized_items
    join public.products on products.id = normalized_items.product_id
    join public.inventory_levels on inventory_levels.product_id = normalized_items.product_id
  ) resolved_items;

  if v_resolved_items <> v_requested_items then
    raise exception 'Um dos produtos do carrinho nao foi encontrado.';
  end if;

  for v_item in
    with normalized_items as (
      select item.product_id, sum(item.quantity) as quantity
      from jsonb_to_recordset(p_cart_items) as item(product_id uuid, quantity integer)
      group by item.product_id
    )
    select
      products.id as product_id,
      products.name,
      products.base_price,
      normalized_items.quantity,
      inventory_levels.quantity as available_quantity
    from normalized_items
    join public.products on products.id = normalized_items.product_id
    join public.inventory_levels on inventory_levels.product_id = normalized_items.product_id
    order by products.name
    for update of inventory_levels
  loop
    if v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Quantidade invalida para %.', v_item.name;
    end if;

    if v_item.available_quantity < v_item.quantity then
      raise exception 'Estoque insuficiente para %. Disponivel: %.', v_item.name, v_item.available_quantity;
    end if;

    v_subtotal := v_subtotal + (v_item.base_price * v_item.quantity);
  end loop;

  if v_discount > v_subtotal then
    raise exception 'O desconto nao pode ser maior que o subtotal da venda.';
  end if;

  v_total := v_subtotal - v_discount;

  insert into public.transactions (employee_id, total_amount, discount)
  values (p_employee_id, v_total, v_discount)
  returning id into v_transaction_id;

  for v_item in
    with normalized_items as (
      select item.product_id, sum(item.quantity) as quantity
      from jsonb_to_recordset(p_cart_items) as item(product_id uuid, quantity integer)
      group by item.product_id
    )
    select
      products.id as product_id,
      products.base_price,
      normalized_items.quantity
    from normalized_items
    join public.products on products.id = normalized_items.product_id
  loop
    update public.inventory_levels
    set quantity = quantity - v_item.quantity
    where inventory_levels.product_id = v_item.product_id;

    insert into public.transaction_items (
      transaction_id,
      product_id,
      quantity,
      price_at_time
    )
    values (
      v_transaction_id,
      v_item.product_id,
      v_item.quantity,
      v_item.base_price
    );
  end loop;

  return query
  select
    v_transaction_id,
    round(v_subtotal, 2),
    round(v_total, 2);
end;
$$;

revoke all on function public.process_checkout(jsonb, numeric, uuid) from public;
grant execute on function public.process_checkout(jsonb, numeric, uuid) to authenticated;
grant execute on function public.process_checkout(jsonb, numeric, uuid) to service_role;
