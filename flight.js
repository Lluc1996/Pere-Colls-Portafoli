/* Can Colls Disseny · el vol de la portada (fotos reals)
   1. La finestra amb en Pere, de prop; la càmera s'allunya suaument.
   2. Un núvol passa per davant de la càmera i amaga el canvi de foto.
   3. Surt l'avió sencer, que continua allunyant-se, i acaba fent-se postal al costat de "La marca". */
(function(){
  var sec = document.getElementById('vol');
  if (!sec) return;
  var root = document.documentElement;
  var stage = sec.querySelector('.fl-stage'), sky = document.getElementById('fl-sky');
  var card = document.getElementById('fl-card'), mark = document.getElementById('fl-mark');
  var slot = document.getElementById('fl-slot'), brand = document.getElementById('fl-brand');
  var liv = document.getElementById('fl-livery'), liv3 = sec.querySelector('.fl-liv3');
  var fades = sec.querySelectorAll('.fl-fade');
  var cloudCv = document.getElementById('fl-cloud'), haze = document.getElementById('fl-haze');

  var L1 = {el: document.getElementById('fl-l1'), w: 1667, h: 943, ax: 1181, ay: 484, s: 396};
  var L3 = {el: document.getElementById('fl-l3'), w: 1670, h: 942, ax: 868, ay: 520};

  var W = 0, H = 0, mobile = false, slotR = null;
  function clamp(v, a, b){ return Math.min(b, Math.max(a, v)); }
  function seg(p, a, b){ return clamp((p - a) / (b - a), 0, 1); }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function ease(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function smooth(t){ return t * t * (3 - 2 * t); }
  function outQ(t){ return 1 - (1 - t) * (1 - t); }

  function fit1(){
    var c = Math.max(W / L1.w, H / L1.h), ox = (W - L1.w * c) / 2, oy = (H - L1.h * c) / 2;
    if (mobile){
      c = Math.min(.31 * H, .7 * W) / L1.s;
      ox = clamp(W * .62 - L1.ax * c, W - L1.w * c, 0); oy = H - L1.h * c;
    }
    return {c: c, ox: ox, oy: oy};
  }
  function fit3(){
    var c = Math.max(W / L3.w, H / L3.h), ox = (W - L3.w * c) / 2, oy = (H - L3.h * c) / 2;
    if (mobile){ c = W * 1.06 / 1400; ox = W / 2 - 868 * c; oy = H * .56 - L3.ay * c; }
    return {c: c, ox: ox, oy: oy};
  }

  /* Núvol procedural: moltes boles blanques i suaus, més denses al centre */
  function paintCloud(){
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cloudCv.width = Math.round(W * dpr); cloudCv.height = Math.round(H * dpr);
    var x = cloudCv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    var seed = 7; function rnd(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var m = Math.max(W, H);
    for (var i = 0; i < 140; i++){
      var ang = rnd() * Math.PI * 2, dist = Math.pow(rnd(), .7) * m * .62;
      var cx = W / 2 + Math.cos(ang) * dist * 1.1, cy = H / 2 + Math.sin(ang) * dist * .8;
      var r = m * (.08 + rnd() * .2);
      var g = x.createRadialGradient(cx, cy - r * .15, 0, cx, cy, r);
      var shade = 236 + Math.round(rnd() * 17);
      g.addColorStop(0, 'rgba(255,255,255,.9)');
      g.addColorStop(.45, 'rgba(' + shade + ',' + (shade + 2) + ',255,.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    }
  }

  function measure(){
    var sr = stage.getBoundingClientRect();
    W = sr.width; H = sr.height; mobile = W < 761;
    var bt = brand.style.transform; brand.style.transform = 'none';
    var q = slot.getBoundingClientRect();
    slotR = {x: q.left - sr.left, y: q.top - sr.top, w: q.width, h: q.height};
    brand.style.transform = bt;
    L1.fit = fit1(); L3.fit = fit3();
    card.style.left = (slotR.x - 14) + 'px'; card.style.top = (slotR.y - 14) + 'px';
    card.style.width = (slotR.w + 28) + 'px'; card.style.height = (slotR.h + 64) + 'px';
    mark.style.left = (slotR.x + slotR.w - (mobile ? 70 : 96)) + 'px'; mark.style.top = (slotR.y - (mobile ? 28 : 36)) + 'px';
    paintCloud();
  }

  /* Escala una capa al voltant d'un punt de la imatge que es manté fix a la pantalla */
  function zoomAround(l, k, fx, fy){
    var f = l.fit, sc = f.c * k;
    var px = f.ox + fx * f.c, py = f.oy + fy * f.c;
    l.el.style.transform = 'translate(' + (px - fx * sc).toFixed(2) + 'px,' + (py - fy * sc).toFixed(2) + 'px) scale(' + sc.toFixed(5) + ')';
  }
  function placeRect(l, sc, tx, ty){
    l.el.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) scale(' + sc.toFixed(5) + ')';
  }

  var lastP = -1;
  function render(force){
    var r = sec.getBoundingClientRect();
    var total = r.height - H;
    var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    if (!force && Math.abs(p - lastP) < 1e-4) return;
    lastP = p;

    /* 1. Finestra: la càmera s'allunya una mica, sempre cobrint la pantalla */
    var a = outQ(seg(p, 0, .32));
    zoomAround(L1, lerp(1.14, 1.0, a), L1.ax, L1.ay);
    L1.el.style.opacity = (1 - smooth(seg(p, .26, .3))).toFixed(3);
    L1.el.style.visibility = p < .31 ? 'visible' : 'hidden';

    /* 2. El núvol passa per davant i amaga el canvi */
    var co = smooth(seg(p, .14, .27)) * (1 - smooth(seg(p, .31, .46)));
    cloudCv.style.opacity = co.toFixed(3);
    cloudCv.style.transform = 'scale(' + lerp(1.7, .9, seg(p, .14, .46)).toFixed(4) + ')';
    haze.style.opacity = (.92 * smooth(seg(p, .22, .28)) * (1 - smooth(seg(p, .3, .4)))).toFixed(3);

    /* 3. L'avió: apareix de més a prop i continua allunyant-se */
    L3.el.style.visibility = p > .27 ? 'visible' : 'hidden';
    if (p <= .62){
      zoomAround(L3, lerp(1.55, 1.0, outQ(seg(p, .27, .62))), L3.ax, L3.ay);
    } else {
      var u = ease(seg(p, .62, .82)), f3 = L3.fit;
      if (!mobile){
        var rx = lerp(0, slotR.x, u), ry = lerp(0, slotR.y, u), rw = lerp(W, slotR.w, u), rh = lerp(H, slotR.h, u);
        var cs = Math.max(rw / L3.w, rh / L3.h);
        placeRect(L3, cs, rx + (rw - L3.w * cs) / 2, ry + (rh - L3.h * cs) / 2);
      } else {
        var cs2 = Math.max(slotR.w / L3.w, slotR.h / L3.h);
        var sx = slotR.x + (slotR.w - L3.w * cs2) / 2, sy = slotR.y + (slotR.h - L3.h * cs2) / 2;
        placeRect(L3, Math.exp(lerp(Math.log(f3.c), Math.log(cs2), u)), lerp(f3.ox, sx, u), lerp(f3.oy, sy, u));
      }
    }
    L3.el.classList.toggle('fl-feather', mobile && p < .7);
    sky.classList.toggle('fl-sky-sea', p > .28);

    /* Text */
    var fo = 1 - seg(p, 0, .1);
    Array.prototype.forEach.call(fades, function(el){
      el.style.opacity = fo.toFixed(3); el.style.transform = 'translateY(' + (-36 * (1 - fo)).toFixed(1) + 'px)';
      el.style.pointerEvents = fo < .5 ? 'none' : '';
    });
    var to = 1 - smooth(seg(p, .17, .25));
    liv.style.opacity = to.toFixed(3);
    liv.style.transform = 'translateY(' + (-24 * (1 - to)).toFixed(1) + 'px) scale(' + (1 - .06 * (1 - to)).toFixed(4) + ')';
    liv3.style.opacity = smooth(seg(p, .5, .6)).toFixed(3);
    root.classList.toggle('on-light', p < .3);

    /* Postal */
    var q = ease(seg(p, .62, .82));
    var iT = slotR.y * q, iR = (W - slotR.x - slotR.w) * q, iB = (H - slotR.y - slotR.h) * q, iL = slotR.x * q;
    sky.style.clipPath = 'inset(' + iT.toFixed(1) + 'px ' + iR.toFixed(1) + 'px ' + iB.toFixed(1) + 'px ' + iL.toFixed(1) + 'px round ' + (4 * q).toFixed(1) + 'px)';
    var cardO = seg(p, .74, .84);
    card.style.opacity = cardO.toFixed(3); card.style.transform = 'scale(' + lerp(1.04, 1, cardO).toFixed(4) + ')';
    mark.style.opacity = seg(p, .8, .88).toFixed(3);

    /* "La marca" */
    var bo = seg(p, .74, .86);
    brand.style.opacity = bo.toFixed(3);
    brand.style.transform = 'translateY(' + (28 * (1 - bo)).toFixed(1) + 'px)';
    brand.style.pointerEvents = bo > .5 ? '' : 'none';
    var words = sec.querySelectorAll('#manifest .w');
    var lit = seg(p, .84, .98) * words.length;
    for (var i = 0; i < words.length; i++) words[i].style.setProperty('--o', (0.24 + clamp(lit - i, 0, 1) * 0.76).toFixed(2));
  }

  var ticking = false;
  function req(){ if (!ticking){ ticking = true; requestAnimationFrame(function(){ ticking = false; render(false); }); } }
  function relayout(){ measure(); render(true); }
  window.addEventListener('scroll', req, {passive: true});
  window.addEventListener('resize', relayout);
  window.addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  relayout();
})();
