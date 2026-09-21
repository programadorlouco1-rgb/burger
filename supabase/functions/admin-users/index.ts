// Edge Function "admin-users" — DESIGNE decoração
// Permite que um administrador (já autenticado no painel) crie, liste e remova contas de
// administrador SEM sair do site. A chave secreta do Supabase fica só aqui, no servidor
// (nunca no navegador). Como implantar: ver README.md, secção "Criar utilizadores no painel".

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Chave secreta do projeto: usa a nova (SUPABASE_SECRET_KEYS) ou a antiga (SUPABASE_SERVICE_ROLE_KEY).
function secretKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const keys = JSON.parse(raw);
      if (keys.default) return keys.default;
      const first = Object.values(keys)[0];
      if (typeof first === "string") return first;
    } catch (_) { /* cai para a chave antiga */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, secretKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Quem está a chamar? (valida o token de sessão enviado pelo painel)
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Sessão em falta. Entre novamente no painel." }, 401);
  const { data: who, error: whoErr } = await admin.auth.getUser(token);
  if (whoErr || !who?.user) return json({ error: "Sessão inválida. Entre novamente no painel." }, 401);
  const me = who.user;

  // 2) Essa pessoa é administradora?
  const { data: isAdmin } = await admin.from("admin_users").select("user_id").eq("user_id", me.id).maybeSingle();
  if (!isAdmin) return json({ error: "Sem permissão para gerir utilizadores." }, 403);

  let body: any;
  try { body = await req.json(); } catch (_) { return json({ error: "Pedido inválido." }, 400); }

  // ---------- LISTAR ----------
  if (body.action === "list") {
    const { data: rows, error } = await admin.from("admin_users").select("user_id, created_at").order("created_at");
    if (error) return json({ error: "Não foi possível listar os administradores." }, 500);
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const byId = new Map((list?.users ?? []).map((u) => [u.id, u]));
    return json({
      users: (rows ?? []).map((r) => ({
        id: r.user_id,
        email: byId.get(r.user_id)?.email ?? "(sem e-mail)",
        created_at: r.created_at,
        last_sign_in_at: byId.get(r.user_id)?.last_sign_in_at ?? null,
        is_me: r.user_id === me.id,
      })),
    });
  }

  // ---------- CRIAR ----------
  if (body.action === "create") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "E-mail inválido." }, 400);
    if (password.length < 8) return json({ error: "A senha deve ter pelo menos 8 caracteres." }, 400);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (createErr || !created?.user) {
      const msg = (createErr?.message ?? "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists"))
        return json({ error: "Já existe um utilizador com este e-mail." }, 409);
      return json({ error: createErr?.message ?? "Não foi possível criar o utilizador." }, 400);
    }
    const { error: insErr } = await admin.from("admin_users").insert({ user_id: created.user.id });
    if (insErr) {
      await admin.auth.admin.deleteUser(created.user.id); // desfaz, para não ficar uma conta sem permissões
      return json({ error: "Utilizador criado mas não foi possível dar-lhe acesso. Tente novamente." }, 500);
    }
    return json({ ok: true, id: created.user.id, email });
  }

  // ---------- REMOVER ----------
  if (body.action === "remove") {
    const id = String(body.user_id ?? "");
    if (!id) return json({ error: "Utilizador em falta." }, 400);
    if (id === me.id) return json({ error: "Não pode remover a sua própria conta." }, 400);
    const { count } = await admin.from("admin_users").select("user_id", { count: "exact", head: true });
    if ((count ?? 0) <= 1) return json({ error: "Tem de existir pelo menos um administrador." }, 400);
    const { data: target } = await admin.from("admin_users").select("user_id").eq("user_id", id).maybeSingle();
    if (!target) return json({ error: "Esse utilizador não é administrador." }, 400);
    const { error } = await admin.auth.admin.deleteUser(id); // apaga também a linha em admin_users (cascade)
    if (error) return json({ error: "Não foi possível remover o utilizador." }, 500);
    return json({ ok: true });
  }

  return json({ error: "Ação desconhecida." }, 400);
});
