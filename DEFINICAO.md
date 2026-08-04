# Dashboard Cameron — Fechamento diário das livrarias

> Documento de definição do projeto. Serve para deixar claro **o que** o app vai
> fazer antes de começar a construir. ✅ = decidido. ❓ = ainda em aberto.

Última atualização: 28/07/2026 — *2ª rodada de respostas do cliente incorporada*

Base deste documento: a planilha **`V E N D A S 2 0 2 6.ods`** enviada pelo
cliente (7 abas de meses + aba `Totais`), analisada linha a linha. Tudo que está
na seção 2 foi tirado de lá.

**🔗 Protótipo no ar:** https://yuri-simas.github.io/dashboard-cameron/ — já
carregado com **11.971 lançamentos reais de 2024, 2025 e 2026** (R$ 56,8 milhões),
conferidos mês a mês contra o total das próprias planilhas.

---

## 1. Visão geral (resumo em uma frase)

Um **app web** (que funciona igual de bem no celular) para a rede de livrarias
**Cameron** lançar o **valor de fechamento de cada loja, todo dia**, e ver esse
número virar **visão mensal** e **visão anual** — no lugar da planilha atual, que
faz a conta certa mas é feia, quebra fácil e depende de cálculo digitado à mão.

---

## 2. Como funciona hoje (o que a planilha faz)

Isso é importante: o app **não pode perder nada** que a planilha já entrega.

### 2.1. Estrutura da planilha

- Uma **aba por mês** (Janeiro, Fevereiro, Março, `Abril_`, Maio, Junho, Julho).
- Uma aba **`Totais`** que junta tudo o ano inteiro.
- Cada aba de mês tem **uma coluna por loja** e **uma linha por dia** (dia 1 a 31).

### 2.2. As lojas, em dois blocos

A planilha separa as unidades em **dois grupos**, cada um com seu subtotal:

**Bloco 1 — lojas fixas e quiosques** (colunas B a L, subtotal na coluna M).
✅ As **11 estão ativas hoje**:

| # | Como aparece na planilha | O que é |
|---|---|---|
| 1 | Ipiranga | Bourbon Ipiranga |
| 2 | Country | Bourbon Country |
| 3 | A.Brasil | Bourbon Assis Brasil |
| 4 | Mega | Megastore |
| 5 | Total | Shopping Total |
| 6 | Q.Iguatemi | Quiosque Iguatemi |
| 7 | Q.Barra | Quiosque BarraShopping |
| 8 | Q.Praia | Quiosque Praia de Belas |
| 9 | **La Salle** | ✅ loja ativa — unidade **dentro de uma escola** (Colégio La Salle) |
| 10 | **Vivo** | ✅ loja ativa — ponto no **Aeroporto Salgado Filho** |
| 11 | **Doméstico** | ✅ loja ativa — ponto no **Aeroporto Salgado Filho** |

> 💡 **Achado útil, confirmado pelas planilhas antigas:** em 2024 e 2025 o
> aeroporto era um **bloco inteiro e separado** da planilha, com as colunas
> **Checkin**, **Inter** e **Doméstico** — check-in, internacional e doméstico.
> Junto com o Vivo (que era o "VIP" até nov/2025) e o Q.Aeroporto, são **cinco
> pontos do Salgado Filho** espalhados pela tabela. Por isso o app tem um campo de
> **agrupamento** no cadastro: o grupo "Aeroporto" permite olhar tudo isso como um
> negócio só. Vale para qualquer conjunto futuro (todos os quiosques, todos os
> Bourbon, etc.).

**Bloco 2 — feiras e eventos temporários** (colunas N em diante, subtotal na
coluna seguinte). Este bloco **muda a cada mês**, porque feira nasce e morre:
Wallig, F.N.H (Novo Hamburgo), Cine Iguatemi, Q.Aeroporto, F.Canoas, Iguatemi,
iFashion, Praia, Barra.

