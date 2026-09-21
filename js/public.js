(function(){
  const sb = window.designeSupabase;
  if (!sb) return;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const money = (value) => (value == null || value === "") ? "Preço sob orçamento" : new Intl.NumberFormat("pt-AO",{style:"currency",currency:"AOA",maximumFractionDigits:0}).format(Number(value));
  const waLink = (nome) => `https://wa.me/${window.DESIGNE_WHATSAPP}?text=${encodeURIComponent("Olá, DESIGNE decoração. Vi o móvel "+nome+" no vosso site e gostaria de solicitar um orçamento.")}`;

  const HOME_MOVEIS_LIMIT = 6;
  async function loadMoveis(){
    const box=document.getElementById("publicMoveis"); if(!box) return;
    const {data,error}=await sb.from("moveis").select("*,videos(id,titulo,video_uid,thumbnail_url)").eq("disponivel",true).order("destaque",{ascending:false}).order("created_at",{ascending:false});
    if(error){ box.innerHTML='<div class="products-state">Não foi possível carregar os móveis neste momento.</div>'; return; }
    if(!data?.length){ box.innerHTML='<div class="products-state">Novos móveis serão publicados aqui em breve.</div>'; return; }
    const shown=data.slice(0,HOME_MOVEIS_LIMIT);
    box.innerHTML=shown.map(p=>`<article class="product-card">
      <img src="${esc(p.imagem_url || "assets/hero.jpg")}" alt="${esc(p.nome)}" loading="lazy" data-pid="${p.id}">
      <div class="product-card-body">
        <div class="eyebrow">${esc(p.categoria || "Móvel planejado")}</div>
        <h3>${esc(p.nome)}</h3>
        <p>${esc(p.descricao || "")}</p>
        <div class="product-meta"><span class="product-price">${esc(money(p.preco))}</span><span class="product-status">Disponível</span></div>
        <a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink(p.nome)}">Solicitar orçamento ↗</a>
        ${p.videos?.video_uid?`<span class="product-video-link" data-video="${esc(p.videos.video_uid)}" data-title="${esc(p.nome)}">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Veja este móvel em vídeo
        </span>`:""}
      </div>
    </article>`).join("");
    const lightboxItems=shown.map(p=>({src:p.imagem_url || "assets/hero.jpg",alt:p.nome,title:esc(p.nome),subtitle:esc(money(p.preco)),whatsapp:waLink(p.nome)}));
    box.querySelectorAll("img[data-pid]").forEach(imgEl=>{
      imgEl.addEventListener("click",()=>{
        const i=shown.findIndex(p=>String(p.id)===imgEl.dataset.pid);
        if(window.designeOpenLightbox) window.designeOpenLightbox(lightboxItems,i<0?0:i);
      });
    });
    box.querySelectorAll(".product-video-link").forEach(el=>{
      el.addEventListener("click",()=>{ if(window.designeOpenVideo) window.designeOpenVideo(el.dataset.video, el.dataset.title); });
    });
    const seeAll=document.getElementById("seeAllMoveis");
    if(seeAll) seeAll.hidden = data.length<=HOME_MOVEIS_LIMIT;
  }

  async function loadServices(){
    const box=document.getElementById("publicServices"); if(!box) return;
    const {data,error}=await sb.from("servicos").select("*").eq("ativo",true).order("ordem",{ascending:true}).order("created_at",{ascending:true});
    if(error){ box.innerHTML='<div class="services-state">Não foi possível carregar os serviços neste momento.</div>'; return; }
    if(!data?.length){ box.innerHTML='<div class="services-state">Novos serviços serão publicados aqui em breve.</div>'; return; }
    box.innerHTML=data.map(s=>`<article class="service">
      <img class="service-photo" src="${esc(s.imagem_url || "assets/hero.jpg")}" alt="${esc(s.titulo)}" loading="lazy">
      <div class="service-body"><h3>${esc(s.titulo)}</h3><p>${esc(s.descricao || "")}</p></div>
    </article>`).join("");
  }

  const HOME_PROJETOS_LIMIT = 4;
  let projetosCache=[];
  async function loadProjetos(){
    const gallery=document.getElementById("publicGallery"); if(!gallery) return;
    const {data,error}=await sb.from("projetos").select("*,videos(id,titulo,video_uid,thumbnail_url)").eq("ativo",true).order("destaque",{ascending:false}).order("created_at",{ascending:false});
    if(error || !data?.length) return;
    projetosCache=data;
    const shown=data.slice(0,HOME_PROJETOS_LIMIT);
    const classes=["g1","g2","g3","g4"];
    gallery.innerHTML=shown.map((w,i)=>`<div class="g ${classes[i%classes.length]}">
      <img src="${esc(w.imagem_capa_url || "assets/hero.jpg")}" alt="${esc(w.titulo)}" loading="lazy" data-projeto="${w.id}">
      <span class="g-cat">${esc(w.categoria||"Projeto")}</span>
      <span class="caption">${esc(w.titulo)}</span>
      ${w.videos?.video_uid?`<span class="video-badge" data-projeto-video="${w.id}"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>`:""}
    </div>`).join("");
    window.designeAttachProjetoHandlers(gallery, shown);
    const seeGallery=document.getElementById("seeGallery");
    if(seeGallery) seeGallery.hidden = data.length<=HOME_PROJETOS_LIMIT;
  }

  // Vídeo em destaque na home — "Veja o nosso trabalho ganhar vida"
  async function loadFeaturedVideo(){
    const wrap=document.getElementById("featuredVideoSection"); if(!wrap) return;
    const {data,error}=await sb.from("videos").select("*").eq("destaque",true).eq("ativo",true).order("updated_at",{ascending:false}).limit(1).maybeSingle();
    if(error || !data){ wrap.hidden=true; return; }
    wrap.hidden=false;
    const thumb=document.getElementById("featuredVideoThumb");
    const titleEl=document.getElementById("featuredVideoTitle");
    const descEl=document.getElementById("featuredVideoDesc");
    if(thumb){ thumb.querySelector("img").src = data.thumbnail_url || "assets/hero.jpg"; thumb.dataset.video=data.video_uid; thumb.dataset.title=data.titulo; }
    if(titleEl) titleEl.textContent = data.titulo || "Veja o nosso trabalho ganhar vida";
    if(descEl && data.descricao) descEl.textContent = data.descricao;
    if(thumb) thumb.addEventListener("click",()=>{ if(window.designeOpenVideo) window.designeOpenVideo(data.video_uid, data.titulo); });
  }

  async function loadConfig(){
    const {data,error}=await sb.from("site_config").select("*").eq("id",1).maybeSingle();
    if(error || !data) return;
    window.DESIGNE_WHATSAPP = (data.whatsapp||window.DESIGNE_WHATSAPP).replace(/\D/g,"");
    window.DESIGNE_TELEFONE = data.telefone || window.DESIGNE_TELEFONE;
    window.DESIGNE_FACEBOOK = data.facebook || window.DESIGNE_FACEBOOK;
    window.DESIGNE_MAPS = data.maps_link || window.DESIGNE_MAPS;
    const setText=(sel,val)=>{const el=document.querySelector(sel); if(el && val) el.textContent=val};
    setText("#heroTitulo", data.hero_titulo);
    setText("#heroSubtitulo", data.hero_subtitulo);
    setText("#sobreTitulo", data.sobre_titulo);
    setText("#sobreTexto", data.sobre_texto);
    document.querySelectorAll('[data-wa-link]').forEach(a=>{ a.href = `https://wa.me/${window.DESIGNE_WHATSAPP}` + (a.dataset.waText?`?text=${encodeURIComponent(a.dataset.waText)}`:""); });
    document.querySelectorAll('[data-tel-link]').forEach(a=>{ a.href = `tel:${window.DESIGNE_TELEFONE.replace(/\s/g,"")}`; a.textContent = window.DESIGNE_TELEFONE; });
    document.querySelectorAll('[data-fb-link]').forEach(a=>{ a.href = window.DESIGNE_FACEBOOK; });
    document.querySelectorAll('[data-maps-link]').forEach(a=>{ a.href = window.DESIGNE_MAPS; });
  }

  loadConfig().then(()=>{ loadMoveis(); loadServices(); loadProjetos(); loadFeaturedVideo(); });
})();
