// Cromo partilhado do site (cabeçalho, menu mobile, botão topo)
(function(){
  const header=document.getElementById('header');
  const menu=document.getElementById('menu');
  const mobile=document.getElementById('mobile');
  const backTop=document.getElementById('backTop');
  const quickCall=document.getElementById('quickCall');
  const quickWa=document.getElementById('quickWa');

  if(header) window.addEventListener('scroll',()=>{
    header.classList.toggle('scrolled',scrollY>30);
    if(backTop) backTop.classList.toggle('visible',scrollY>300);
    if(quickCall) quickCall.classList.toggle('visible',scrollY>300);
    if(quickWa) quickWa.classList.toggle('visible',scrollY>300);
  },{passive:true});

  if(menu && mobile){
    menu.addEventListener('click',()=>{
      const open=mobile.classList.contains('open');
      mobile.classList.toggle('open',!open);
      document.body.style.overflow=open?'':'hidden';
    });
    mobile.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      mobile.classList.remove('open'); document.body.style.overflow='';
    }));
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape' && mobile.classList.contains('open')){
        mobile.classList.remove('open'); document.body.style.overflow='';
      }
    });
  }

  if(backTop) backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
})();

/* lightbox — visualização completa da imagem, com avançar/recuar quando há uma lista */
(function(){
  const box=document.getElementById('lightbox');
  if(!box) return;
  const img=document.getElementById('lightboxImg');
  const caption=document.getElementById('lightboxCaption');
  const prevBtn=document.getElementById('lightboxPrev');
  const nextBtn=document.getElementById('lightboxNext');
  const closeBtn=document.getElementById('lightboxClose');
  const interestBtn=document.getElementById('lightboxInterest');
  let items=[]; let index=0;

  function render(){
    const it=items[index]; if(!it) return;
    img.src=it.src; img.alt=it.alt||'';
    caption.innerHTML=it.title?`<strong>${it.title}</strong>${it.subtitle||''}`:(it.subtitle||'');
    const nav=items.length>1;
    prevBtn.hidden=!nav; nextBtn.hidden=!nav;
    if(interestBtn){
      if(it.whatsapp){ interestBtn.href=it.whatsapp; interestBtn.hidden=false; }
      else{ interestBtn.hidden=true; interestBtn.removeAttribute('href'); }
    }
  }
  function open(list,startIndex){
    items=list||[]; index=((startIndex||0)+items.length)%items.length;
    if(interestBtn){ interestBtn.hidden=true; interestBtn.removeAttribute('href'); }
    render();
    box.classList.add('open'); box.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  }
  function close(){
    box.classList.remove('open'); box.setAttribute('aria-hidden','true'); document.body.style.overflow='';
  }
  window.designeOpenLightbox=open;
  closeBtn.addEventListener('click',close);
  box.addEventListener('click',e=>{ if(e.target===box) close(); });
  prevBtn.addEventListener('click',()=>{ index=(index-1+items.length)%items.length; render(); });
  nextBtn.addEventListener('click',()=>{ index=(index+1)%items.length; render(); });
  document.addEventListener('keydown',e=>{
    if(!box.classList.contains('open')) return;
    if(e.key==='Escape') close();
    if(e.key==='ArrowLeft') prevBtn.click();
    if(e.key==='ArrowRight') nextBtn.click();
  });

  // Serviços e a imagem "Sobre" abrem em vista única (sem navegação entre eles).
  document.addEventListener('click',e=>{
    const s=e.target.closest('.service-photo');
    if(s){ open([{src:s.currentSrc||s.src,alt:s.alt}],0); return; }
    const w=e.target.closest('.why-visual img');
    if(w){ open([{src:w.currentSrc||w.src,alt:w.alt}],0); return; }
  });
})();

