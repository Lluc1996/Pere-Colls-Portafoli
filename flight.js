/* Can Colls Disseny · el vol de la portada (fotos reals)
   Tres fotos: la finestra de prop, la fila de finestres i l'avió sencer.
   La càmera s'allunya fent petita cada foto al voltant de la finestra i fonent-la amb la següent;
   al final la tercera foto s'encongeix fins a ser la postal al costat del text de "La marca". */
(function(){
  var sec = document.getElementById('vol');
  if (!sec) return;
  var root = document.documentElement;
  var stage = sec.querySelector('.fl-stage'), sky = document.getElementById('fl-sky');
  var card = document.getElementById('fl-card'), mark = document.getElementById('fl-mark');
  var slot = document.getElementById('fl-slot'), brand = document.getElementById('fl-brand');
  var liv = document.getElementById('fl-livery'), liv3 = sec.querySelector('.fl-liv3');
  var fades = sec.querySelectorAll('.fl-fade');
  var fogA = document.getElementById('fl-fog-a'), fogB = document.getElementById('fl-fog-b'), veil = document.getElementById('fl-veil');
  function bump(p, c, w){ var d = (p - c) / w; return Math.exp(-d * d); }

  /* Cada foto: mida, centre de la finestra de referència i alçada d'aquesta finestra (px de la imatge) */
  var L = [
    {el: document.getElementById('fl-l1'), w: 1667, h: 943, ax: 1181, ay: 484, s: 396},
    {el: document.getElementById('fl-l2'), w: 1671, h: 941, ax: 1157, ay: 482, s: 101},
    {el: document.getElementById('fl-l3'), w: 1670, h: 942, ax: 908,  ay: 512, s: 10}
  ];
  var KEY = [0, .34, .62];          // moment en què cada foto es veu exactament sencera

  var W = 0, H = 0, mobile = false, slotR = null;
  function clamp(v, a, b){ return Math.min(b, Math.max(a, v)); }
  function seg(p, a, b){ return clamp((p - a) / (b - a), 0, 1); }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function ease(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function smooth(t){ return t * t * (3 - 2 * t); }

  function cover(l, i){
    var c = Math.max(W / l.w, H / l.h);
    var ox = (W - l.w * c) / 2, oy = (H - l.h * c) / 2;
    if (mobile){
      if (i === 0){
        /* Pantalla vertical: la finestra més petita i a sota del text, amb cel a dalt */
        c = Math.min(.31 * H, .7 * W) / l.s;
        ox = clamp(W * .62 - l.ax * c, W - l.w * c, 0); oy = H - l.h * c;
      } else if (i === 1){
        ox = clamp(W * .6 - l.ax * c, W - l.w * c, 0);
      } else {
        /* L'avió sencer, amb el cel que continua per dalt i per baix */
        c = W * 1.06 / 1400;
        ox = W / 2 - 868 * c; oy = H * .56 - l.ay * c;
      }
    }
    return {c: c, ox: ox, oy: oy};
  }

  function measure(){
    var sr = stage.getBoundingClientRect();
    W = sr.width; H = sr.height; mobile = W < 761;
    var bt = brand.style.transform; brand.style.transform = 'none';
    var q = slot.getBoundingClientRect();
    slotR = {x: q.left - sr.left, y: q.top - sr.top, w: q.width, h: q.height};
    brand.style.transform = bt;
    L.forEach(function(l, i){
      var cv = cover(l, i); l.cv = cv;
      l.H = l.s * cv.c;                                  // alçada de la finestra a la pantalla quan la foto és sencera
      l.P = {x: cv.ox + l.ax * cv.c, y: cv.oy + l.ay * cv.c};
    });
    card.style.left = (slotR.x - 14) + 'px'; card.style.top = (slotR.y - 14) + 'px';
    card.style.width = (slotR.w + 28) + 'px'; card.style.height = (slotR.h + 64) + 'px';
    mark.style.left = (slotR.x + slotR.w - (mobile ? 70 : 96)) + 'px'; mark.style.top = (slotR.y - (mobile ? 28 : 36)) + 'px';
  }

  /* Càmera: alçada aparent de la finestra (Hw) i punt de la pantalla on cau (P) */
  function camera(p){
    var i = p < KEY[1] ? 0 : 1;
    var a = L[i], b = L[i + 1];
    var t = ease(seg(p, KEY[i], KEY[i + 1]));
    var Hw = Math.exp(lerp(Math.log(a.H), Math.log(b.H), t));
    var w = (1 / Hw - 1 / a.H) / (1 / b.H - 1 / a.H);
    return {Hw: Hw, P: {x: lerp(a.P.x, b.P.x, w), y: lerp(a.P.y, b.P.y, w)}};
  }
  function place(l, sc, tx, ty){
    l.el.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) scale(' + sc.toFixed(5) + ')';
  }

  var lastP = -1;
  function render(force){
    var r = sec.getBoundingClientRect();
    var total = r.height - H;
    var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    if (!force && Math.abs(p - lastP) < 1e-4) return;
    lastP = p;

    if (p <= KEY[2]){
      var cam = camera(p);
      L.forEach(function(l){
        var sc = cam.Hw / l.s;
        place(l, sc, cam.P.x - l.ax * sc, cam.P.y - l.ay * sc);
      });
    } else {
      /* La tercera foto es fa postal */
      /* La foto sempre omple el requadre que s'encongeix */
      var l3 = L[2], u = ease(seg(p, KEY[2], .82));
      if (!mobile){
        var rx = lerp(0, slotR.x, u), ry = lerp(0, slotR.y, u), rw = lerp(W, slotR.w, u), rh = lerp(H, slotR.h, u);
        var cs = Math.max(rw / l3.w, rh / l3.h);
        place(l3, cs, rx + (rw - l3.w * cs) / 2, ry + (rh - l3.h * cs) / 2);
      } else {
        var cs2 = Math.max(slotR.w / l3.w, slotR.h / l3.h);
        var sx = slotR.x + (slotR.w - l3.w * cs2) / 2, sy = slotR.y + (slotR.h - l3.h * cs2) / 2;
        place(l3, Math.exp(lerp(Math.log(l3.cv.c), Math.log(cs2), u)), lerp(l3.cv.ox, sx, u), lerp(l3.cv.oy, sy, u));
      }
    }
    /* Fosa entre fotos (la de sobre s'esvaeix quan la de sota ja és prou nítida) */
    L[0].el.style.opacity = (1 - smooth(seg(p, .14, .3))).toFixed(3);
    L[1].el.style.opacity = (1 - smooth(seg(p, .46, .58))).toFixed(3);
    /* Vores difuminades que creixen quan la foto s'allunya, perquè es fongui amb la de sota */
    L[0].el.style.setProperty('--f', Math.max(mobile ? 90 : 0, 440 * smooth(seg(p, .015, .2))).toFixed(1) + 'px');
    if (mobile){
      L[1].el.style.opacity = (smooth(seg(p, .08, .2)) * (1 - smooth(seg(p, .46, .58)))).toFixed(3);
      sky.classList.toggle('fl-sky-sea', p > .4);
    }
    L[1].el.style.setProperty('--f', (420 * smooth(seg(p, KEY[1] + .01, .5))).toFixed(1) + 'px');
    L[0].el.style.visibility = p < .34 ? 'visible' : 'hidden';
    L[1].el.style.visibility = p < .62 ? 'visible' : 'hidden';
    L[2].el.style.visibility = p > .46 ? 'visible' : 'hidden';

    /* Boira: un vel lleuger durant el vol que s'espesseix als canvis de foto (la càmera travessa un núvol) */
    var base = .16 * smooth(seg(p, .02, .1)) * (1 - smooth(seg(p, .6, .67)));
    var peak = Math.max(bump(p, .23, .065), bump(p, .525, .055));
    var fog = Math.max(base, peak * .86);
    fogA.style.opacity = fog.toFixed(3);
    fogB.style.opacity = Math.max(base * .8, peak * .75).toFixed(3);
    fogA.style.transform = 'translate3d(' + (-14 * p).toFixed(2) + '%,' + (4 * p).toFixed(2) + '%,0) scale(' + (2.1 - 1.2 * p).toFixed(4) + ')';
    fogB.style.transform = 'translate3d(' + (10 * p).toFixed(2) + '%,' + (-6 * p).toFixed(2) + '%,0) scale(' + (2.8 - 1.7 * p).toFixed(4) + ')';
    veil.style.opacity = (peak * .42).toFixed(3);
    L[2].el.classList.toggle('fl-feather', mobile && p < .7);

    /* Text inicial: el lead i els botons marxen primer; el títol es manté fins que apareix l'avió */
    var fo = 1 - seg(p, 0, .1);
    Array.prototype.forEach.call(fades, function(el){
      el.style.opacity = fo.toFixed(3); el.style.transform = 'translateY(' + (-36 * (1 - fo)).toFixed(1) + 'px)';
      el.style.pointerEvents = fo < .5 ? 'none' : '';
    });
    var to = 1 - smooth(seg(p, .44, .56));
    liv.style.opacity = to.toFixed(3);
    liv.style.transform = 'translateY(' + (-24 * (1 - to)).toFixed(1) + 'px) scale(' + (1 - .06 * (1 - to)).toFixed(4) + ')';
    liv3.style.opacity = smooth(seg(p, .52, .62)).toFixed(3);
    root.classList.toggle('on-light', p < .48);

    /* El cel es retalla fins a la postal */
    var q = ease(seg(p, KEY[2], .82));
    var iT = slotR.y * q, iR = (W - slotR.x - slotR.w) * q, iB = (H - slotR.y - slotR.h) * q, iL = slotR.x * q;
    sky.style.clipPath = 'inset(' + iT.toFixed(1) + 'px ' + iR.toFixed(1) + 'px ' + iB.toFixed(1) + 'px ' + iL.toFixed(1) + 'px round ' + (4 * q).toFixed(1) + 'px)';
    var cardO = seg(p, .74, .84);
    card.style.opacity = cardO.toFixed(3); card.style.transform = 'scale(' + lerp(1.04, 1, cardO).toFixed(4) + ')';
    mark.style.opacity = seg(p, .8, .88).toFixed(3);

    /* "La marca" entra al costat de la postal */
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
