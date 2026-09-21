/* Cokylicious — painel administrativo: casca (menu lateral + topo), utilitários e uploads. */
(function(){
  const sb=window.designeSupabase;

  window.adminToast=function(message,type="success"){
    let t=document.querySelector(".toast"); if(t)t.remove();
    t=document.createElement("div"); t.className="toast "+type; t.textContent=message; document.body.appendChild(t);
    setTimeout(()=>t.remove(),4000);
  };
  window.formatKz=function(v){return v==null||v===""?"Sem preço":String(Math.round(Number(v))).replace(/\B(?=(\d{3})+(?!\d))/g,".")+" Kz"};
  window.escapeHtml=function(v){return String(v??"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))};

  window.uploadImage=async function(file,bucket,folder){
    if(!file) return null;
    const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
    const path=`${folder||"uploads"}/${crypto.randomUUID()}.${ext}`;
    const {error}=await sb.storage.from(bucket).upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type||"image/jpeg"});
    if(error) throw error;
    const {data}=sb.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };
  window.deleteImageByUrl=async function(url,bucket){
    try{
      const marker=`/${bucket}/`;
      const i=url.indexOf(marker); if(i<0)return;
      const path=decodeURIComponent(url.slice(i+marker.length).split("?")[0]);
      await sb.storage.from(bucket).remove([path]);
    }catch(e){}
  };

  /* ---- ícones (sprite) ---- */
  const SPRITE="<svg xmlns='http://www.w3.org/2000/svg' width='0' height='0' style='position:absolute' aria-hidden='true' focusable='false'>"+
    "<symbol id='i-dashboard' viewBox='0 0 24 24'><rect x='3' y='3' width='7' height='9' rx='1'/><rect x='14' y='3' width='7' height='5' rx='1'/><rect x='14' y='12' width='7' height='9' rx='1'/><rect x='3' y='16' width='7' height='5' rx='1'/></symbol>"+
    "<symbol id='i-utensils' viewBox='0 0 24 24'><path d='M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2'/><path d='M7 2v20'/><path d='M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7'/></symbol>"+
    "<symbol id='i-list' viewBox='0 0 24 24'><line x1='8' x2='21' y1='6' y2='6'/><line x1='8' x2='21' y1='12' y2='12'/><line x1='8' x2='21' y1='18' y2='18'/><line x1='3' x2='3.01' y1='6' y2='6'/><line x1='3' x2='3.01' y1='12' y2='12'/><line x1='3' x2='3.01' y1='18' y2='18'/></symbol>"+
    "<symbol id='i-tag' viewBox='0 0 24 24'><path d='M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z'/><circle cx='7.5' cy='7.5' r='.5' fill='currentColor'/></symbol>"+
    "<symbol id='i-image' viewBox='0 0 24 24'><rect width='18' height='18' x='3' y='3' rx='2' ry='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/></symbol>"+
    "<symbol id='i-message' viewBox='0 0 24 24'><path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/></symbol>"+
    "<symbol id='i-settings' viewBox='0 0 24 24'><path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'/><circle cx='12' cy='12' r='3'/></symbol>"+
    "<symbol id='i-log-out' viewBox='0 0 24 24'><path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'/><polyline points='16 17 21 12 16 7'/><line x1='21' x2='9' y1='12' y2='12'/></symbol>"+
    "<symbol id='i-star' viewBox='0 0 24 24'><path d='M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z'/></symbol>"+
    "<symbol id='i-x' viewBox='0 0 24 24'><path d='M18 6 6 18'/><path d='m6 6 12 12'/></symbol>"+
    "<symbol id='i-menu' viewBox='0 0 24 24'><line x1='4' x2='20' y1='12' y2='12'/><line x1='4' x2='20' y1='6' y2='6'/><line x1='4' x2='20' y1='18' y2='18'/></symbol>"+
    "<symbol id='i-external' viewBox='0 0 24 24'><path d='M7 7h10v10'/><path d='M7 17 17 7'/></symbol>"+
    "<symbol id='i-arrow-left' viewBox='0 0 24 24'><path d='m12 19-7-7 7-7'/><path d='M19 12H5'/></symbol>"+
    "<symbol id='i-upload' viewBox='0 0 24 24'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='17 8 12 3 7 8'/><line x1='12' x2='12' y1='3' y2='15'/></symbol>"+
    "<symbol id='i-user-plus' viewBox='0 0 24 24'><path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><line x1='19' x2='19' y1='8' y2='14'/><line x1='22' x2='16' y1='11' y2='11'/></symbol>"+
    "<symbol id='i-trash' viewBox='0 0 24 24'><path d='M3 6h18'/><path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6'/><path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'/></symbol>"+
    "<symbol id='i-shuffle' viewBox='0 0 24 24'><path d='m18 14 4 4-4 4'/><path d='m18 2 4 4-4 4'/><path d='M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22'/><path d='M2 6h1.972a4 4 0 0 1 3.6 2.2'/><path d='M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45'/></symbol>"+
    "</svg>";

  const NAV=[
    ["dashboard","index.html","i-dashboard","Dashboard"],
    ["produtos","produtos.html","i-utensils","Produtos"],
    ["categorias","categorias.html","i-list","Categorias"],
    ["combos","combos.html","i-tag","Combos"],
    ["galeria","galeria.html","i-image","Galeria"],
    ["avaliacoes","avaliacoes.html","i-message","Avaliações"],
    ["configuracoes","configuracoes.html","i-settings","Configurações"]
  ];
  const ic=id=>`<svg class='icon' aria-hidden='true'><use href='#${id}'/></svg>`;

  // Preenche <aside class="admin-sidebar"> e <header class="admin-topbar"> de cada página.
  window.initAdminUI=async function(active,title){
    if(!document.getElementById("i-dashboard")) document.body.insertAdjacentHTML("afterbegin",SPRITE);
    const session=await window.designeRequireAdmin(); if(!session)return;
    const side=document.querySelector(".admin-sidebar"), top=document.querySelector(".admin-topbar");
    if(side) side.innerHTML=
      `<div class="admin-brand"><b>COKY</b>LICIOUS<small>Painel</small></div>`+
      `<button class="sidebar-close" aria-label="Fechar menu">${ic("i-x")}</button>`+
      `<nav class="admin-nav">${NAV.map(n=>`<a href="${n[1]}" data-page="${n[0]}">${ic(n[2])} <span>${n[3]}</span></a>`).join("")}</nav>`+
      `<button class="admin-logout">${ic("i-log-out")} <span>Sair</span></button>`;
    if(top) top.innerHTML=
      `<div style="display:flex;align-items:center;gap:12px"><button class="mobile-menu" aria-label="Menu">${ic("i-menu")}</button><div><h1>${escapeHtml(title||"")}</h1><small data-admin-email></small></div></div>`+
      `<a class="btn btn-secondary" href="../index.html">Ver site ${ic("i-external")}</a>`;

    const nav=document.querySelector(".admin-nav");
    if(nav) nav.querySelectorAll("a").forEach(a=>a.classList.toggle("active",a.dataset.page===active));
    const email=document.querySelector("[data-admin-email]"); if(email) email.textContent=session.user.email||"Administrador";
    const menu=document.querySelector(".mobile-menu"), closeBtn=document.querySelector(".sidebar-close");
    let backdrop=document.querySelector(".sidebar-backdrop");
    if(!backdrop){backdrop=document.createElement("div");backdrop.className="sidebar-backdrop";document.body.appendChild(backdrop)}
    const setMenu=open=>{if(side)side.classList.toggle("open",open);backdrop.classList.toggle("show",open)};
    if(menu&&side) menu.onclick=()=>setMenu(!side.classList.contains("open"));
    if(closeBtn&&side) closeBtn.onclick=()=>setMenu(false);
    backdrop.onclick=()=>setMenu(false);
    document.addEventListener("keydown",e=>{if(e.key==="Escape")setMenu(false)});
    const logout=document.querySelector(".admin-logout");
    if(logout) logout.onclick=async()=>{await sb.auth.signOut();location.href="login.html"};
    return session;
  };
})();

