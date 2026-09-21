// Configuração pública do Supabase — projeto NOVO e exclusivo da DESIGNE decoração.
// A ANON/Publishable key pode ficar no frontend. NUNCA coloque aqui a service_role key.
window.DESIGNE_SUPABASE_URL = "https://neahtbiroeabdqjuscla.supabase.co";
window.DESIGNE_SUPABASE_ANON_KEY = "sb_publishable_VowT6m0n3LO79oHwuro3Yg_R_MJuAbq";

window.designeSupabase = (window.supabase && window.DESIGNE_SUPABASE_URL.startsWith("http") &&
  !window.DESIGNE_SUPABASE_URL.includes("SEU-PROJETO") &&
  window.DESIGNE_SUPABASE_ANON_KEY && !window.DESIGNE_SUPABASE_ANON_KEY.includes("SUA_ANON_KEY"))
  ? window.supabase.createClient(window.DESIGNE_SUPABASE_URL, window.DESIGNE_SUPABASE_ANON_KEY)
  : null;

// Valores por omissão (usados até o Supabase carregar site_config, ou se o Supabase não estiver configurado).
window.DESIGNE_WHATSAPP = "244937283518";
window.DESIGNE_TELEFONE = "+244937283518";
window.DESIGNE_FACEBOOK = "https://www.facebook.com/profile.php?id=61594299960665";
window.DESIGNE_MAPS = "https://goo.gl/maps/QA4SUg5wVFsPjejg6?g_st=ac";
