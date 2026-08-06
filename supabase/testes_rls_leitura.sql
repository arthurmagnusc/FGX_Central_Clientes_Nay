\set ON_ERROR_STOP on
\pset pager off

-- ---- dados: A = fiedra, B = rsta -------------------------------------
insert into cliente_canal (cliente_id, canal_codigo)
select id,'blog' from cliente where slug in ('fiedra','rsta') on conflict do nothing;

with a as (select id from cliente where slug='fiedra'), b as (select id from cliente where slug='rsta')
insert into ciclo (cliente_id, mes_referencia, status, publicado_em)
select (select id from a),'2098-01','publicado'::status_ciclo,now()
union all select (select id from a),'2098-02','rascunho'::status_ciclo,null
union all select (select id from b),'2098-01','publicado'::status_ciclo,now();

insert into peca (ciclo_id, tema, canal_codigo, formato)
select c.id, 'Peça de '||cl.slug||' — '||c.mes_referencia||' ('||c.status||')', 'blog','artigo'::formato_peca
from ciclo c join cliente cl on cl.id=c.cliente_id;

insert into peca_bloco (peca_id, ordem, conteudo)
select p.id, 1, 'conteúdo de '||p.tema from peca p;

insert into entregavel (cliente_id, categoria, titulo, storage_path, nome_arquivo, publicado_em)
select id,'diagnostico'::categoria_entregavel,'Diagnóstico de '||slug, slug||'/d.pdf','d.pdf', now() from cliente where slug in ('fiedra','rsta');

\gset
select id as id_a from cliente where slug='fiedra' \gset
select id as id_b from cliente where slug='rsta' \gset
select p.id as peca_b from peca p join ciclo c on c.id=p.ciclo_id where c.cliente_id=:'id_b' limit 1 \gset
select p.id as peca_a from peca p join ciclo c on c.id=p.ciclo_id
  where c.cliente_id=:'id_a' and c.status='publicado' limit 1 \gset
select p.id as peca_a_rascunho from peca p join ciclo c on c.id=p.ciclo_id
  where c.cliente_id=:'id_a' and c.status='rascunho' limit 1 \gset

-- ---- vira o cliente A -------------------------------------------------
set role authenticated;
select set_config('request.jwt.claims',
  json_build_object('cliente_id', :'id_a', 'pessoa_nome','Lara Britto','is_admin',false)::text, false);

\echo '=== 1. A lista peças: só as do ciclo publicado dele ==='
select tema from peca order by tema;

\echo '=== 2. A pede a peça de B pelo id exato (esperado: 0 linhas) ==='
select count(*) as linhas from peca where id = :'peca_b';

\echo '=== 3. A pede os blocos de B (esperado: 0) ==='
select count(*) as linhas from peca_bloco where peca_id = :'peca_b';

\echo '=== 4. A pede o ciclo em rascunho dele (esperado: 0 — rascunho é invisível) ==='
select count(*) as linhas from peca where id = :'peca_a_rascunho';

\echo '=== 5. A lê entregáveis (esperado: só o dele) ==='
select titulo from entregavel;

\echo '=== 6. A lê cadastros de cliente (esperado: 1, o dele) ==='
select nome from meu_cliente;

\echo '=== 7. A comenta na peça de B (esperado: ERRO) ==='
savepoint s1;
insert into comentario (peca_id, autor_nome, autor_tipo, texto)
values (:'peca_b','Lara Britto','cliente'::tipo_autor,'invasão');
rollback to s1;

\echo '=== 8. A comenta assinando outro nome (esperado: ERRO) ==='
savepoint s2;
insert into comentario (peca_id, autor_nome, autor_tipo, texto)
values (:'peca_a','Outra Pessoa','cliente'::tipo_autor,'falsificado');
rollback to s2;

\echo '=== 9. A comenta na própria peça com o nome da sessão (esperado: OK) ==='
insert into comentario (peca_id, autor_nome, autor_tipo, texto)
values (:'peca_a','Lara Britto','cliente'::tipo_autor,'comentário legítimo');
select count(*) as comentarios_visiveis from comentario;

\echo '=== 10. A tenta reescrever o conteúdo da própria peça (esperado: 0 linhas afetadas) ==='
update peca_bloco set conteudo='reescrito pelo cliente' where peca_id = :'peca_a';
select conteudo from peca_bloco where peca_id = :'peca_a';

\echo '=== 11. A aprova a própria peça (esperado: OK) ==='
update peca set status='aprovada' where id = :'peca_a';
select status from peca where id = :'peca_a';

\echo '=== 12. A tenta ler o hash de senha (esperado: ERRO de permissão) ==='
savepoint s3;
select senha_hash from cliente;
rollback to s3;

reset role;
\echo '=== 13. Admin enxerga tudo ==='
select set_config('request.jwt.claims', json_build_object('is_admin',true)::text, false);
set role authenticated;
select count(*) as pecas_para_admin from peca;
reset role;
