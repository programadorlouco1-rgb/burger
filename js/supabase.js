// Configuração pública do Supabase — projeto NOVO e exclusivo da Cokylicious.
// (O projeto Supabase que estava aqui era o da DESIGNE decoração: NÃO o reutilizes.)
//
// 1) Cria um projeto novo em supabase.com e corre o supabase.sql inteiro no SQL Editor.
// 2) Em Project Settings > API copia o "Project URL" e a chave pública (anon / publishable).
// 3) Cola-os abaixo. A chave anon pode ficar no frontend; NUNCA coloques aqui a service_role.
//
// Enquanto isto não estiver preenchido, o site funciona em MODO DEMO (js/demo-data.js).
window.DESIGNE_SUPABASE_URL = "COLE_AQUI_O_PROJECT_URL";
window.DESIGNE_SUPABASE_ANON_KEY = "COLE_AQUI_A_ANON_KEY";

// (O prefixo "DESIGNE_" / "designeSupabase" é herdado do projeto anterior e mantido de propósito
// para não mexer em todas as páginas do admin. Podes renomear tudo com "Substituir" no editor.)
window.designeSupabase = (window.supabase &&
  /^https?:\/\//.test(window.DESIGNE_SUPABASE_URL) && !window.DESIGNE_SUPABASE_URL.includes("COLE_AQUI") &&
  window.DESIGNE_SUPABASE_ANON_KEY && !window.DESIGNE_SUPABASE_ANON_KEY.includes("COLE_AQUI"))
  ? window.supabase.createClient(window.DESIGNE_SUPABASE_URL, window.DESIGNE_SUPABASE_ANON_KEY)
  : null;
