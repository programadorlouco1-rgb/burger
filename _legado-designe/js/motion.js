/* Animações de entrada, parallax leve do hero e indicador de secção ativa no menu.
   Respeita prefers-reduced-motion e não interfere com IDs/estrutura existentes. */
(function(){
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     1) Reveal ao rolar (fade + leve translateY), com stagger
     ---------------------------------------------------------- */
  var revealSelectors = [
    '.section-head', '.big-copy', '.stats',
    '.hero-visual',
    '.why-visual', '.points',
    '.quote-intro', '.quote-form',
    '.video-feature-grid > *',
    '.cta-inner > *',
    '.contact-grid', '.map'
  ];
  var groupSelectors = ['.services', '.products-grid', '.gallery', '.process'];

  function tagStatic(){
    revealSelectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        if(!el.hasAttribute('data-animate') && !el.closest('[data-animate]')) el.setAttribute('data-animate','');
      });
    });
    groupSelectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        if(!el.hasAttribute('data-animate-group')) el.setAttribute('data-animate-group','');
      });
    });
  }

  var io;
  function observe(el){
    if(reduceMotion){ el.classList.add('in-view'); return; }
    if(!io) return;
    io.observe(el);
  }

  function initObserver(){
    if(reduceMotion) return;
    io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.14, rootMargin:'0px 0px -6% 0px'});
  }

  function observeAll(root){
    (root||document).querySelectorAll('[data-animate]:not(.in-view)').forEach(observe);
    (root||document).querySelectorAll('[data-animate-group]:not(.in-view)').forEach(observe);
  }

  // Exposto para o conteúdo carregado do Supabase (public.js, moveis-page.js, projetos-page.js)
  window.designeAnimateNew = function(container){
    if(!container) return;
    if(!container.hasAttribute('data-animate-group')) container.setAttribute('data-animate-group','');
    container.classList.remove('in-view');
    if(reduceMotion){ container.classList.add('in-view'); return; }
    requestAnimationFrame(function(){ observe(container); });
  };

  initObserver();
  tagStatic();
  observeAll();

  // Reforço: grids preenchidos de forma assíncrona pelo Supabase acabam por ganhar
  // filhos depois do primeiro varrimento — este observer trata isso sem duplicar código.
  var dynamicGrids = ['publicMoveis','publicServices','publicGallery','allMoveisGrid','allGalleryGrid'];
  if('MutationObserver' in window){
    dynamicGrids.forEach(function(id){
      var el = document.getElementById(id);
      if(!el) return;
      var mo = new MutationObserver(function(){ window.designeAnimateNew(el); });
      mo.observe(el, {childList:true});
    });
  }

  /* ----------------------------------------------------------
     2) Indicador de secção ativa no menu
     ---------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('nav a[href*="#"]'));
  var sectionIds = ['inicio','moveis','projetos','sobre','contactos'];
  if(navLinks.length && 'IntersectionObserver' in window){
    var sections = sectionIds.map(function(id){ return document.getElementById(id); }).filter(Boolean);
    if(sections.length){
      var spy = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(!entry.isIntersecting) return;
          var id = entry.target.id;
          navLinks.forEach(function(a){
            var hash = a.getAttribute('href').split('#')[1];
            a.classList.toggle('active', hash===id);
          });
        });
      }, {rootMargin:'-45% 0px -50% 0px', threshold:0});
      sections.forEach(function(s){ spy.observe(s); });
    }
  }

  /* ----------------------------------------------------------
     3) Parallax muito leve na imagem do hero (desligado em mobile/reduced-motion)
     ---------------------------------------------------------- */
  var heroImg = document.querySelector('.hero-visual-img img');
  var isMobile = window.matchMedia && window.matchMedia('(max-width: 1000px)').matches;
  if(heroImg && !reduceMotion && !isMobile){
    var ticking = false;
    window.addEventListener('scroll', function(){
      if(ticking) return;
      ticking = true;
      requestAnimationFrame(function(){
        var y = Math.min(window.scrollY, 700);
        heroImg.style.transform = 'translateY(' + (y*0.06) + 'px) scale(1.06)';
        ticking = false;
      });
    }, {passive:true});
  }

  /* ----------------------------------------------------------
     4) Entrada suave dos elementos do hero ao carregar a página
     ---------------------------------------------------------- */
  if(!reduceMotion){
    var heroBits = document.querySelectorAll('.hero-content .eyebrow, .hero-content h1, .hero-content .hero-copy, .hero-content .actions, .hero-content .hero-meta, .hero-visual');
    heroBits.forEach(function(el,i){
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1)';
      setTimeout(function(){
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 90 + i*90);
    });
  }
})();
