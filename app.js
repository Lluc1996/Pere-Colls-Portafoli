/* Can Colls Disseny · portafoli — comportament compartit per a totes les pàgines */
(function(){
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) root.classList.add('no-motion');
  var clamp = function(v,a,b){ return Math.min(b, Math.max(a, v)); };
  var each = function(list, fn){ Array.prototype.forEach.call(list, fn); };
  window.CC = window.CC || {};

  /* Desplaçament suau (Lenis) */
  var lenis = null;
  if (window.Lenis && !reduce){
    lenis = new window.Lenis({lerp: .085, smoothWheel: true, wheelMultiplier: .95});
    (function raf(t){ lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    window.CC.lenis = lenis;
  }

  /* Navegació: glaçada en fer scroll, s'amaga en baixar i torna en pujar */
  var nav = document.getElementById('nav'), lastY = window.scrollY;
  function onNav(){
    if (!nav) return;
    var y = window.scrollY;
    nav.classList.toggle('is-solid', y > 40);
    if (!reduce) nav.classList.toggle('is-hidden', y > lastY && y > 400);
    lastY = y;
  }

  /* Manifest: dividir en paraules (també quan canvia l'idioma) */
  var mt = document.getElementById('manifest');
  var words = [];
  function setManifest(text){
    if (!mt) return;
    var cjk = /[぀-ヿ㐀-鿿]/.test(text);
    var parts = cjk ? (text.trim().match(/[^、。，．！？]+[、。，．！？]?/g) || [text]) : text.trim().split(/\s+/);
    mt.textContent = ''; words = [];
    parts.forEach(function(w, i){
      var s = document.createElement('span'); s.className = 'w'; s.textContent = w;
      mt.appendChild(s); if (!cjk && i < parts.length - 1) mt.appendChild(document.createTextNode(' '));
      words.push(s);
    });
    req();
  }
  window.CC = window.CC || {};
  window.CC.setManifest = setManifest;

  /* Escenes de scroll */
  var scenes = Array.prototype.slice.call(document.querySelectorAll('[data-scene]'));
  var speedEls = Array.prototype.slice.call(document.querySelectorAll('[data-speed]'));
  var hss = Array.prototype.slice.call(document.querySelectorAll('.hscroll'));
  var pinH = window.matchMedia('(min-width: 761px)');

  function sizeH(){
    if (!hss.length) return;
    if (reduce || !pinH.matches){ root.classList.add('no-pin'); hss.forEach(function(h){ h.style.height = ''; }); return; }
    root.classList.remove('no-pin');
    hss.forEach(function(h){
      var tr = h.querySelector('.track');
      var dist = Math.max(0, tr.scrollWidth - window.innerWidth);
      h.style.height = (window.innerHeight + dist) + 'px';
      h.dataset.dist = dist;
    });
  }

  function progress(el){
    var r = el.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    if (total <= 0) return r.top < 0 ? 1 : 0;
    return clamp(-r.top / total, 0, 1);
  }

  var ticking = false;
  function render(){
    ticking = false;
    onNav();
    if (reduce) return;
    var y = window.scrollY;
    if (y < window.innerHeight * 1.5){
      speedEls.forEach(function(el){
        el.style.transform = 'translate3d(0,' + (y * parseFloat(el.dataset.speed)).toFixed(1) + 'px,0)';
      });
    }
    scenes.forEach(function(el){
      var r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > window.innerHeight + 50) return;
      var p = progress(el), kind = el.dataset.scene;
      if (kind === 'grow'){
        el.style.setProperty('--p', clamp(p * 1.35, 0, 1).toFixed(3));
      } else if (kind === 'words'){
        var lit = clamp((p - .08) / .7, 0, 1) * words.length;
        for (var i = 0; i < words.length; i++){
          var o = clamp(lit - i, 0, 1);
          words[i].style.setProperty('--o', (0.24 + o * 0.76).toFixed(2));
        }
      } else if (kind === 'hscroll' && !root.classList.contains('no-pin')){
        var dist = parseFloat(el.dataset.dist || 0);
        el.querySelector('.track').style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
        el.style.setProperty('--hp', p.toFixed(3));
      }
    });
  }
  function req(){ if (!ticking){ ticking = true; requestAnimationFrame(render); } }
  window.addEventListener('scroll', req, {passive:true});
  window.addEventListener('resize', function(){ sizeH(); req(); });
  sizeH(); render();

  /* Salts: sempre a l'inici de la pàgina o just a la capçalera de l'apartat */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function targetOf(id){
    var el = id && document.getElementById(id);
    if (!el) return null;
    return el.querySelector(':scope > .cat') || el;
  }
  function jump(id, smooth){
    var t = targetOf(id);
    var y = t ? t.getBoundingClientRect().top + window.scrollY : 0;
    var top = Math.max(0, Math.round(y));
    if (lenis) lenis.scrollTo(top, {immediate: !smooth, force: true, duration: 1.4});
    else window.scrollTo({top: top, behavior: smooth && !reduce ? 'smooth' : 'instant'});
  }
  var initial = decodeURIComponent((location.hash || '').slice(1));
  if (mt) setManifest(mt.textContent);
  sizeH(); jump(initial, false); req();
  window.addEventListener('load', function(){
    sizeH();
    if (initial){
      var userMoved = false;
      ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function(ev){ window.addEventListener(ev, function(){ userMoved = true; }, {passive:true, once:true}); });
      var settleJump = function(){
        if (userMoved) return;
        sizeH();
        var t = targetOf(initial); if (!t) return;
        var y = Math.max(0, Math.round(t.getBoundingClientRect().top + window.scrollY));
        window.scrollTo(0, y);
        if (lenis){ lenis.resize && lenis.resize(); lenis.scrollTo(y, {immediate: true, force: true}); }
      };
      settleJump();
      [250, 700, 1400, 2400].forEach(function(ms){ setTimeout(settleJump, ms); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(settleJump);
    }
    req();
  });
  window.addEventListener('hashchange', function(){ jump(decodeURIComponent(location.hash.slice(1)), true); });
  var here = location.pathname.split('/').pop() || '';
  document.addEventListener('click', function(e){
    var a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var href = a.getAttribute('href'), i = href.indexOf('#');
    if (i < 0) return;
    var page = href.slice(0, i), id = href.slice(i + 1);
    if (page && page !== here) return;
    if (!id){ return; }
    if (!document.getElementById(id)) return;
    e.preventDefault();
    jump(id, true);
    try { history.replaceState(null, '', '#' + id); } catch(err){}
  });

  /* Menú de vidre: píndola que llisca i panell que canvia de forma */
  var menu = document.getElementById('menu');
  if (menu){
    var bar = menu.querySelector('.menu-bar'), pill = menu.querySelector('.menu-pill');
    var panel = menu.querySelector('.menu-panel'), items = menu.querySelectorAll('.menu-bar a');
    var current = menu.querySelector('.menu-bar a[aria-current="page"]');
    var closeT = null, hoverable = window.matchMedia('(hover: hover) and (min-width: 861px)');
    function lightUp(a){
      each(items, function(x){ x.classList.toggle('is-lit', x === a); });
      if (!a){ pill.style.opacity = '0'; return; }
      pill.style.opacity = '1';
      pill.style.width = a.offsetWidth + 'px';
      pill.style.height = a.offsetHeight + 'px';
      pill.style.transform = 'translate(' + a.offsetLeft + 'px,' + a.offsetTop + 'px)';
    }
    function show(a){
      clearTimeout(closeT);
      lightUp(a);
      if (!hoverable.matches) return;
      var mp = document.getElementById(a.dataset.panel);
      if (!mp) return;
      each(panel.querySelectorAll('.mp'), function(x){ x.classList.toggle('on', x === mp); });
      panel.style.setProperty('--mw', mp.offsetWidth + 'px');
      panel.style.setProperty('--mh', mp.offsetHeight + 'px');
      menu.classList.add('is-open');
    }
    function hide(){
      closeT = setTimeout(function(){ menu.classList.remove('is-open'); lightUp(current); }, 160);
    }
    each(items, function(a){
      a.addEventListener('mouseenter', function(){ show(a); });
      a.addEventListener('focus', function(){ show(a); });
    });
    menu.addEventListener('mouseleave', hide);
    panel.addEventListener('mouseenter', function(){ clearTimeout(closeT); });
    menu.addEventListener('focusout', function(e){ if (!menu.contains(e.relatedTarget)) hide(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ menu.classList.remove('is-open'); lightUp(current); } });
    pill.style.transition = 'none'; lightUp(current); void pill.offsetWidth; pill.style.transition = '';
    window.addEventListener('resize', function(){ lightUp(current); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ lightUp(current); });
    window.CC.relayoutMenu = function(){ lightUp(current); };

    /* Mòbil: el botó Menú obre la llista vertical */
    var toggle = document.getElementById('menu-toggle');
    if (toggle && nav){
      function setOpen(v){ nav.classList.toggle('menu-open', v); toggle.setAttribute('aria-expanded', v ? 'true' : 'false'); if (v){ lightUp(current); } else { menu.classList.remove('is-open'); } }
      toggle.addEventListener('click', function(e){ e.stopPropagation(); var v = !nav.classList.contains('menu-open'); setOpen(v); if (v && e.detail === 0 && items[0]) setTimeout(function(){ items[0].focus(); }, 60); });
      document.addEventListener('click', function(e){ if (nav.classList.contains('menu-open') && !menu.contains(e.target)) setOpen(false); });
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape') setOpen(false); });
      each(items, function(a){ a.addEventListener('click', function(){ setOpen(false); }); });
    }
  }

  /* Revelat suau: només elements que comencen per sota del plec */
  if (!reduce && 'IntersectionObserver' in window){
    var targets = document.querySelectorAll('.case-head > *, .gal figure, .card, .col, .receipt, .steps li, .pass, .about-photo, .values div, .index-head, .sels li, .work-intro, .ig, .soon-list li, .next-links li');
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ e.target.classList.add('rv-in'); e.target.classList.remove('rv-pending'); io.unobserve(e.target); }
      });
    }, {rootMargin:'0px 0px -8% 0px'});
    var vh = window.innerHeight;
    each(targets, function(el){
      if (el.getBoundingClientRect().top > vh){
        var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) % 3 : 0;
        el.style.setProperty('--d', (sib * 0.08) + 's');
        el.classList.add('rv-pending');
        io.observe(el);
      }
    });
  }

  /* Filtre de carpetes */
  var tabs = document.querySelectorAll('.tab');
  var cards = document.querySelectorAll('#grid .card');
  each(tabs, function(t){
    t.addEventListener('click', function(){
      var f = t.dataset.f;
      each(tabs, function(o){ o.setAttribute('aria-pressed', o === t ? 'true' : 'false'); });
      each(cards, function(c){
        var show = f === 'tot' || c.dataset.cat.split(' ').indexOf(f) > -1;
        c.hidden = !show;
        c.classList.remove('is-in', 'rv-pending');
        if (show && !reduce){ void c.offsetWidth; c.classList.add('is-in'); }
      });
    });
  });

  /* Visor d'imatges */
  var lb = document.getElementById('lb');
  if (lb){
    var lbImg = document.getElementById('lb-img'), lbCap = document.getElementById('lb-cap');
    document.addEventListener('click', function(e){
      var b = e.target.closest('.gal button, .poster button');
      if (!b || !lb.showModal) return;
      var img = b.querySelector('img'), cap = b.parentElement.querySelector('figcaption');
      lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt;
      lbCap.textContent = cap ? cap.textContent : img.alt;
      lb.showModal();
    });
    document.getElementById('lb-close').addEventListener('click', function(){ lb.close(); });
    lb.addEventListener('click', function(e){ if (e.target === lb) lb.close(); });
  }

  /* Carrusels tipus Instagram */
  each(document.querySelectorAll('.ig'), function(ig){
    var box = ig.querySelector('.ig-slides'), n = box.children.length;
    var dots = ig.querySelector('.ig-dots'), prev = ig.querySelector('.ig-prev'), next = ig.querySelector('.ig-next');
    for (var i = 0; i < n; i++) dots.appendChild(document.createElement('i'));
    function idx(){ return Math.round(box.scrollLeft / Math.max(1, box.clientWidth)); }
    function sync(){
      var k = idx();
      each(dots.children, function(d, j){ d.classList.toggle('on', j === k); });
      prev.disabled = k <= 0; next.disabled = k >= n - 1;
    }
    function go(d){ box.scrollTo({left:(idx() + d) * box.clientWidth, behavior: reduce ? 'auto' : 'smooth'}); }
    prev.addEventListener('click', function(){ go(-1); });
    next.addEventListener('click', function(){ go(1); });
    box.addEventListener('scroll', function(){ requestAnimationFrame(sync); }, {passive:true});
    box.addEventListener('keydown', function(e){ if (e.key === 'ArrowRight'){ e.preventDefault(); go(1); } else if (e.key === 'ArrowLeft'){ e.preventDefault(); go(-1); } });
    sync();
  });

  /* Copiar el correu */
  function tr(s){ return window.CCI18N && window.CCI18N.t ? window.CCI18N.t(s) : s; }
  var copyBtn = document.getElementById('copy');
  if (copyBtn){
    var copied = document.getElementById('copied'), mail = document.getElementById('mail');
    copyBtn.addEventListener('click', function(){
      var txt = mail.textContent.trim();
      function selectIt(){
        var r = document.createRange(); r.selectNodeContents(mail);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        copied.textContent = tr('Seleccionat: prem Ctrl+C per copiar-lo');
      }
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt).then(function(){ copied.textContent = tr('Correu copiat'); }, selectIt);
      } else { selectIt(); }
    });
  }

})();

