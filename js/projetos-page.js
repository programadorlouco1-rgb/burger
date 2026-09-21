(function(){
  const sb = window.designeSupabase;
  const box = document.getElementById("allGalleryGrid");
  if (!box) return;
  if (!sb) { box.innerHTML='<div class="products-state">Configuração do Supabase em falta.</div>'; return; }

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  async function load(){
    const {data,error}=await sb.from("projetos").select("*,videos(id,titulo,video_uid,thumbnail_url)").eq("ativo",true).order("destaque",{ascending:false}).order("created_at",{ascending:false});
    if(error){ box.innerHTML='<div class="products-state">Não foi possível carregar os projetos neste momento.</div>'; return; }
    if(!data?.length){ box.innerHTML='<div class="products-state">Ainda não há projetos publicados.</div>'; return; }

    const countEl=document.getElementById("galleryCount");
    if(countEl) countEl.textContent = data.length + (data.length===1?" projeto publicado":" projetos publicados");

    const classes=["g1","g2","g3","g4","g5","g6"];
    box.innerHTML=data.map((w,i)=>`<div class="g ${classes[i%classes.length]}">
      <img src="${esc(w.imagem_capa_url || "assets/hero.jpg")}" alt="${esc(w.titulo)}" loading="lazy" data-projeto="${w.id}">
      <span class="g-cat">${esc(w.categoria||"Projeto")}</span>
      <span class="caption">${esc(w.titulo)}</span>
      ${w.videos?.video_uid?`<span class="video-badge" data-projeto-video="${w.id}"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>`:""}
    </div>`).join("");

    if(window.designeAttachProjetoHandlers) window.designeAttachProjetoHandlers(box, data);
    if(window.designeAnimateNew) window.designeAnimateNew(box);
  }
  load();
})();
