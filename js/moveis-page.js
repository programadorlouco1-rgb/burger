(function(){
  const sb = window.designeSupabase;
  const box = document.getElementById("allMoveisGrid");
  if (!box) return;
  if (!sb) { box.innerHTML='<div class="products-state">Configuração do Supabase em falta.</div>'; return; }

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const money = (value) => (value == null || value === "") ? "Preço sob orçamento" : new Intl.NumberFormat("pt-AO",{style:"currency",currency:"AOA",maximumFractionDigits:0}).format(Number(value));
  const waLink = (nome) => `https://wa.me/${window.DESIGNE_WHATSAPP}?text=${encodeURIComponent("Olá, DESIGNE decoração. Vi o móvel "+nome+" no vosso site e gostaria de solicitar um orçamento.")}`;

  async function load(){
    const {data,error}=await sb.from("moveis").select("*,videos(id,titulo,video_uid)").eq("disponivel",true).order("destaque",{ascending:false}).order("created_at",{ascending:false});
    if(error){ box.innerHTML='<div class="products-state">Não foi possível carregar os móveis neste momento.</div>'; return; }
    if(!data?.length){ box.innerHTML='<div class="products-state">Ainda não há móveis publicados.</div>'; return; }

    const countEl=document.getElementById("moveisCount");
    if(countEl) countEl.textContent = data.length + (data.length===1?" móvel disponível":" móveis disponíveis");

    box.innerHTML=data.map(p=>`<article class="product-card">
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

    const lightboxItems=data.map(p=>({src:p.imagem_url || "assets/hero.jpg",alt:p.nome,title:esc(p.nome),subtitle:esc(money(p.preco)),whatsapp:waLink(p.nome)}));
    box.querySelectorAll("img[data-pid]").forEach(imgEl=>{
      imgEl.addEventListener("click",()=>{
        const i=data.findIndex(p=>String(p.id)===imgEl.dataset.pid);
        if(window.designeOpenLightbox) window.designeOpenLightbox(lightboxItems,i<0?0:i);
      });
    });
    box.querySelectorAll(".product-video-link").forEach(el=>{
      el.addEventListener("click",()=>{ if(window.designeOpenVideo) window.designeOpenVideo(el.dataset.video, el.dataset.title); });
    });
    if(window.designeAnimateNew) window.designeAnimateNew(box);
  }
  load();
})();