✅ **Unidades inativas** — os nomes que aparecem na aba `Totais` sem movimento
(**Canoas, Inter, Moinhos, São Léo, N.Hamburgo, Lojinha Iguatemi, I Fashion**)
estão **inativos** e não abrem em 2026. Entram no app como cadastro **inativo**:
não aparecem na tela de lançamento nem sujam as tabelas, mas o histórico deles
fica guardado e volta a aparecer se um dia reabrirem.

> No fechamento do ano até aqui, o bloco de lojas responde por **76,53%** e o de
> feiras por **23,47%** do faturamento — o app precisa mostrar essa divisão.

### 2.3. As contas que cada aba de mês faz

Além dos dias, cada aba tem linhas de cabeçalho e de rodapé com indicadores:

| Linha | O que é | Como é calculado hoje |
|---|---|---|
| Ano anterior | Faturamento do mesmo mês em 2024 | digitado |
| **Meta** | Meta do mês, por loja | valor do ano anterior **× 0,85**, escrito dentro da fórmula |
| **Projeção** | Onde o mês deve fechar | média diária × nº de dias do mês |
| **diferença** | % da projeção contra a meta | conta automática |
| Total | Soma do mês, por loja | soma da coluna |
| **Média** | Média por dia, por loja | total ÷ **nº de dias digitado à mão** |
| Projeção 15 | Projeção da quinzena | média × 15 |
| %dif | Projeção 15 contra a meta da quinzena | conta automática |
| (coluna extra) | **Total do fim de semana** (sex + sáb + dom) | somado à mão, e só em algumas semanas |

### 2.4. A aba `Totais`

Uma tabela **loja (linha) × mês (coluna)**, puxando a linha "Projeção" de cada
aba mensal, com:
- total do ano por loja (última coluna),
- subtotal do bloco de lojas e do bloco de feiras,
- **% de participação** de cada bloco no ano,
- total geral do ano (**R$ 5.573.061** até julho/2026).

---

## 3. Por que trocar a planilha (os problemas que o app resolve)

Não é só questão de ficar bonito — a planilha tem erros reais hoje:

1. **Média e projeção dependem de um número digitado à mão.** O divisor de dias
   (hoje `27`) é escrito manualmente. Esqueceu de atualizar → média errada →
   projeção errada → decisão errada.
2. **A meta está escondida dentro da fórmula** (`=257172*0,85`). Ninguém vê de
   onde saiu o número, e mudar o percentual exige mexer em fórmula de 15 células.
3. **As colunas de feira mudam de lugar todo mês**, e a aba `Totais` continua
   apontando para a posição antiga. Já tem erro: a linha "Barra" de Março busca a
   célula errada e traz o total do mês no lugar da projeção.
4. **Cabeçalhos errados por copiar e colar:** a aba Fevereiro diz "Janeiro"; as
   abas Março, Maio, Junho e Julho dizem "Abril". A aba de abril se chama `Abril_`.
5. **A linha "ano anterior" é a mesma em todos os meses** (Ipiranga aparece com
   495.497 em janeiro, fevereiro, março... até julho). É sobra de cópia — ou seja,
   a comparação com o ano anterior **está errada em 6 dos 7 meses**.
6. **As datas da aba Janeiro são de 2025**, não de 2026.
7. **`#DIV/0!` aparece na tela** quando a loja não teve meta.
8. **"I Fashion" aparece duas vezes** na aba `Totais`.
9. **Total de fim de semana feito à mão**, e só em parte das semanas.
10. **Uma planilha por ano, uma aba por mês** — comparar 2025 com 2026 significa
    abrir dois arquivos e olhar de lado.
11. **As metas pararam em maio.** Junho e julho têm meta em **1 unidade só**, e
    maio repete a meta de abril. É por isso que a planilha exibe **+335%** em
    julho: ela compara o mês inteiro com a meta de uma loja.
12. **A aba `Totais` está 3 meses atrasada** — maio, junho e julho ainda não
    foram levados para ela.
