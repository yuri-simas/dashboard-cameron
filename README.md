# Dashboard Cameron — protótipo

Protótipo navegável do app de fechamento diário da rede de livrarias Cameron.
A definição do projeto está em [DEFINICAO.md](DEFINICAO.md).

> **É uma maquete.** Dá para navegar, filtrar e digitar, mas ainda não salva de
> verdade: o que você digitar fica só no seu navegador e some ao recarregar a
> página. Não tem banco de dados nem login ainda.

**🔗 No ar:** https://yuri-simas.github.io/dashboard-cameron/

> A página tem **faturamento real da rede**. Está fora de buscadores
> (`noindex` + `robots.txt`), mas **quem tiver o endereço abre**. Passe o link só
> para quem já tem acesso a esses números.

## Como abrir localmente

**Jeito rápido:** dê dois cliques em `index.html`.

**Jeito recomendado:**

```bash
npx --yes serve dashboard-cameron -l 4330
```

Depois abra `http://localhost:4330`.

## Os dados são reais — e são três anos

Tudo que aparece na tela veio das planilhas que o cliente enviou:

| Ano | Arquivo | Total | Meses |
|---|---|---:|---|
| 2024 | `V E N D A S 2 0 2 4.ods` | 21.529.197 | 12 |
| 2025 | `V E N D A S 2 0 2 5.ods` | 20.537.833 | 12 |
| 2026 | `V E N D A S 2 0 2 6.ods` | 14.773.828 | 7 (até 27/07) |

**11.971 lançamentos, 939 dias, 32 unidades, R$ 56,8 milhões.**

A importação foi conferida contra o total da própria planilha, mês a mês:
**21 dos 31 meses batem exatamente**. Os 10 restantes têm diferença porque **a
planilha erra a conta** — cada caso está identificado na aba *Cadastros* do
protótipo e listado abaixo.

## Os dois formatos de planilha

2024 e 2025 (até novembro) usam um layout **bem diferente** do de 2026:

| | 2024 e 2025 (jan–nov) | dez/2025 e 2026 |
|---|---|---|
| Cabeçalho | linha 2 | linha 1 |
| Colunas "2019" | uma depois de cada loja, quase todas vazias | não existem |
| Blocos | **três**: lojas · aeroporto · feiras | dois: lojas · feiras |

O importador reconhece os dois e normaliza tudo para o mesmo formato.

## O que a planilha antiga revelou

**O bloco do meio é o Aeroporto Salgado Filho.** Em 2024 e 2025 existe um bloco
separado com **Checkin, Inter e Doméstico** — ou seja, *check-in*,
*internacional* e *doméstico*. Isso confirma o que o cliente já tinha dito
(Vivo e Doméstico ficam no aeroporto) e explica de onde vêm esses nomes. No app,
os pontos do aeroporto ficam no grupo **Aeroporto** e podem ser olhados como um
negócio só.

**O "VIP" virou "Vivo".** A mesma coluna se chama VIP até nov/2025 e Vivo a
partir de dez/2025.

## Erros encontrados nas três planilhas

Todos identificados dia a dia e coluna a coluna. Em todos os casos **o número do
app é o certo** — a planilha é que erra:

| Onde | O quê | Valor |
|---|---|---:|
| jan/2025 | O total do dia **esquece o quiosque**, todos os 31 dias | 126.749 a menos |
| fev/2025 | O total do dia **esquece a Megastore**, todos os dias | 51.147 a menos |
| mar/2026 | A feira **Barra** tem valores diários que o subtotal não soma | 70.309 a menos |
| jun/2026 | O subtotal dos dias 28 e 29 soma **duas linhas de uma vez** | 14.425 a mais |
| 2024 (6 meses) | A fórmula **do dia 1º** esquece a Megastore em fev, mar, abr, mai, jun e jul | 11.860 a menos |
| dez/2024 | Uma coluna de rascunho de R$ 1,2 milhão fora da tabela | ignorada |

E mais:

- **As datas de janeiro estão com o ano anterior** tanto no arquivo de 2025
  quanto no de 2026 — o mesmo erro repetido dois anos seguidos.
- **A linha "2024" que aparece em todos os meses de 2026** é o fechamento de
  **dezembro/2024** copiado. Confirmado batendo com a planilha de 2024.
- **Uma feira sem nome em abr/2026** com R$ 42.285 lançados (coluna P).
- **As metas de 2026 pararam em maio**: junho e julho têm meta em 1 unidade só.
  Agora que 2024 e 2025 estão no app, dá para gerar as metas que faltam.
- **A aba Totais de 2026 está 3 meses atrasada.**

## O aeroporto — resolvido

✅ **Confirmado pelo cliente:**

- **`VIP` e `Vivo` são a mesma loja**, renomeada em dez/2025.
- **`Checkin` é outra loja**, também do aeroporto, que fecha em out/2024 — logo
  antes de o VIP abrir, em nov/2024.

Com isso, o grupo **Aeroporto** tem cinco unidades:

