window.designeWaLinkProjeto = function(titulo){
  return `https://wa.me/${window.DESIGNE_WHATSAPP}?text=${encodeURIComponent("Olá, DESIGNE decoração. Vi o projeto '"+titulo+"' no vosso site e gostaria de solicitar um orçamento.")}`;
};

// Liga os cliques de um conjunto de cartões de projeto (imagem -> abre modal do projeto; ícone de vídeo -> abre player)
window.designeAttachProjetoHandlers = function(container, list){
  container.querySelectorAll("img[data-projeto]").forEach(imgEl=>{
    imgEl.addEventListener("click",()=>{
      const item=list.find(w=>String(w.id)===imgEl.dataset.projeto);
      if(item && window.designeOpenProject) window.designeOpenProject(item);
    });
  });
  container.querySelectorAll("[data-projeto-video]").forEach(el=>{
    el.addEventListener("click",(e)=>{
      e.stopPropagation();
      const item=list.find(w=>String(w.id)===el.dataset.projetoVideo);
      if(item?.videos?.video_uid && window.designeOpenVideo) window.designeOpenVideo(item.videos.video_uid, item.titulo);
    });
  });
};
