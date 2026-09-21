// EXEMPLO — Cloudflare Worker para gerar URLs de upload direto para o Cloudflare Stream.
// Isto é OPCIONAL: hoje, o painel admin (admin/videos.html) já funciona colando manualmente
// o UID do vídeo depois de o carregar pelo dashboard do Cloudflare Stream (ou pela app/site
// cloudflarestream.com no telemóvel). Este Worker serve para, no futuro, permitir que o
// upload aconteça diretamente dentro do painel admin da DESIGNE decoração (upload do telemóvel
// sem sair do site), como pedido na especificação original.
//
// COMO FUNCIONA:
// 1) O admin, autenticado no painel, pede ao Worker uma "URL de upload direto".
// 2) O Worker (que guarda o API Token do Cloudflare em segredo, nunca no frontend) pede essa
//    URL à API do Cloudflare Stream e devolve-a ao painel.
// 3) O navegador do admin envia o ficheiro de vídeo DIRETAMENTE para essa URL (não passa pelo
//    Worker nem pelo Supabase) — funciona bem em ligações móveis, inclusive de forma resumível.
// 4) Quando o Cloudflare termina o processamento, o admin copia o UID devolvido e cola em
//    admin/videos.html (ou automatiza isso depois, com um webhook do Cloudflare Stream).
//
// IMPLANTAÇÃO (resumo):
// - Crie uma conta/plano Cloudflare Stream.
// - Crie um API Token com permissão "Stream: Edit".
// - `wrangler deploy` este Worker, com os segredos:
//     wrangler secret put CF_ACCOUNT_ID
//     wrangler secret put CF_API_TOKEN
// - Restrinja o CORS/origem ao domínio do site da DESIGNE decoração.
// - Proteja o endpoint (ex.: exigindo um JWT do Supabase Auth do admin autenticado e validando-o
//   aqui no Worker antes de emitir a URL de upload).
//
// Este ficheiro é um PONTO DE PARTIDA — não está testado/implantado. Antes de usar em produção,
// reveja a autenticação, o CORS e o tratamento de erros.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (url.pathname === "/upload-url" && request.method === "POST") {
      // TODO: validar aqui um JWT do Supabase (Authorization: Bearer ...) e confirmar
      // que o utilizador está em admin_users antes de continuar.

      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/stream/direct_upload`;
      const cfRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maxDurationSeconds: 3600,
          requireSignedURLs: false,
        }),
      });
      const data = await cfRes.json();
      if (!data.success) {
        return new Response(JSON.stringify({ error: "Falha ao gerar URL de upload." }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(env) },
        });
      }
      return new Response(JSON.stringify({
        uploadURL: data.result.uploadURL,
        videoUid: data.result.uid,
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders(env) },
      });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders(env) });
  },
};

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
