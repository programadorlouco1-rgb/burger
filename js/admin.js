(function(){
  const sb=window.designeSupabase;
  window.adminToast=function(message,type="success"){
    let t=document.querySelector(".toast"); if(t)t.remove();
    t=document.createElement("div"); t.className="toast "+type; t.textContent=message; document.body.appendChild(t);
    setTimeout(()=>t.remove(),4000);
  };
  window.formatKz=function(v){return v==null||v===""?"Sob orçamento":new Intl.NumberFormat("pt-AO",{style:"currency",currency:"AOA",maximumFractionDigits:0}).format(Number(v))};
  window.escapeHtml=function(v){return String(v??"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))};
  window.slugify=function(s){return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")};
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
  window.initAdminUI=async function(active){
    const session=await window.designeRequireAdmin(); if(!session)return;
    const nav=document.querySelector(".admin-nav");
    if(nav) nav.querySelectorAll("a").forEach(a=>a.classList.toggle("active",a.dataset.page===active));
    const email=document.querySelector("[data-admin-email]"); if(email) email.textContent=session.user.email||"Administrador";
    const menu=document.querySelector(".mobile-menu"), side=document.querySelector(".admin-sidebar"), closeBtn=document.querySelector(".sidebar-close");
    let backdrop=document.querySelector(".sidebar-backdrop");
    if(!backdrop){backdrop=document.createElement("div");backdrop.className="sidebar-backdrop";document.body.appendChild(backdrop)}
    const setMenu=open=>{if(side)side.classList.toggle("open",open);backdrop.classList.toggle("show",open)};
    if(menu&&side) menu.onclick=()=>setMenu(!side.classList.contains("open"));
    if(closeBtn&&side) closeBtn.onclick=()=>setMenu(false);
    backdrop.onclick=()=>setMenu(false);
    document.addEventListener("keydown",e=>{if(e.key==="Escape")setMenu(false)});
    const logout=document.querySelector(".admin-logout");
    if(logout) logout.onclick=async()=>{await sb.auth.signOut();location.href="login.html"};
  };
})();

/* Seletor de ficheiro profissional: esconde o botão nativo "Escolher arquivo" e mostra um botão com ícone. */
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
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>window.enhanceFileInputs());
  else window.enhanceFileInputs();
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

