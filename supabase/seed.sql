-- =====================================================================
-- Seed — os três escritórios, seus canais, editorias e pilares.
--
-- NENHUMA SENHA AQUI. Os clientes nascem sem senha e inativos; quem define
-- é o admin, pela tela de cliente. Enquanto senha_hash for nula, a rota
-- /c/:slug responde que o acesso ainda não foi liberado.
-- A senha do administrador vem de ADMIN_SENHA_INICIAL e é gravada pelo
-- script `npm run criar-admin`, nunca por este arquivo.
-- =====================================================================

-- ---------------------------------------------------------------- canais
insert into canal (codigo, nome, limite_caracteres_padrao, ordem) values
  ('redes_sociais', 'Redes Sociais', null, 1),
  ('blog',          'Blog',          null, 2),
  ('newsletter',    'Newsletter',    null, 3),
  ('video',         'Vídeo',         null, 4)
on conflict (codigo) do nothing;
-- Limites em branco de propósito: a equipe preenche no admin. Chutar número
-- aqui viraria regra silenciosa que ninguém revisa.

-- -------------------------------------------------------------- clientes
insert into cliente (nome, slug, ativo, tom_de_voz, areas_chave, regra_base_ref) values
  ('Freire, Gerbasi e Bittencourt', 'fgb', false, null, null, null),
  ('Fiedra, Britto e Ferreira Neto', 'fiedra', false,
   'Executivo e orientado à decisão; técnico sem tecnicismo excessivo; claro, preciso e estruturado; sóbrio e elegante; acolhedor, sem alarmismo; focado em riscos, caminhos e consequências.',
   'Varejo alimentar e cadeia de consumo; incorporação imobiliária com operação na Bahia; operações de capital sofisticado como ponto focal Nordeste.',
   'Fiedra_FGX_Sintese_e_Pacote_Completo.docx'),
  ('Reis, Souza, Takeishi e Arsuffi', 'rsta', false, null, null, null)
on conflict (slug) do nothing;

-- ----------------------------------------------------- canais por cliente
insert into cliente_canal (cliente_id, canal_codigo)
select c.id, x.canal
from cliente c
join (values
  ('fgb','redes_sociais'), ('fgb','blog'), ('fgb','newsletter'), ('fgb','video'),
  ('fiedra','redes_sociais'), ('fiedra','blog'), ('fiedra','newsletter'),
  ('rsta','redes_sociais'), ('rsta','blog'), ('rsta','newsletter'), ('rsta','video')
) as x(slug, canal) on x.slug = c.slug
on conflict do nothing;
-- Fiedra sem vídeo: o Plano 2026 do escritório registra "sem vídeo no escopo 2026".

-- ------------------------------------------------- editorias e pilares
-- As da Fiedra vêm do Plano 2026. FGB e RSTA ficam vazios até a equipe
-- cadastrar as listas de cada escritório — inventar aqui seria pior que vazio.
insert into editoria (cliente_id, nome, ordem)
select c.id, x.nome, x.ordem from cliente c
join (values
  ('Fiedra em Destaque',1), ('Atuação Estratégica',2), ('Institucional',3),
  ('Cenários do Varejo',4), ('Frente Imobiliária',5), ('Negócios',6)
) as x(nome, ordem) on true
where c.slug = 'fiedra'
on conflict do nothing;

insert into pilar (cliente_id, nome, ordem)
select c.id, x.nome, x.ordem from cliente c
join (values
  ('Profundidade no Varejo Alimentar e Cadeia de Consumo',1),
  ('Conexão Acadêmico-Empresarial em Imobiliário e Negócios',2),
  ('Ponto Focal Nordeste para Operações de Capital Sofisticado',3)
) as x(nome, ordem) on true
where c.slug = 'fiedra'
on conflict do nothing;
