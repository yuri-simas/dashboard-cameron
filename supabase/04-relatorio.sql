-- ============================================================
--  Dashboard Cameron — relatório da importação
--  Rode DEPOIS do 02-acesso.sql.
--
--  Guarda o de/para dos nomes, a conferência mês a mês e a lista do
--  que foi corrigido ao importar as planilhas. Fica no banco, e não
--  num arquivo do site, porque a conferência contém os totais de cada
--  mês — ou seja, é faturamento.
-- ============================================================

create table if not exists public.relatorio_importacao (
  id        int primary key default 1 check (id = 1),   -- linha única
  conteudo  jsonb not null,
  criado_em timestamptz not null default now()
);
comment on table public.relatorio_importacao is
  'De/para dos nomes, conferência por mês e avisos da importação das planilhas de 2024-2026.';

alter table public.relatorio_importacao enable row level security;

-- quem tem acesso lê; só a diretoria mexe
drop policy if exists relatorio_leitura on public.relatorio_importacao;
create policy relatorio_leitura on public.relatorio_importacao
  for select to authenticated using (public.tem_acesso());

drop policy if exists relatorio_escrita on public.relatorio_importacao;
create policy relatorio_escrita on public.relatorio_importacao
  for all to authenticated using (public.eh_diretoria()) with check (public.eh_diretoria());

-- O conteúdo em si vem no arquivo 05-relatorio-dados.sql, que é gerado
-- a partir das planilhas e pode ser rodado de novo sem duplicar nada.
