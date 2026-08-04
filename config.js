/* ============================================================
   Ligação com o banco (Supabase)

   Preencha os dois campos com o que aparece no painel do Supabase em
   Project Settings → API:

     url      = "Project URL"
     anonKey  = a chave "anon public"

   Esta chave PODE ficar visível no site — ela é pública por definição.
   Quem tranca os dados não é ela, e sim as políticas de acesso do banco
   (Row Level Security), ligadas em 02-acesso.sql: sem estar logado e sem
   ter uma linha na tabela "perfis", a chave sozinha não devolve nada.

   O que NUNCA pode aparecer aqui é a chave "service_role", que ignora
   todas as políticas.
   ============================================================ */
window.CAMERON_CONFIG = {
  url: "https://cjglnzzvvsggjmqygkea.supabase.co",
  anonKey: "sb_publishable_jUNemSK0p8WBChYAWHR_3g_fKZZIiw9",
};
