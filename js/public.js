/* "O que fazemos" — botão Ver mais / Ver menos.
   Fica fora do bloco do Supabase para funcionar também com os cards estáticos do HTML. */
(function(){
  // Nº de cards visíveis antes de "Ver mais": 4 (uma linha no desktop) e 3 no telemóvel
  const svcMQ = window.matchMedia("(max-width:700px)");
  const servicesLimit = () => svcMQ.matches ? 3 : 4;
  function applyServicesLimit(){
    const box=document.getElementById("publicServices");
    const btn=document.getElementById("toggleServices");
    if(!box || !btn) return;
    const cards=Array.from(box.querySelectorAll(":scope > .service"));
    const limit=servicesLimit();
    cards.forEach((c,i)=>c.classList.toggle("is-extra", i>=limit));
    const hasExtra=cards.length>limit;
    btn.hidden=!hasExtra;
    if(!hasExtra) box.classList.remove("expanded");
    syncServicesToggle();
  }
  function syncServicesToggle(){
    const box=document.getElementById("publicServices");
    const btn=document.getElementById("toggleServices");
    if(!box || !btn) return;
    const open=box.classList.contains("expanded");
    btn.setAttribute("aria-expanded", open?"true":"false");
    const label=btn.querySelector(".toggle-label");
    if(label) label.textContent = open ? "Ver menos" : "Ver mais";
  }
  (function initServicesToggle(){
    const box=document.getElementById("publicServices");
    const btn=document.getElementById("toggleServices");
    if(!box || !btn) return;
    btn.addEventListener("click",()=>{
      const open=box.classList.toggle("expanded");
      syncServicesToggle();
      if(!open){
        const sec=document.getElementById("servicos");
        if(sec) sec.scrollIntoView({behavior:"smooth",block:"start"});
      }
    });
    svcMQ.addEventListener ? svcMQ.addEventListener("change",applyServicesLimit) : svcMQ.addListener(applyServicesLimit);
    applyServicesLimit(); // cobre também os cards estáticos do HTML
  })();

  window.designeApplyServicesLimit = applyServicesLimit;
})();

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
        <a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink(p.nome)}">Solicitar orçamento <svg class='icon' aria-hidden='true'><use href='#i-external'/></svg></a>
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
    if(window.designeAnimateNew) window.designeAnimateNew(box);
  }

  async function loadServices(){
    const box=document.getElementById("publicServices"); if(!box) return;
    const {data,error}=await sb.from("servicos").select("*").eq("ativo",true).order("ordem",{ascending:true}).order("created_at",{ascending:true});
    if(error){ box.innerHTML='<div class="services-state">Não foi possível carregar os serviços neste momento.</div>'; return; }
    if(!data?.length){ box.innerHTML='<div class="services-state">Novos serviços serão publicados aqui em breve.</div>'; return; }
    box.classList.remove("expanded");
    box.innerHTML=data.map(s=>`<article class="service">
      <img class="service-photo" src="${esc(s.imagem_url || "assets/hero.jpg")}" alt="${esc(s.titulo)}" loading="lazy">
      <div class="service-body"><h3>${esc(s.titulo)}</h3><p>${esc(s.descricao || "")}</p></div>
    </article>`).join("");
    if(window.designeApplyServicesLimit) window.designeApplyServicesLimit();
    if(window.designeAnimateNew) window.designeAnimateNew(box);
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
    if(window.designeAnimateNew) window.designeAnimateNew(gallery);
  }

  // Vídeos em destaque na home — carrossel ("Veja o nosso trabalho ganhar vida")
  async function loadFeaturedVideo(){
    const wrap=document.getElementById("featuredVideoSection"); if(!wrap) return;
    const {data,error}=await sb.from("videos").select("*").eq("destaque",true).eq("ativo",true).order("created_at",{ascending:false});
    const items=(data||[]).filter(v=>v.video_uid);
    if(error || !items.length){ wrap.hidden=true; return; }
    wrap.hidden=false;

    const DEFAULT_DESC="Conheça alguns dos nossos projetos e veja de perto os detalhes, acabamentos e soluções que transformam cada espaço.";
    const track=document.getElementById("featuredVideoTrack");
    const viewport=document.getElementById("videoCarouselViewport");
    const controls=document.getElementById("videoCarouselControls");
    const dotsBox=document.getElementById("vcDots");
    const prevBtn=document.getElementById("vcPrev");
    const nextBtn=document.getElementById("vcNext");
    const carousel=document.getElementById("videoCarousel");
    const playIcon='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';

    track.innerHTML=items.map((v,i)=>`<article class="vc-slide" role="group" aria-roledescription="slide" aria-label="${i+1} de ${items.length}">
      <div class="video-feature-grid">
        <div class="video-thumb-wrap" data-play="${i}" role="button" tabindex="0" aria-label="Reproduzir vídeo: ${esc(v.titulo)}">
          <img src="${esc(v.thumbnail_url || "assets/hero.jpg")}" loading="lazy" alt="${esc(v.titulo)}">
          <div class="play-btn">${playIcon}</div>
        </div>
        <div>
          <div class="eyebrow">Em vídeo</div>
          <h2>${esc(v.titulo || "Veja o nosso trabalho ganhar vida")}</h2>
          <p>${esc(v.descricao || DEFAULT_DESC)}</p>
          <div class="video-feature-label" data-play="${i}" role="button" tabindex="0">${playIcon.replace("<svg ","<svg width=\"14\" height=\"14\" fill=\"currentColor\" ")} Ver projeto em vídeo</div>
        </div>
      </div>
    </article>`).join("");

    const slides=Array.from(track.children);
    let index=0;

    function render(){
      track.style.transform=`translateX(-${index*100}%)`;
      slides.forEach((sl,i)=>{ const on=i===index; sl.setAttribute("aria-hidden",on?"false":"true"); sl.inert=!on; });
      Array.from(dotsBox.children).forEach((d,i)=>{ if(i===index) d.setAttribute("aria-current","true"); else d.removeAttribute("aria-current"); });
    }
    function go(i){ index=(i+slides.length)%slides.length; render(); }

    if(slides.length>1){
      controls.hidden=false;
      dotsBox.innerHTML=items.map((v,i)=>`<button type="button" class="vc-dot" data-go="${i}" aria-label="Ir para o vídeo ${i+1}"></button>`).join("");
      dotsBox.addEventListener("click",e=>{ const d=e.target.closest("[data-go]"); if(d) go(+d.dataset.go); });
      prevBtn.addEventListener("click",()=>go(index-1));
      nextBtn.addEventListener("click",()=>go(index+1));
      carousel.addEventListener("keydown",e=>{
        if(e.key==="ArrowLeft"){ go(index-1); }
        else if(e.key==="ArrowRight"){ go(index+1); }
      });
      // deslizar com o dedo (telemóvel / tablet)
      let sx=0, dx=0, dragging=false, moved=false;
      viewport.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse") return; dragging=true; moved=false; sx=e.clientX; dx=0; });
      viewport.addEventListener("pointermove",e=>{ if(!dragging) return; dx=e.clientX-sx; if(Math.abs(dx)>10) moved=true; });
      viewport.addEventListener("pointerup",()=>{ if(!dragging) return; dragging=false; if(Math.abs(dx)>50) go(dx<0?index+1:index-1); });
      viewport.addEventListener("pointercancel",()=>{ dragging=false; });
      // um deslize não deve abrir o vídeo
      viewport.addEventListener("click",e=>{ if(moved){ e.stopPropagation(); e.preventDefault(); moved=false; } },true);
    }

    const play=(el)=>{ const v=items[+el.dataset.play]; if(v && window.designeOpenVideo) window.designeOpenVideo(v.video_uid, v.titulo); };
    track.addEventListener("click",e=>{ const el=e.target.closest("[data-play]"); if(el) play(el); });
    track.addEventListener("keydown",e=>{
      if(e.key!=="Enter" && e.key!==" ") return;
      const el=e.target.closest("[data-play]"); if(!el) return;
      e.preventDefault(); play(el);
    });
    render();
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
    document.querySelectorAll('[data-tel-link]').forEach(a=>{ a.href = `tel:${window.DESIGNE_TELEFONE.replace(/\s/g,"")}`; if(!a.querySelector('svg')) a.textContent = window.DESIGNE_TELEFONE; });
    document.querySelectorAll('[data-fb-link]').forEach(a=>{ a.href = window.DESIGNE_FACEBOOK; });
    document.querySelectorAll('[data-maps-link]').forEach(a=>{ a.href = window.DESIGNE_MAPS; });
  }

  loadConfig().then(()=>{ loadMoveis(); loadServices(); loadProjetos(); loadFeaturedVideo(); });
})();
