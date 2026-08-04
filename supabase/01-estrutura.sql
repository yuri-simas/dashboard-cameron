-- ============================================================
--  Dashboard Cameron — estrutura do banco
--  Rode este arquivo PRIMEIRO, no SQL Editor do Supabase.
--  Pode rodar de novo sem medo: nada aqui apaga dado existente.
-- ============================================================

-- ------------------------------------------------------------
-- 1. QUEM PODE ENTRAR
--    Cada pessoa que loga ganha uma linha aqui, com o seu papel.
--    'diretoria'  = vê tudo e mexe em cadastro e meta
--    'lancamento' = lança e corrige venda; não mexe em cadastro
-- ------------------------------------------------------------
create table if not exists public.perfis (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,
  papel      text not null default 'lancamento'
             check (papel in ('diretoria','lancamento')),
  criado_em  timestamptz not null default now()
);
comment on table public.perfis is 'Pessoas com acesso ao app e o papel de cada uma.';

-- ------------------------------------------------------------
-- 2. UNIDADES
--    Substitui a "coluna da planilha". Com data de início e fim,
--    uma loja pode fechar e outra abrir sem sobrescrever histórico.
-- ------------------------------------------------------------
create table if not exists public.unidades (
  id        text primary key,
  nome      text not null,
  curto     text not null,
  tipo      text not null check (tipo in ('Loja','Quiosque','Feira')),
  bloco     text not null check (bloco in ('lojas','feiras')),
  grupo     text,
  ativa     boolean not null default true,
  abertura  date,
  fechamento date,
  ordem     int  not null default 0
);
comment on column public.unidades.bloco is 'Reproduz os dois subtotais da planilha: lojas e feiras.';
comment on column public.unidades.grupo is 'Agrupamento opcional, ex.: Aeroporto reúne Vivo, Doméstico e Q.Aeroporto.';

-- ------------------------------------------------------------
-- 3. LANÇAMENTOS — o coração do app
--    Uma linha por unidade e por dia. O par (unidade, data) é único,
--    então é impossível lançar o mesmo dia duas vezes.
--    Valor em CENTAVOS, para nunca depender de arredondamento.
-- ------------------------------------------------------------
create table if not exists public.lancamentos (
  id            bigint generated always as identity primary key,
  unidade_id    text not null references public.unidades(id),
  data          date not null,
  valor_centavos bigint not null check (valor_centavos >= 0),
  nao_abriu     boolean not null default false,
  observacao    text,
  criado_em     timestamptz not null default now(),
  criado_por    uuid references auth.users(id),
  alterado_em   timestamptz not null default now(),
  alterado_por  uuid references auth.users(id),
  unique (unidade_id, data)
);
create index if not exists lancamentos_data_idx     on public.lancamentos (data);
create index if not exists lancamentos_unidade_idx  on public.lancamentos (unidade_id, data);

-- ------------------------------------------------------------
-- 4. METAS
--    O valor de referência e o percentual ficam VISÍVEIS, em vez de
--    escondidos dentro da fórmula como estavam na planilha.
-- ------------------------------------------------------------
create table if not exists public.metas (
  unidade_id        text not null references public.unidades(id),
  ano               int  not null,
  mes               int  not null check (mes between 1 and 12),
  valor_centavos    bigint not null,
  referencia_centavos bigint,
  percentual        numeric(5,2) default 85.00,
  primary key (unidade_id, ano, mes)
);

-- ------------------------------------------------------------
-- 5. CALENDÁRIO
--    Feriados e datas comerciais. É o que permite comparar
--    Dia das Mães com Dia das Mães, e não 10 de maio com 11 de maio.
-- ------------------------------------------------------------
create table if not exists public.datas_especiais (
  data   date primary key,
  nome   text not null,
  curto  text,
  tipo   text not null default 'feriado' check (tipo in ('feriado','comercial','evento'))
);

-- ------------------------------------------------------------
-- 6. HISTÓRICO DE ALTERAÇÃO
--    Como não existe trava de prazo para corrigir, o controle é este:
--    toda mudança de valor fica registrada com autor e valor anterior.
-- ------------------------------------------------------------
create table if not exists public.lancamentos_historico (
  id             bigint generated always as identity primary key,
  lancamento_id  bigint,
  unidade_id     text not null,
  data           date not null,
  valor_antigo   bigint,
  valor_novo     bigint,
  acao           text not null check (acao in ('criou','alterou','apagou')),
  quem           uuid references auth.users(id),
  quando         timestamptz not null default now()
);
create index if not exists historico_lancamento_idx on public.lancamentos_historico (unidade_id, data);

create or replace function public.registrar_historico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    new.criado_por  := auth.uid();
    new.alterado_por := auth.uid();
    insert into public.lancamentos_historico (lancamento_id, unidade_id, data, valor_antigo, valor_novo, acao, quem)
    values (new.id, new.unidade_id, new.data, null, new.valor_centavos, 'criou', auth.uid());
    return new;

  elsif (tg_op = 'UPDATE') then
    new.alterado_em  := now();
    new.alterado_por := auth.uid();
    if (new.valor_centavos is distinct from old.valor_centavos
        or new.nao_abriu is distinct from old.nao_abriu) then
      insert into public.lancamentos_historico (lancamento_id, unidade_id, data, valor_antigo, valor_novo, acao, quem)
      values (new.id, new.unidade_id, new.data, old.valor_centavos, new.valor_centavos, 'alterou', auth.uid());
    end if;
    return new;

  else
    insert into public.lancamentos_historico (lancamento_id, unidade_id, data, valor_antigo, valor_novo, acao, quem)
    values (old.id, old.unidade_id, old.data, old.valor_centavos, null, 'apagou', auth.uid());
    return old;
  end if;
end;
$$;

drop trigger if exists trg_historico_insert on public.lancamentos;
create trigger trg_historico_insert
  before insert on public.lancamentos
  for each row execute function public.registrar_historico();

drop trigger if exists trg_historico_update on public.lancamentos;
create trigger trg_historico_update
  before update on public.lancamentos
  for each row execute function public.registrar_historico();

drop trigger if exists trg_historico_delete on public.lancamentos;
create trigger trg_historico_delete
  after delete on public.lancamentos
  for each row execute function public.registrar_historico();

-- ------------------------------------------------------------
-- 7. VISÃO PRONTA PARA O APP
--    Devolve o valor já em reais, para o front não fazer conta.
-- ------------------------------------------------------------
create or replace view public.v_lancamentos as
  select l.unidade_id,
         l.data,
         (l.valor_centavos / 100.0)::numeric(14,2) as valor,
         l.nao_abriu
  from public.lancamentos l;
