// Converte um UID do Cloudflare Stream (ou uma URL já pronta) numa URL de embed utilizável num <iframe>.
// Aceita: UID puro do Cloudflare Stream, URL de embed do Cloudflare Stream, ou qualquer outra URL de embed (YouTube, Vimeo, etc.)
window.resolveVideoEmbedUrl=function(videoUid){
  if(!videoUid) return null;
  const v=String(videoUid).trim();
  if(/^https?:\/\//i.test(v)){
    if(v.includes("/watch") && v.includes("youtube")) return v.replace("watch?v=","embed/");
    if(v.includes("youtu.be/")) return "https://www.youtube.com/embed/"+v.split("youtu.be/")[1];
    return v;
  }
  // UID simples do Cloudflare Stream — troque CODIGO pelo seu customer code do Cloudflare Stream.
  return `https://customer-CODIGO.cloudflarestream.com/${v}/iframe`;
};
