-- ============================================================
--  Dashboard Cameron — regras de acesso
--  Rode este arquivo DEPOIS do 01-estrutura.sql.
--
--  A ideia em uma frase: sem estar logado E ter uma linha na tabela
--  "perfis", a pessoa não enxerga UMA linha sequer de faturamento.
--  Isso vale mesmo que ela tente falar direto com o banco, sem passar
--  pela tela — que é exatamente o furo que o site estático tinha.
-- ============================================================

-- Liga a tranca em todas as tabelas.
-- Sem política nenhuma, "ligado" já significa "ninguém acessa".
alter table public.perfis                enable row level security;
alter table public.unidades              enable row level security;
alter table public.lancamentos           enable row level security;
alter table public.metas                 enable row level security;
alter table public.datas_especiais       enable row level security;
alter table public.lancamentos_historico enable row level security;

-- ------------------------------------------------------------
-- Funções de apoio.
-- security definer para poderem ler "perfis" sem cair na própria
-- política e entrar em recursão.
-- ------------------------------------------------------------
create or replace function public.tem_acesso()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.perfis where id = auth.uid()) $$;

create or replace function public.eh_diretoria()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.perfis where id = auth.uid() and papel = 'diretoria') $$;

-- ------------------------------------------------------------
-- PERFIS: cada um lê o próprio; a diretoria lê e administra todos.
-- ------------------------------------------------------------
drop policy if exists perfis_le_o_proprio on public.perfis;
create policy perfis_le_o_proprio on public.perfis
  for select to authenticated using (id = auth.uid() or public.eh_diretoria());

drop policy if exists perfis_diretoria_administra on public.perfis;
create policy perfis_diretoria_administra on public.perfis
  for all to authenticated using (public.eh_diretoria()) with check (public.eh_diretoria());

-- ------------------------------------------------------------
-- CADASTROS (unidades, metas, calendário):
-- quem tem acesso lê; só a diretoria altera.
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['unidades','metas','datas_especiais'] loop
    execute format('drop policy if exists %I on public.%I', t || '_leitura', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.tem_acesso())',
      t || '_leitura', t);

    execute format('drop policy if exists %I on public.%I', t || '_escrita', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.eh_diretoria()) with check (public.eh_diretoria())',
      t || '_escrita', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- LANÇAMENTOS: quem tem acesso lê e lança.
-- Não existe trava de prazo — foi decisão do cliente — então quem
-- controla é o histórico, que grava autor e valor anterior.
-- Apagar é só da diretoria: some da tela, mas fica no histórico.
-- ------------------------------------------------------------
drop policy if exists lancamentos_leitura on public.lancamentos;
create policy lancamentos_leitura on public.lancamentos
  for select to authenticated using (public.tem_acesso());

drop policy if exists lancamentos_insere on public.lancamentos;
create policy lancamentos_insere on public.lancamentos
  for insert to authenticated with check (public.tem_acesso());

drop policy if exists lancamentos_altera on public.lancamentos;
create policy lancamentos_altera on public.lancamentos
  for update to authenticated using (public.tem_acesso()) with check (public.tem_acesso());

drop policy if exists lancamentos_apaga on public.lancamentos;
create policy lancamentos_apaga on public.lancamentos
  for delete to authenticated using (public.eh_diretoria());

-- ------------------------------------------------------------
-- HISTÓRICO: só de leitura, e só para a diretoria.
-- Ninguém escreve aqui pela mão — quem escreve é o gatilho.
-- ------------------------------------------------------------
drop policy if exists historico_leitura on public.lancamentos_historico;
create policy historico_leitura on public.lancamentos_historico
  for select to authenticated using (public.eh_diretoria());

-- ------------------------------------------------------------
-- A view herda a tranca da tabela de baixo.
-- ------------------------------------------------------------
alter view public.v_lancamentos set (security_invoker = on);

-- ------------------------------------------------------------
-- CONFERÊNCIA: rode isto depois e todas as linhas devem dizer "true".
-- ------------------------------------------------------------
-- select tablename, rowsecurity as tranca_ligada
--   from pg_tables where schemaname = 'public' order by tablename;
