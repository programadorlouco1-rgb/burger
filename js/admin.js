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
    if(menu&&side) menu.onclick=()=>side.classList.toggle("open");
    if(closeBtn&&side) closeBtn.onclick=()=>side.classList.remove("open");
    const logout=document.querySelector(".admin-logout");
    if(logout) logout.onclick=async()=>{await sb.auth.signOut();location.href="login.html"};
  };
})();