13. **Uma feira de abril está sem nome**: a coluna P tem **R$ 42.285** lançados e
    o cabeçalho vazio. Ninguém sabe de qual feira é esse dinheiro.

14. **Em jun/2026, o subtotal de feiras dos dias 28 e 29 soma duas linhas de uma
    vez** e conta o dia seguinte em dobro — **R$ 14.425 a mais**.

E as planilhas de 2024 e 2025 trouxeram mais:

15. **Em jan/2025 o total do dia esquece o quiosque — todos os 31 dias**
    (R$ 126.749 a menos). Em **fev/2025 esquece a Megastore** (R$ 51.147).
16. **Em 2024, a fórmula do dia 1º esquece a Megastore** em fevereiro, março,
    abril, maio, junho e julho — R$ 11.860 que nunca entraram no total.
17. **O erro da data de janeiro se repete há dois anos**: as datas de janeiro
    estão gravadas com o ano anterior tanto em 2025 quanto em 2026.
18. **Uma coluna de rascunho de R$ 1,2 milhão** solta ao lado da tabela em
    dez/2024.

> Os itens 11 a 18 apareceram quando montei o protótipo com os dados reais — não
> dava para ver só olhando a planilha. O item 3 também ganhou número: a feira
> "Barra" de março tem **R$ 70.309** lançados que nunca entraram no total do mês.
>
> Somando tudo, os totais que a rede usou para decidir estão errados em
> **cerca de R$ 275 mil** ao longo dos três anos. Nenhum desses erros é possível
> no app, porque lá não existe fórmula para alguém arrastar errado.

No app, **todos esses dez pontos somem por construção**: o valor é lançado uma
vez, e todo o resto é conta feita na hora.

---

## 4. Quem vai usar

✅ **O lançamento é centralizado**: **uma pessoa** do escritório lança o
fechamento de **todas as lojas**. Os gerentes não lançam.

Isso simplifica muito o app — a tela principal passa a ser "o dia inteiro da rede
numa tela só", em vez de uma tela por loja.

✅ **Acesso restrito**: o app é **da diretoria** e da pessoa que lança. Os
gerentes de loja **não têm acesso** — nem para consultar. O número de usuários é
pequeno e conhecido.

✅ O app terá **login com e-mail e senha** (Supabase Auth), no mesmo padrão dos
outros projetos, com dois perfis:

- **Diretoria** — vê tudo, cadastra loja, define meta, corrige qualquer coisa.
- **Lançamento** — a pessoa do escritório: lança e corrige, vê os painéis.

> Como o acesso é fechado na diretoria, os números da rede inteira aparecem em
> todas as telas, sem precisar esconder nada de ninguém. Isso deixa o app bem
> mais direto do que seria com acesso por loja.

✅ **Sem trava de prazo**: dá para lançar e corrigir **qualquer data, a qualquer
momento** — inclusive meses fechados. Toda alteração fica **registrada** (quem
mudou, quando, de quanto para quanto), que é o controle que substitui a trava.

---

## 5. Onde vai rodar

- **App web**, aberto pelo navegador do celular e do computador.
- **Responsivo de verdade**: a pessoa que lança pode estar no celular; a tela de
  lançamento tem que funcionar com o polegar.
- ✅ Mesmo padrão dos outros projetos: **GitHub Pages** (site) + **Supabase**
  (banco de dados e login), infra própria, separada dos outros apps.
- ✅ **Modo claro e escuro**, com a identidade da Cameron (vermelho `#c2211f`,
  azul `#14528c`, marinho `#0c2440` — as cores já usadas no site da rede).
- ✅ Valores sempre em **R$ no formato brasileiro** (1.234,56).

---

## 6. Cadastros

### 6.1. Lojas / unidades

Some a ideia de "coluna". Cada unidade vira um **cadastro**, com:

