// ============================================================
//  Dashboard Cameron — criar usuário pelo app
//
//  Edge Function do Supabase. Roda no servidor deles, e é o único
//  lugar onde a chave de administrador (service_role) pode existir:
//  ela cria contas e ignora todas as regras de acesso, então jamais
//  pode aparecer no site.
//
//  O que a função faz, em ordem:
//    1. confere quem está chamando (o token de quem está logado)
//    2. confere se essa pessoa tem papel de diretoria
//    3. só então cria o login e libera o acesso
//
//  Sem os passos 1 e 2, qualquer um que descobrisse o endereço da
//  função criaria um acesso para si mesmo.
// ============================================================
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return responder({ erro: "Método não permitido." }, 405);

  const URL_BANCO = Deno.env.get("SUPABASE_URL")!;
  const CHAVE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const CHAVE_ADMIN = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // ---------- 1. quem está chamando? ----------
  const autorizacao = req.headers.get("Authorization") ?? "";
  if (!autorizacao) return responder({ erro: "Faça login antes." }, 401);

  const comoVisitante = createClient(URL_BANCO, CHAVE_ANON, {
    global: { headers: { Authorization: autorizacao } },
  });

  const { data: usuario, error: erroUsuario } = await comoVisitante.auth.getUser();
  if (erroUsuario || !usuario?.user) {
    return responder({ erro: "Sua sessão expirou. Saia e entre de novo." }, 401);
  }

  // ---------- 2. essa pessoa é da diretoria? ----------
  const { data: perfil } = await comoVisitante
    .from("perfis").select("papel").eq("id", usuario.user.id).maybeSingle();

  if (!perfil || perfil.papel !== "diretoria") {
    return responder({ erro: "Só quem tem perfil de diretoria pode criar acessos." }, 403);
  }

  // ---------- 3. o que foi pedido ----------
  let corpo: { email?: string; senha?: string; nome?: string; papel?: string };
  try {
    corpo = await req.json();
  } catch {
    return responder({ erro: "Pedido malformado." }, 400);
  }

  const email = (corpo.email ?? "").trim().toLowerCase();
  const senha = corpo.senha ?? "";
  const nome = (corpo.nome ?? "").trim();
  const papel = corpo.papel === "diretoria" ? "diretoria" : "lancamento";

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return responder({ erro: "E-mail inválido." }, 400);
  if (senha.length < 8) return responder({ erro: "A senha precisa de pelo menos 8 caracteres." }, 400);
  if (!nome) return responder({ erro: "Informe o nome da pessoa." }, 400);

  // ---------- 4. criar o login ----------
  const comoAdmin = createClient(URL_BANCO, CHAVE_ADMIN, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let idNovo: string | null = null;
  let jaExistia = false;

  const { data: criado, error: erroCriar } = await comoAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true, // sem e-mail de confirmação: quem cria é a diretoria
    user_metadata: { nome },
  });

  if (erroCriar) {
    // e-mail já cadastrado: em vez de falhar, achamos e liberamos o acesso
    if (/already|exists|registered/i.test(erroCriar.message)) {
      const { data: lista } = await comoAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const achado = lista?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
      if (!achado) return responder({ erro: "Esse e-mail já existe, mas não consegui localizá-lo." }, 409);
      idNovo = achado.id;
      jaExistia = true;
    } else {
      return responder({ erro: erroCriar.message }, 400);
    }
  } else {
    idNovo = criado.user.id;
  }

  // ---------- 5. liberar o acesso ----------
  const { error: erroPerfil } = await comoAdmin
    .from("perfis").upsert({ id: idNovo, nome, papel });

  if (erroPerfil) {
    // criou o login mas não conseguiu liberar: desfaz, para não deixar conta órfã
    if (!jaExistia && idNovo) await comoAdmin.auth.admin.deleteUser(idNovo);
    return responder({ erro: "Criei o login mas não consegui liberar o acesso: " + erroPerfil.message }, 500);
  }

  return responder({ id: idNovo, email, nome, papel, jaExistia });
});
