# Floratta

Sistema de varejo em `Next.js 16`, `Supabase` e `PWA`, com foco em:

- vendas e checkout
- catálogo e estoque
- clientes
- histórico de vendas
- recibo com impressão

## Stack

- `Next.js 16` com App Router
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `Supabase`
- `Serwist` para PWA
- `Zod`
- `Zustand`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Ambiente

Crie um `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Supabase

Os SQLs auxiliares ficam em [docs/supabase-setup.md](./docs/supabase-setup.md) e nos arquivos:

- [docs/supabase-checkout-rpc.sql](./docs/supabase-checkout-rpc.sql)
- [docs/supabase-customers-receipt.sql](./docs/supabase-customers-receipt.sql)
- [docs/supabase-customers-contact.sql](./docs/supabase-customers-contact.sql)
- [docs/supabase-inventory-movements.sql](./docs/supabase-inventory-movements.sql)

## Observações

- O PWA com Serwist fica desativado em desenvolvimento e ativo no build de produção.
- `public/sw.js` é artefato gerado e não deve ser tratado como fonte de verdade.