| Unidade | Período com venda | Total |
|---|---|---:|
| Internacional | 01/01/2024 a 01/05/2024 | 144.453 |
| Check-in | 01/01/2024 a 31/10/2024 | 490.862 |
| **Vivo** (era VIP até nov/2025) | 01/11/2024 até hoje | 2.718.771 |
| Doméstico | 01/01/2024 até hoje (sem parar) | 3.696.670 |
| Quiosque Aeroporto | 02/05/2026 a 06/07/2026 | 235.843 |

O caso do Check-in mostra por que o cadastro de unidade tem **data de início e
fim**: a planilha reaproveitou a mesma coluna quando uma loja fechou e a outra
abriu, e assim o histórico de uma sobrescreve o da outra. No app cada uma tem seu
próprio cadastro e seu próprio histórico.

O aeroporto como um negócio só: **1,79 mi em 2024 · 3,29 mi em 2025 ·
2,21 mi em 2026** (7 meses).

## De/para dos nomes — fechado ✅

Os nomes das colunas mudaram de ano para ano, e sem ligar um ao outro não existe
comparação entre anos. Todas as ligações estão validadas com o cliente e ficam
registradas na aba **Cadastros** do protótipo. As regras:

- **"Iguatemi" no bloco de lojas é o quiosque; no bloco de feiras é a feira.**
  São coisas diferentes, e em 2024 as duas convivem. O quiosque passou por três
  nomes: `Iguatemi` (2024) → `Quiosque` (2025) → `Q.Iguatemi` (jun/2025 em diante).
- `I Fashion` e `Loja Ifashion` eram **duas feiras diferentes** — não uma feira e
  uma loja. Ficam como duas unidades de feira.
- `Ipiranga` dentro do bloco de feiras (jan/2024) é a **Feira Ipiranga**.
- `Total` dentro do bloco de feiras (jan–fev/2025) é a **Feira Total**, diferente
  da loja Shopping Total.

Ainda sem identificação: a **feira sem nome de abr/2026** (R$ 42.285).

## As 6 telas

| Tela | O que mostra |
|---|---|
| **Painel** | Ontem, mês, ano, tudo já comparado com o ano anterior |
| **Lançar** | Fechamento do dia inteiro numa tela só, com subtotais ao vivo |
| **Visão mensal** | A tabela da planilha + linha pontilhada do ano anterior no gráfico |
| **Visão anual** | Os três anos lado a lado, mês a mês |
| **Comparações** | Dia da semana, mês a mês, unidade a unidade e datas especiais — tudo contra o ano anterior |
| **Cadastros** | Unidades, de/para dos nomes, metas, calendário e a conferência da importação |

## O ponto mais importante para conferir com o cliente

**Maio de 2026 fechou em R$ 5,03 milhões.** Com os três anos no app, dá para ver
o tamanho da anomalia:

| Maio | Total |
|---|---:|
| 2024 | 1,20 mi |
| 2025 | 1,44 mi |
| **2026** | **5,03 mi** — **+250%** contra 2025 |

Junho seguiu alto (+60%) e julho voltou ao normal (−5,6%). O salto começa em 30
de abril, pega **todas as unidades ao mesmo tempo** e tem ritmo semanal normal
(fim de semana mais forte), então não parece acumulado lançado errado. Mas
janeiro, fevereiro e março de 2026 estavam **20% a 24% abaixo** de 2025, o que
torna o salto ainda mais estranho. Vale perguntar o que aconteceu.

## Arquivos

```
dashboard-cameron/
├── DEFINICAO.md      ← o que o app vai ser (documento fechado com o cliente)
├── index.html        ← o protótipo: telas, cálculos e gráficos
├── dados.js          ← 2024 + 2025 + 2026 (gerado das planilhas, não editar à mão)
├── robots.txt        ← mantém a página fora dos buscadores
├── supabase/         ← a Fase 1: banco, login e carga dos três anos
│   ├── COMO-CONFIGURAR.md  ← comece por aqui
│   ├── 01-estrutura.sql
│   ├── 02-acesso.sql
│   ├── 03-cadastros.sql
│   └── lancamentos.csv
└── README.md
```

## Próximo passo: login de verdade (em andamento)

O protótipo guarda os números em `dados.js`, **um arquivo aberto**: quem digitar
o endereço dele baixa o faturamento inteiro, sem login. Uma tela de senha em
JavaScript não resolveria — o arquivo continuaria acessível.

A solução é a **Fase 1** que já estava na definição: os números saem do site e
vão para o **Supabase**, que só entrega dado a quem está logado. O passo a passo
está em [supabase/COMO-CONFIGURAR.md](supabase/COMO-CONFIGURAR.md).

Quando isso entrar, o `dados.js` sai do ar **e o repositório é recriado**, para o
arquivo sumir também do histórico do Git.

## O que ainda não existe no protótipo

- Login e perfis de acesso (diretoria / lançamento) — *em andamento*
- Banco de dados (Supabase) — nada é salvo — *em andamento*
- Exportar para Excel/PDF
- Cadastrar/editar unidade, meta e data especial pela tela (hoje só mostra)
- Botão "gerar metas do ano" a partir do histórico
