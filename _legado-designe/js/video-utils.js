// Converte o que o admin colar no campo de vídeo numa URL de embed utilizável num <iframe>.
// Aceita:
//  - YouTube: youtube.com/watch?v=…, youtu.be/…, youtube.com/shorts/…, /live/…, /embed/…, m.youtube.com
//    (com ou sem parâmetros extra como &t=90, ?t=1m30s, ?si=…, &list=…; o tempo inicial é mantido)
//  - Vimeo: vimeo.com/NUMERO, vimeo.com/NUMERO/HASH (não listado) e player.vimeo.com/video/NUMERO
//  - Qualquer outra URL de embed https://…
//  - UID puro do Cloudflare Stream (opcional — só se um dia usar o Stream)
(function(){
  // "90", "90s", "1m30s", "1h2m3s" → segundos
  function parseTempo(t){
    if(!t) return 0;
    t=String(t).trim().toLowerCase();
    if(/^\d+$/.test(t)) return parseInt(t,10);
    const m=t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    if(!m || (!m[1] && !m[2] && !m[3])) return 0;
    return (parseInt(m[1]||0,10)*3600)+(parseInt(m[2]||0,10)*60)+parseInt(m[3]||0,10);
  }

  function youtubeEmbed(id, u){
    if(!/^[A-Za-z0-9_-]{6,15}$/.test(id||"")) return null;
    let src="https://www.youtube.com/embed/"+id;
    const start=parseTempo(u.searchParams.get("start")||u.searchParams.get("t")||(u.hash.match(/[#&]t=([^&]+)/)||[])[1]);
    if(start>0) src+="?start="+start;
    return src;
  }

  window.resolveVideoEmbedUrl=function(videoUid){
    if(!videoUid) return null;
    let v=String(videoUid).trim();
    if(/^https?:\/\//i.test(v) || /^(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i.test(v)){
      if(!/^https?:\/\//i.test(v)) v="https://"+v;
      let u;
      try{ u=new URL(v); }catch(e){ return null; }
      const host=u.hostname.replace(/^(www\.|m\.)/,"").toLowerCase();
      const parts=u.pathname.split("/").filter(Boolean);

      if(host==="youtu.be") return youtubeEmbed(parts[0], u);
      if(host==="youtube.com" || host==="youtube-nocookie.com"){
        if(parts[0]==="watch") return youtubeEmbed(u.searchParams.get("v"), u);
        if(["shorts","embed","live","v"].includes(parts[0])) return youtubeEmbed(parts[1], u);
        return null;
      }
      if(host==="vimeo.com"){
        const id=parts.find(p=>/^\d+$/.test(p));
        if(!id) return null;
        const hash=parts[parts.indexOf(id)+1];
        let src="https://player.vimeo.com/video/"+id;
        if(hash && /^[A-Za-z0-9]+$/.test(hash)) src+="?h="+hash;
        else if(u.searchParams.get("h")) src+="?h="+encodeURIComponent(u.searchParams.get("h"));
        return src;
      }
      // Outra URL de embed já pronta (Vimeo player, Cloudflare Stream, etc.)
      return v.replace(/"/g,"%22");
    }
    // UID simples do Cloudflare Stream — só necessário se usar o Stream:
    // troque CODIGO pelo seu customer code.
    if(!/^[A-Za-z0-9]+$/.test(v)) return null;
    return `https://customer-CODIGO.cloudflarestream.com/${v}/iframe`;
  };
})();
