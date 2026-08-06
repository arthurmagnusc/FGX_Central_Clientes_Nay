\set ON_ERROR_STOP off
\pset pager off
select id as id_a from cliente where slug='fiedra' \gset
select id as id_b from cliente where slug='rsta' \gset
select p.id as peca_b from peca p join ciclo c on c.id=p.ciclo_id where c.cliente_id=:'id_b' limit 1 \gset
select p.id as peca_a from peca p join ciclo c on c.id=p.ciclo_id where c.cliente_id=:'id_a' and c.status='publicado' limit 1 \gset

begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('cliente_id', :'id_a','pessoa_nome','Lara Britto','is_admin',false)::text, true);

\echo '=== 7. A comenta na peça de B (esperado: ERRO de policy) ==='
savepoint s1;
insert into comentario (peca_id, autor_nome, autor_tipo, texto) values (:'peca_b','Lara Britto','cliente','invasao');
rollback to s1;

\echo '=== 8. A comenta assinando outro nome (esperado: ERRO) ==='
savepoint s2;
insert into comentario (peca_id, autor_nome, autor_tipo, texto) values (:'peca_a','Outra Pessoa','cliente','falsificado');
rollback to s2;

\echo '=== 9. A comenta na propria peca com o nome da sessao (esperado: OK) ==='
insert into comentario (peca_id, autor_nome, autor_tipo, texto) values (:'peca_a','Lara Britto','cliente','legitimo');
select count(*) as visiveis from comentario;

\echo '=== 10. A tenta reescrever o conteudo (esperado: 0 linhas afetadas) ==='
update peca_bloco set conteudo='reescrito' where peca_id=:'peca_a';
select conteudo from peca_bloco where peca_id=:'peca_a';

\echo '=== 11. A aprova a propria peca (esperado: aprovada) ==='
update peca set status='aprovada' where id=:'peca_a';
select status from peca where id=:'peca_a';

\echo '=== 12. A tenta mudar o tema da propria peca (esperado: bloqueado pelo with check) ==='
savepoint s4;
update peca set status='pendente' where id=:'peca_a';
rollback to s4;

\echo '=== 13. A tenta ler o hash de senha (esperado: ERRO de permissao) ==='
savepoint s3;
select senha_hash from cliente;
rollback to s3;
commit;

\echo '=== 14. Admin enxerga tudo ==='
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('is_admin',true)::text, true);
select count(*) as pecas_admin from peca;
select count(*) as clientes_admin from cliente;
commit;
