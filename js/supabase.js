// Configuração pública do Supabase — projeto NOVO e exclusivo da Cokylicious.

window.DESIGNE_SUPABASE_URL = "https://xicbcgpgysvmxvgoscys.supabase.co";
window.DESIGNE_SUPABASE_ANON_KEY = "sb_publishable_csBWft6PJS3_VqWMDoFzrQ_s-ASXM0O";

window.designeSupabase = (window.supabase &&
  /^https?:\/\//.test(window.DESIGNE_SUPABASE_URL) && !window.DESIGNE_SUPABASE_URL.includes("COLE_AQUI") &&
  window.DESIGNE_SUPABASE_ANON_KEY && !window.DESIGNE_SUPABASE_ANON_KEY.includes("COLE_AQUI"))
  ? window.supabase.createClient(window.DESIGNE_SUPABASE_URL, window.DESIGNE_SUPABASE_ANON_KEY)
  : null;
