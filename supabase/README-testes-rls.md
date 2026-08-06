# Como conferir o isolamento no banco, sem subir o Supabase inteiro

As políticas de RLS são o que impede um escritório de ver o conteúdo de outro.
Elas foram validadas contra um Postgres 16 local, e dois bugs apareceram nessa
validação — vale repetir o teste sempre que uma policy for mexida.

```bash
# 1. sobe um Postgres qualquer (ou use `supabase start`)
initdb -D /tmp/pg -U postgres --auth=trust
pg_ctl -D /tmp/pg -o "-p 55432 -k /tmp" start

# 2. cria os papéis e o schema storage que o Supabase já traz de fábrica
psql -h /tmp -p 55432 -U postgres -c "
  create role anon nologin; create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema storage;
  create table storage.buckets(id text primary key, name text, public boolean default false);
  create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema public, storage to anon, authenticated, service_role;
  grant all on storage.objects, storage.buckets to authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;"

# 3. aplica as migrations e o seed
psql -h /tmp -p 55432 -U postgres -v ON_ERROR_STOP=1 \
  -f migrations/0001_schema.sql -f migrations/0002_rls.sql \
  -f migrations/0003_permissoes.sql -f seed.sql

# 4. roda os testes
psql -h /tmp -p 55432 -U postgres -f testes_rls_leitura.sql
psql -h /tmp -p 55432 -U postgres -f testes_rls_escrita.sql
```

## O que cada teste prova

**Leitura** — o cliente A não lista, nem alcança pelo id exato, nenhuma peça,
bloco, entregável ou cadastro do cliente B; e não vê o próprio ciclo enquanto
ele estiver em rascunho.

**Escrita** — A não comenta em peça de B; não comenta assinando outro nome; não
reescreve o conteúdo da própria peça; consegue aprovar a própria peça; e não lê
o hash de senha.

## Os dois bugs que este teste pegou

**1. Recursão infinita nas políticas.** `peca_visivel_ao_cliente()` consulta
`peca`, e era usada dentro da política de select da própria `peca` — a consulta
interna disparava a política de novo, sem fim, e o Postgres derrubava tudo com
*stack depth limit exceeded*. Resolvido tornando a função `security definer`
com `search_path` fixo.

**2. Hash de senha legível.** `revoke select (senha_hash)` não faz nada enquanto
o papel tiver `select` na tabela inteira — e o Supabase concede isso a
`authenticated` por padrão. Foi preciso revogar o select da tabela e devolver as
colunas permitidas uma a uma.

Nenhum dos dois aparece lendo o SQL. Só rodando.