/* modal de vídeo — carrega o player apenas quando o visitante clica (lazy) */
(function(){
  const modal=document.getElementById('videoModal');
  if(!modal) return;
  const inner=document.getElementById('videoModalInner');
  const closeBtn=document.getElementById('videoModalClose');
  function open(videoUid,title){
    if(!videoUid) return;
    const src=window.resolveVideoEmbedUrl ? window.resolveVideoEmbedUrl(videoUid) : videoUid;
    if(!src){ alert('Link de vídeo inválido.'); return; }
    inner.innerHTML=`<iframe src="${src}" title="${(title||'Vídeo').replace(/"/g,'&quot;')}" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" loading="lazy"></iframe>`;
    modal.classList.add('open'); document.body.style.overflow='hidden';
  }
  function close(){
    modal.classList.remove('open'); inner.innerHTML=''; document.body.style.overflow='';
  }
  window.designeOpenVideo=open;
  closeBtn.addEventListener('click',close);
  modal.addEventListener('click',e=>{ if(e.target===modal) close(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && modal.classList.contains('open')) close(); });
})();

/* modal de projeto — mostra capa, descrição, galeria de fotos e vídeo do projeto */
(function(){
  const modal=document.getElementById('projectModal');
  if(!modal) return;
  const sb = window.designeSupabase;
  const card=document.getElementById('projectModalCard');
  const closeBtn=document.getElementById('projectModalClose');
  const esc=(v)=>String(v??"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  async function open(projeto){
    let fotos=[];
    if(sb){
      const {data}=await sb.from('projeto_fotos').select('*').eq('projeto_id',projeto.id).order('ordem',{ascending:true});
      fotos=data||[];
    }
    const waLink = window.designeWaLinkProjeto ? window.designeWaLinkProjeto(projeto.titulo) : `https://wa.me/${window.DESIGNE_WHATSAPP}`;
    card.innerHTML=`
      <img class="project-modal-cover" src="${esc(projeto.imagem_capa_url||'assets/hero.jpg')}" alt="${esc(projeto.titulo)}">
      <div class="project-modal-body">
        <div class="eyebrow">${esc(projeto.categoria||'Projeto')}</div>
        <h2>${esc(projeto.titulo)}</h2>
        ${projeto.descricao?`<p class="desc">${esc(projeto.descricao)}</p>`:""}
        <div class="actions" style="margin-top:26px">
          <a class="btn btn-outline-dark" target="_blank" rel="noopener" href="${waLink}">Solicitar orçamento <svg class='icon' aria-hidden='true'><use href='#i-external'/></svg></a>
          ${projeto.videos?.video_uid?`<button class="btn btn-gold" type="button" id="projectVideoBtn"><svg class='icon icon-fill' aria-hidden='true'><use href='#i-play'/></svg> Veja este projeto em vídeo</button>`:""}
        </div>
        ${fotos.length?`<div class="project-photos">${fotos.map(f=>`<img src="${esc(f.imagem_url)}" alt="${esc(projeto.titulo)}" data-src="${esc(f.imagem_url)}">`).join("")}</div>`:""}
      </div>`;
    modal.classList.add('open'); document.body.style.overflow='hidden';
    const videoBtn=document.getElementById('projectVideoBtn');
    if(videoBtn) videoBtn.addEventListener('click',()=>{ if(window.designeOpenVideo) window.designeOpenVideo(projeto.videos.video_uid, projeto.titulo); });
    card.querySelectorAll('.project-photos img').forEach((imgEl,i)=>{
      imgEl.addEventListener('click',()=>{
        const list=[{src:projeto.imagem_capa_url||'assets/hero.jpg',alt:projeto.titulo,title:esc(projeto.titulo)}].concat(fotos.map(f=>({src:f.imagem_url,alt:projeto.titulo})));
        if(window.designeOpenLightbox) window.designeOpenLightbox(list,i+1);
      });
    });
  }
  function close(){ modal.classList.remove('open'); document.body.style.overflow=''; card.innerHTML=''; }
  window.designeOpenProject=open;
  closeBtn.addEventListener('click',close);
  modal.addEventListener('click',e=>{ if(e.target===modal) close(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && modal.classList.contains('open')) close(); });
})();
