# Como ligar o Dashboard Cameron ao Supabase

Passo a passo para sair do protótipo (dados num arquivo aberto) e chegar no app
com **login de verdade**. São uns 20 minutos, tudo por clique e copiar/colar.

> **Por que estamos fazendo isso:** hoje o arquivo `dados.js` está no ar e
> qualquer um que digite o endereço dele baixa o faturamento da rede inteira.
> Uma tela de login em JavaScript não resolveria — o arquivo continuaria lá.
> A solução é o número sair do site e ir para o banco, que só entrega dado a
> quem está logado.

---

## 1. Criar o projeto no Supabase

1. Entre em **https://supabase.com** com a sua conta.
2. **New project**. Sugestões:
   - **Name:** `dashboard-cameron`
   - **Region:** `South America (São Paulo)` — é o mais perto, o app fica mais rápido
   - **Database password:** deixe o Supabase gerar e **guarde no seu gerenciador
     de senhas**. Você não vai precisar dela no dia a dia, mas sem ela não dá
     para recuperar o banco.
3. Espere uns 2 minutos até o projeto ficar verde.

> É um projeto **novo e separado** do CRM e dos outros apps, como combinamos na
> definição.

---

## 2. Criar as tabelas

No menu da esquerda, **SQL Editor** → **New query**. Para cada arquivo abaixo:
abra, copie tudo, cole no editor e clique em **Run**.

| Ordem | Arquivo | O que faz |
|---|---|---|
| 1º | `01-estrutura.sql` | Cria as tabelas e o histórico de alterações |
| 2º | `02-acesso.sql` | Liga a tranca: sem login, ninguém lê nada |
| 3º | `03-cadastros.sql` | Carrega as 32 unidades, as 66 metas e o calendário |
| 4º | `04-relatorio.sql` | Cria a tabela do relatório de importação |
| 5º | `05-relatorio-dados.sql` | Carrega o de/para dos nomes e a conferência dos 31 meses |

**A ordem importa** — cada arquivo depende do anterior.

Se aparecer **Success. No rows returned**, deu certo — é assim mesmo.

---

## 3. Carregar os 3 anos de vendas

São **11.971 lançamentos**, então vão por arquivo, não por copiar/colar.

1. Menu **Table Editor** → tabela **`lancamentos`**.
2. Botão **Insert** → **Import data from CSV**.
3. Escolha o arquivo **`lancamentos.csv`** desta pasta.
4. Confira se as três colunas casaram: `unidade_id`, `data`, `valor_centavos`.
5. **Import**. Leva menos de um minuto.

**Como saber se deu certo:** volte ao SQL Editor e rode

```sql
select count(*) as lancamentos,
       to_char(sum(valor_centavos)/100.0, 'FM999G999G999D00') as total
from public.lancamentos;
```

Tem que aparecer **11.971** e **56.840.858,00**. Se bater, os três anos entraram
inteiros — é o mesmo número que conferimos contra as planilhas.

---

## 4. Criar os usuários

Menu **Authentication** → **Users** → **Add user** → **Create new user**.

Marque **Auto Confirm User**, para a pessoa não precisar confirmar e-mail.

Crie um usuário para cada pessoa que vai usar. Lembrando o que ficou definido:
**só a diretoria e quem lança** — os gerentes de loja não entram.

Depois de criar, copie o **User UID** de cada um e rode no SQL Editor, trocando
o UID e o nome:

```sql
insert into public.perfis (id, nome, papel) values
  ('cole-o-uid-aqui', 'Nome da Pessoa', 'diretoria');
```

O papel é **`diretoria`** (vê tudo, mexe em cadastro e meta) ou
**`lancamento`** (lança e corrige venda, não mexe em cadastro).

> ⚠️ **Sem uma linha em `perfis`, a pessoa loga mas não vê nada.** É de
> propósito: criar usuário e dar acesso são dois atos separados, então um
> cadastro esquecido nunca vira acesso indevido.

---

## 5. Me mandar as duas chaves

**Onde clicar:** no menu da esquerda, lá embaixo, o ícone de engrenagem
**Project Settings**. Dentro dele procure **API** — dependendo da versão do
painel, pode estar dividido em **Data API** (onde fica a URL) e **API Keys**
(onde ficam as chaves).

Copie e me mande estes dois:

| O que | Onde | Cara que tem |
|---|---|---|
| **Project URL** | Data API (ou API) | `https://xxxxxxxxxxxx.supabase.co` |
| Chave **anon** / **public** / **publishable** | API Keys (ou API) | um texto bem longo começando com `eyJ`, ou `sb_publishable_...` no formato novo |

**Essas duas podem ser públicas**, é para isso que servem: sozinhas não abrem
nada, porque toda tabela está com a tranca do `02-acesso.sql` ligada. Elas só
funcionam junto com um login válido.

> 🔴 **Nunca me mande, nem coloque no site, a chave `service_role`** (no formato
> novo aparece como **secret**). Essa ignora todas as regras de acesso. Se ela
> vazar, o banco inteiro vaza junto. Na tela ela vem escondida atrás de um
> "Reveal" — é justamente a que não se mostra.

Com essas duas eu preencho o `config.js`, publico e a tela de login entra no ar.

---

## 6. O que já está pronto do meu lado

- ✅ Tela de login (e-mail e senha), com aviso específico para quem entra mas
  ainda não tem acesso liberado
- ✅ O app saiu de dentro da página e só é baixado **depois** da sessão existir —
  antes de entrar não há um número sequer no navegador
- ✅ Leitura do banco em blocos de mil, para dar conta dos ~12 mil lançamentos
- ✅ `dados.js`, `lancamentos.csv` e `03-cadastros.sql` fora do repositório
- ✅ Repositório antigo fechado; será apagado e recriado com histórico limpo
- ⏳ Falta só ligar no banco — depende dos dois valores acima

---

## Perguntas que costumam aparecer

**Vai ficar caro?** Não. O plano grátis do Supabase cobre com folga: são ~12 mil
linhas e um punhado de usuários.

**E se eu esquecer a senha?** Dá para redefinir pela tela de Authentication do
Supabase, ou o app pode mandar e-mail de redefinição.

**O cliente vai precisar de conta em algum lugar?** Não. Ele entra com o e-mail e
a senha que você criar aqui, direto no endereço do app.

**Os números antigos ficam guardados?** Ficam. Os três anos entram inteiros, e as
unidades que fecharam (Check-in, Canoas, Internacional, as feiras antigas) seguem
com o histórico delas — só não aparecem na tela de lançamento.