- Nome (ex.: "Bourbon Ipiranga")
- Nome curto, para caber na tabela (ex.: "Ipiranga")
- **Tipo**: `Loja` | `Quiosque` | `Feira/evento`
- **Bloco**: `Lojas` ou `Feiras` — é o que reproduz os dois subtotais da planilha
- **Agrupamento** (opcional): junta unidades que são o mesmo negócio visto de
  perto — ex.: **"Aeroporto"** reunindo Vivo, Doméstico e Q.Aeroporto. Serve só
  para os painéis; o lançamento continua unidade por unidade.
- **Situação**: ativa / inativa
- **Período** (para feira): data de início e data de fim — assim a feira só
  aparece nos dias em que existiu, e a média dela divide pelos dias certos
- Ordem de exibição

Isso resolve de uma vez os problemas 3, 8 e 10 da seção anterior: pode abrir loja
no meio do ano, fechar quiosque, rodar feira de 12 dias — nada quebra.

### 6.2. Metas

✅ **Regra padrão mantida**: meta = **faturamento do mesmo mês do ano anterior
× 85%**.

Mas com uma diferença importante em relação à planilha: os **dois números ficam
visíveis na tela** — o valor de referência do ano anterior e o percentual — em
vez de escondidos dentro da fórmula. Dá para ajustar o percentual de uma loja
específica sem mexer em fórmula nenhuma.

- Botão **"gerar metas do ano"**: pega o realizado do ano anterior e aplica os
  85% em todas as lojas de uma vez, deixando você ajustar caso a caso depois.
- ✅ **Meta da quinzena = metade da meta do mês** (conta automática, não precisa
  cadastrar).

---

## 7. Lançamento diário (a tela mais importante)

### 7.1. Modo "fechamento do dia" (o principal)

Como é **uma pessoa lançando tudo**, esta tela é feita para fechar o dia inteiro
de uma sentada:

1. Escolhe a data (já vem no último dia em aberto).
2. A tela lista **todas as unidades ativas naquela data**, uma embaixo da outra,
   já na ordem em que a pessoa está acostumada a ver na planilha.
3. Desce digitando — **Enter/Tab pula direto para a próxima loja**, sem precisar
   clicar. Quem lança 15 valores por dia sente essa diferença todo dia.
4. Um rodapé fixo vai somando ao vivo: **subtotal lojas + subtotal feiras = total
   do dia**, e como esse dia se compara com a média do mês.

Detalhes que fazem diferença:
- Campo vazio ≠ zero. **"Não lançado"** e **"lançou R$ 0,00"** são coisas
  diferentes — a média não pode dividir por dia que ninguém lançou.
- Loja fechada no dia: botão **"não abriu"**, que marca o dia sem sujar a média.
- Salvamento por loja, na hora (não precisa preencher tudo para salvar).

### 7.2. Modo "mês inteiro de uma loja" (para recuperar atraso)

Uma grade parecida com a planilha: dias na vertical, e você desce preenchendo.
É o modo de recuperar uma semana esquecida de uma loja só.

### 7.3. Regras do valor

- ✅ O valor lançado é o **faturamento bruto** (sem descontar devolução ou troca).
  Fica registrado no app para ninguém lançar líquido por engano depois.
- ✅ **Só o valor** — sem número de cupons. (Isso significa que **não teremos
  ticket médio**. Se um dia o cliente quiser, basta passar a lançar mais um
  campo; o app já fica preparado para isso.)

---

## 8. Visão mensal

A tela que substitui a aba do mês — só que sem fórmula quebrada.

- **Cabeçalho do mês**: total realizado, meta, % da meta, projeção de fechamento,
  e comparação com o mesmo mês do ano anterior.
- **Tabela loja × dia**, igual à planilha, com os dois blocos e seus subtotais,
  e as linhas de Total, Média e Projeção calculadas na hora.
- **Destaque de fim de semana**: sexta, sábado e domingo agrupados e somados
  **automaticamente** (hoje é feito à mão e só em algumas semanas).