/* Seletor de ficheiro: esconde o botão nativo "Escolher arquivo" e mostra um botão com ícone. */
(function(){
  const valueDesc=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value");
  let seq=0;
  function enhance(input){
    if(input.dataset.enhanced) return; input.dataset.enhanced="1";
    if(!input.id) input.id="file-input-"+(++seq);
    const wrap=document.createElement("div"); wrap.className="file-picker";
    input.parentNode.insertBefore(wrap,input); wrap.appendChild(input);
    const btn=document.createElement("label"); btn.className="file-btn"; btn.htmlFor=input.id;
    btn.innerHTML="<svg class='icon' aria-hidden='true'><use href='#i-upload'/></svg><span>Escolher imagem</span>";
    const name=document.createElement("span"); name.className="file-name";
    wrap.appendChild(btn); wrap.appendChild(name);
    function update(){
      const n=input.files?input.files.length:0;
      name.textContent=n===0?"Nenhum ficheiro selecionado":(n===1?input.files[0].name:n+" ficheiros");
      name.title=n===1?input.files[0].name:"";
      wrap.classList.toggle("has-file",n>0);
      btn.querySelector("span").textContent=n>0?"Trocar imagem":"Escolher imagem";
    }
    input.addEventListener("change",update);
    if(input.form) input.form.addEventListener("reset",()=>setTimeout(update,0));
    // quando o código da página limpa o campo (input.value=""), atualiza o texto também
    Object.defineProperty(input,"value",{configurable:true,get(){return valueDesc.get.call(this)},set(v){valueDesc.set.call(this,v);update()}});
    update();
  }
  window.enhanceFileInputs=function(root){(root||document).querySelectorAll("input[type=file]").forEach(enhance)};
})();

/* Etiquetas nas células das tabelas (usadas na vista de cartões em ecrãs pequenos). */
(function(){
  function label(){
    document.querySelectorAll(".admin-table").forEach(t=>{
      const heads=[...t.querySelectorAll("thead th")].map(th=>th.textContent.trim());
      t.querySelectorAll("tbody tr").forEach(tr=>{
        if(tr.children.length!==heads.length) return;
        [...tr.children].forEach((td,i)=>{ if(heads[i] && td.getAttribute("data-label")!==heads[i]) td.setAttribute("data-label",heads[i]); });
      });
    });
  }
  new MutationObserver(label).observe(document.body,{childList:true,subtree:true});
  label();
})();
