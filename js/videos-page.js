(function(){
  const sb = window.designeSupabase;
  const box = document.getElementById("allVideosGrid");
  if (!box) return;
  if (!sb) { box.innerHTML='<div class="products-state">Configuração do Supabase em falta.</div>'; return; }

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const playIcon = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';

  async function load(){
    // todos os vídeos publicados (ativos), os de destaque primeiro
    const {data,error}=await sb.from("videos").select("*").eq("ativo",true).order("destaque",{ascending:false}).order("created_at",{ascending:false});
    if(error){ box.innerHTML='<div class="products-state">Não foi possível carregar os vídeos neste momento.</div>'; return; }
    const items=(data||[]).filter(v=>v.video_uid);
    if(!items.length){ box.innerHTML='<div class="products-state">Ainda não há vídeos publicados.</div>'; return; }

    const countEl=document.getElementById("videosCount");
    if(countEl) countEl.textContent = items.length + (items.length===1?" vídeo publicado":" vídeos publicados");

    box.innerHTML=items.map((v,i)=>`<article class="video-card" data-i="${i}" role="button" tabindex="0" aria-label="Reproduzir vídeo: ${esc(v.titulo)}">
      <div class="video-thumb-wrap">
        <img src="${esc(v.thumbnail_url || "assets/hero.jpg")}" alt="${esc(v.titulo)}" loading="lazy">
        <div class="play-btn">${playIcon}</div>
      </div>
      <div class="video-card-body">
        <div class="eyebrow">${esc(v.categoria || "Em vídeo")}</div>
        <h3>${esc(v.titulo)}</h3>
        ${v.descricao?`<p>${esc(v.descricao)}</p>`:""}
      </div>
    </article>`).join("");

    const play=(card)=>{ const v=items[+card.dataset.i]; if(v && window.designeOpenVideo) window.designeOpenVideo(v.video_uid, v.titulo); };
    box.addEventListener("click",e=>{ const card=e.target.closest(".video-card"); if(card) play(card); });
    box.addEventListener("keydown",e=>{
      if(e.key!=="Enter" && e.key!==" ") return;
      const card=e.target.closest(".video-card"); if(!card) return;
      e.preventDefault(); play(card);
    });
    if(window.designeAnimateNew) window.designeAnimateNew(box);
  }
  load();
})();