- **Gráfico de linha** do dia a dia, com a média do mês como referência.
- **Ranking das lojas no mês** (quem mais vendeu, quem mais cresceu).
- **Semáforo por loja**: verde bateu a meta, amarelo perto, vermelho longe.
- **Projeção da quinzena** (a "Projeção 15" da planilha), contra a meta de
  quinzena (metade da meta do mês).
- Botão **exportar para Excel/PDF** — o cliente vai querer mandar por e-mail.

## 9. Visão anual

A tela que substitui a aba `Totais`.

- **Matriz loja × mês** (12 colunas), com total do ano por loja.
- Subtotal do bloco **Lojas** e do bloco **Feiras**, com o **% de participação**
  de cada um (os 76,53% / 23,47% que a planilha já calcula).
- **Total geral do ano**, com comparação contra o ano anterior mês a mês.
- **Gráfico de barras** dos 12 meses, com a meta desenhada por cima.
- Filtro por loja, por bloco e por período.

---

## 10. Comparações — "o máximo de comparação possível"

✅ O cliente pediu explicitamente o máximo de comparação. Esta é a maior
vantagem do app sobre a planilha, então vira uma seção própria. Tudo aqui é
**automático**, porque o app guarda o valor com a data — e da data ele sabe o dia
da semana, a semana, o mês e o ano.

**Comparações no tempo**
- **Mesmo dia do ano anterior** e **mesmo mês do ano anterior**.
- **Dia da semana contra dia da semana**: sábado deste mês contra a média dos
  sábados, sábado de agosto contra sábado de agosto do ano passado. No varejo é a
  comparação que realmente vale — comparar sábado com terça não diz nada.
- **Perfil da semana**: quanto cada dia da semana representa do faturamento
  (o típico "sábado é 22% da semana"), por loja e da rede.
- **Ano contra ano na mesma tela** — 2026 x 2025 x 2024, sem abrir outro arquivo.
- **Acumulado do ano até hoje** contra o mesmo período do ano anterior.
- **Quinzena contra quinzena** e **mês contra mês anterior**.

**Comparações entre unidades**
- **Loja contra loja** no mesmo período, em valor e em crescimento %.
- **Bloco contra bloco**: lojas x feiras, com o % de participação.
- **Grupo contra grupo**: o Aeroporto (Vivo + Doméstico + Q.Aeroporto) como um
  negócio só, comparado com os Bourbon, com os quiosques, etc.
- **Ranking de crescimento**: quem mais subiu e quem mais caiu contra o ano
  anterior — não só quem vende mais.
- **Participação de cada loja** no total da rede.

**Comparações contra a meta**
- Realizado x meta, e projeção x meta, no dia, na quinzena, no mês e no ano.
- Quanto falta por dia para bater a meta do mês ("faltam R$ 8.400/dia nos 6 dias
  que sobram").

**Destaques automáticos**
- Melhor e pior dia do mês, por loja e da rede.
- Recordes (melhor sábado do ano, melhor mês da loja).
- Dia fora da curva: valor muito acima ou muito abaixo do normal daquela loja
  naquele dia da semana — serve como conferência de erro de digitação.

### 10.1. Calendário de feriados e datas especiais ✅

✅ O app terá um **calendário de datas especiais**, e isso muda as comparações de
patamar. O motivo é simples: comparar "25 de dezembro" com "25 de dezembro"
funciona pela data, mas **o Dia das Mães cai num domingo diferente todo ano** —
sem o calendário, o app compararia 10 de maio com 11 de maio e diria que a loja
caiu 30%, quando na verdade estaria comparando o Dia das Mães com um domingo
comum.

**Como funciona**

- O app já vem com as datas **pré-carregadas** — feriados nacionais, do Rio
  Grande do Sul e de Porto Alegre — inclusive os que mudam de data todo ano
  (Carnaval, Páscoa, Corpus Christi).
- Vem também com as **datas comerciais que movem livraria**: Dia das Mães, Dia
  dos Pais, Dia dos Namorados, Dia das Crianças, Dia do Livro, Black Friday,
  Natal e a volta às aulas.
- Você pode **cadastrar as suas próprias**: Feira do Livro de Porto Alegre,
  período de vestibular, evento no shopping, obra na loja. Datas soltas ou
  períodos (de/até).
- Cada data pode marcar **quais lojas fecharam** naquele dia — assim o feriado em
  que só o ponto do aeroporto abriu não estraga a média das outras.

**O que isso destrava**

- Comparar **evento com evento**: Dia das Mães 2026 x Dia das Mães 2025, mesmo
  caindo em dias diferentes.
- Comparar o **período inteiro em volta da data** (a semana do Dia das Mães, os
  10 dias antes do Natal) — que é onde a venda de livraria realmente acontece.
- **Tirar os feriados da conta** quando quiser comparar "mês normal com mês
  normal": um mês com 3 feriados não é comparável com um mês sem nenhum.
- Ver a data especial marcada **no gráfico e na tabela do mês**, para o pico
  daquele dia ter explicação em vez de virar dúvida.

❓ Precisamos que o cliente confirme a **lista das datas que importam para a
Cameron** (a Feira do Livro de POA é a mais óbvia) e, se possível, **em que dias
as lojas fecharam** em 2026 — isso melhora o histórico importado.

---

## 11. Painel inicial (a primeira tela ao abrir)

Pensado para dar a resposta em 5 segundos, no celular:

- **Ontem**: quanto a rede vendeu, contra a média e contra o mesmo dia da semana.
- **Mês até agora**: realizado, % da meta e projeção de fechamento.
- **Ano até agora**: acumulado e comparação com o ano passado.
- **Aviso de pendência**: "3 lojas ainda não lançaram ontem" — com link direto
  para lançar. Como o lançamento é centralizado numa pessoa só, esse alerta é a
  rede de segurança do processo inteiro.

---

## 12. Trazer o histórico

- ✅ **2024, 2025 e 2026 já estão importados**: 11.971 lançamentos, 939 dias,
  32 unidades, **R$ 56,8 milhões**. Todas as comparações da seção 10 estão
  funcionando desde já — não é preciso esperar 2027.
- ✅ A conferência foi feita mês a mês contra o total da própria planilha:
  **21 dos 31 meses batem exatamente**, e os 10 restantes estão explicados um a
  um nos itens 11 a 18 da seção 3 (é a planilha que erra, não a importação).
- ⚠️ **2024 e 2025 usam um layout diferente** do de 2026: cabeçalho na linha 2,
  uma coluna de comparação com 2019 depois de cada loja, e **três blocos**
  (lojas · aeroporto · feiras) em vez de dois. O importador já reconhece os dois
  formatos e normaliza tudo.
- ❓ **Os nomes das colunas mudaram de ano para ano**, e sem ligar um ao outro não
  existe comparação entre anos. Liguei o que dava para deduzir pelo comportamento
  dos números; sobraram **8 casos que precisam do aval do cliente**, listados na
  aba Cadastros do protótipo (o principal: "Checkin" e "VIP" são o mesmo ponto do
  aeroporto renomeado, ou dois pontos diferentes?).
- Na importação vamos **corrigir** os problemas listados na seção 3 (as datas de
  2025 na aba de janeiro, a linha de ano anterior repetida, o "I Fashion"
  duplicado) e mostrar um relatório do que foi ajustado.

---

## 13. O que fica de fora (por enquanto)

- Integração automática com o sistema de PDV/frente de caixa — o lançamento é
  manual, como é hoje. (Se um dia der para puxar automático, o modelo de dados já
  aguenta.)
- **Ticket médio** — depende do nº de cupons, que ficou de fora do lançamento.
- Controle de estoque, produtos, título de livro.
- Emissão fiscal, contas a pagar, folha.
- Custo e margem por loja — hoje a planilha só tem faturamento bruto. Se o
  cliente quiser lucro por loja, é outra conversa (precisa de despesa por loja).

---

## 14. Fases sugeridas de entrega

| Fase | O que entra | Por que nessa ordem |
|---|---|---|
| **1** | Cadastro de lojas + lançamento diário + visão mensal | Já substitui a planilha |
| **2** | Metas, projeções, semáforo e visão anual | Vira ferramenta de gestão |
| **3** | Importação do histórico e o pacote de comparações (seção 10) | É o que o cliente mais pediu |
| **4** | Painel inicial, alerta de pendência e exportação | Polimento e adoção |

---

## 15. Situação das decisões

**✅ Já definido pelo cliente**

| Assunto | Decisão |
|---|---|
| Unidades ativas | As 11 do bloco 1, incluindo La Salle, Vivo e Doméstico |
| Canoas, Inter, Moinhos, São Léo, N.Hamburgo, Lojinha Iguatemi, I Fashion | Inativas, não abrem em 2026 |
| Quem lança | Uma pessoa central, no escritório |
| Prazo para corrigir | Indeterminado — qualquer data, a qualquer momento |
| O que se lança | Só o valor (sem nº de cupons) |
| Tipo do valor | Faturamento **bruto** |
| Meta | Ano anterior × 85% (padrão) |
| Meta de quinzena | Metade da meta do mês |
| Comparações | O máximo possível — ver seção 10 |
| Quem tem acesso | **Só a diretoria** e a pessoa que lança. Gerentes não entram |
| Feriados e datas especiais | ✅ Sim — calendário no app, ver seção 10.1 |
| La Salle | Unidade dentro de uma escola (Colégio La Salle) |
| Vivo e Doméstico | Pontos no **Aeroporto Salgado Filho** — ganham o agrupamento "Aeroporto" junto com o Q.Aeroporto |
| VIP e Vivo | ✅ São a **mesma loja** do aeroporto, renomeada em dez/2025 |
| Check-in | ✅ **Outra loja** do aeroporto, que fechou em out/2024 — a planilha reaproveitou a coluna dela para o VIP |
| "Iguatemi" nas duas pontas | ✅ No bloco de **lojas** é o **quiosque**; no bloco de **feiras** é a **feira**. Coisas diferentes, e em 2024 as duas convivem |
| I Fashion e Loja Ifashion | ✅ Eram **duas feiras** diferentes, não uma feira e uma loja |
| De/para dos nomes | ✅ **Fechado** — todas as ligações entre os nomes de 2024, 2025 e 2026 estão validadas e registradas na aba Cadastros |

| Planilhas de 2024 e 2025 | ✅ Recebidas e importadas — as comparações entre anos já funcionam |

**❓ Ainda pendente**

- [ ] ❓ **O que aconteceu em maio e junho de 2026?** Maio fechou **+250% contra
      maio/2025** e junho **+60%**, com julho voltando ao normal. Com os três anos
      no app dá para ver que é uma anomalia de verdade — mas só o cliente sabe se
      foi campanha, evento, ou erro de lançamento.
- [ ] ❓ **Que feira é a coluna sem nome de abr/2026** (R$ 42.285).
- [ ] ❓ **Lista das datas especiais da Cameron** — quais eventos entram no
      calendário além dos feriados (Feira do Livro de POA, volta às aulas,
      eventos de shopping...).
- [ ] ❓ **Dias em que as lojas fecharam** — se o cliente tiver essa informação, o
      histórico fica mais preciso. Se não tiver, o app trata como "não lançado" e
      segue funcionando.

## 16. Próximos passos

1. ✅ Escopo fechado.
2. ✅ Protótipo navegável pronto, com os três anos importados e conferidos.
3. Mostrar o protótipo ao cliente e fechar os ❓ da seção 15 — em especial o
   de/para dos nomes e o que aconteceu em maio/2026.
4. Aprovado o protótipo, subimos banco (Supabase) e publicamos (GitHub Pages).
