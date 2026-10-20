/* Can Colls Disseny · el vol de la portada
   1. Primer pla del fusellatge: la finestra amb en Pere, la línia blava i el títol com a rètol.
   2. Amb l'scroll la càmera s'allunya: apareixen les finestres, la silueta i el títol s'enganxa al fusellatge.
   3. El cel s'encongeix fins a ser una postal amb la foto de l'avió, al costat del text de "La marca". */
(function(){
  var sec = document.getElementById('vol');
  if (!sec) return;
  var root = document.documentElement;
  var stage = sec.querySelector('.fl-stage'), svg = document.getElementById('fl-svg');
  var sky = document.getElementById('fl-sky'), photo = document.getElementById('fl-photo');
  var card = document.getElementById('fl-card'), mark = document.getElementById('fl-mark');
  var slot = document.getElementById('fl-slot'), brand = document.getElementById('fl-brand');
  var liv = document.getElementById('fl-livery'), fades = sec.querySelectorAll('.fl-fade');

  /* Punts clau en unitats de l'avió (viewBox 2400 x 800) */
  var WIN = {x: 1251, y: 393, h: 30};          // finestra amb el retrat
  var PLANE = {x: 1200, y: 420, len: 2320};    // centre i llargada de l'avió
  var LIV = {x: 600, y: 240, h: 114};          // lloc del rètol al fusellatge

  var W = 0, H = 0, mobile = false, nat = null, slotR = null;
  function clamp(v, a, b){ return Math.min(b, Math.max(a, v)); }
  function seg(p, a, b){ return clamp((p - a) / (b - a), 0, 1); }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function ease(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function measure(){
    var sr = stage.getBoundingClientRect();
    W = sr.width; H = sr.height; mobile = W < 761;
    liv.style.transform = 'none';
    var r = liv.getBoundingClientRect();
    nat = {x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height};
    var bt = brand.style.transform; brand.style.transform = 'none';
    var q = slot.getBoundingClientRect();
    slotR = {x: q.left - sr.left, y: q.top - sr.top, w: q.width, h: q.height};
    brand.style.transform = bt;
    photo.style.left = slotR.x + 'px'; photo.style.top = slotR.y + 'px';
    photo.style.width = slotR.w + 'px'; photo.style.height = slotR.h + 'px';
    card.style.left = (slotR.x - 14) + 'px'; card.style.top = (slotR.y - 14) + 'px';
    card.style.width = (slotR.w + 28) + 'px'; card.style.height = (slotR.h + 64) + 'px';
    mark.style.left = (slotR.x + slotR.w - (mobile ? 70 : 96)) + 'px'; mark.style.top = (slotR.y - (mobile ? 28 : 36)) + 'px';
  }

  function camera(p){
    var s0 = (mobile ? .32 : .44) * H / WIN.h;
    var a0 = {x: (mobile ? .5 : .72) * W, y: (mobile ? .66 : .42) * H};
    var s1 = Math.min((mobile ? .9 : .74) * W / PLANE.len, .62 * H / 800);
    var a1 = {x: .5 * W, y: .52 * H};
    var s2 = .74 * slotR.w / PLANE.len;
    var a2 = {x: slotR.x + slotR.w * .52, y: slotR.y + slotR.h * .5};
    var s, f, a;
    if (p <= .62){
      var t = ease(seg(p, 0, .62));
      s = Math.exp(lerp(Math.log(s0), Math.log(s1), t));
      var w = (1 / s - 1 / s0) / (1 / s1 - 1 / s0);   // moviment uniforme a la pantalla
      f = {x: lerp(WIN.x, PLANE.x, w), y: lerp(WIN.y, PLANE.y, w)};
      a = {x: lerp(a0.x, a1.x, w), y: lerp(a0.y, a1.y, w)};
    } else {
      var u = ease(seg(p, .62, .82));
      s = Math.exp(lerp(Math.log(s1), Math.log(s2), u));
      f = PLANE; a = {x: lerp(a1.x, a2.x, u), y: lerp(a1.y, a2.y, u)};
    }
    return {s: s, vx: f.x - a.x / s, vy: f.y - a.y / s};
  }

  var lastP = -1;
  function render(force){
    var r = sec.getBoundingClientRect();
    var total = r.height - H;
    var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    if (!force && Math.abs(p - lastP) < 1e-4) return;
    lastP = p;
    var c = camera(p);
    svg.setAttribute('viewBox', c.vx.toFixed(3) + ' ' + c.vy.toFixed(3) + ' ' + (W / c.s).toFixed(3) + ' ' + (H / c.s).toFixed(3));

    /* El rètol: del títol gran al fusellatge */
    var b = ease(seg(p, .3, .5));
    var tx = (LIV.x - c.vx) * c.s, ty = (LIV.y - c.vy) * c.s, k = (LIV.h * c.s) / nat.h;
    var sc = Math.exp(lerp(0, Math.log(k), b));
    liv.style.transform = 'translate(' + lerp(0, tx - nat.x, b).toFixed(2) + 'px,' + lerp(0, ty - nat.y, b).toFixed(2) + 'px) scale(' + sc.toFixed(5) + ')';

    /* La resta del text inicial s'esvaeix */
    var fo = 1 - seg(p, 0, .1);
    Array.prototype.forEach.call(fades, function(el){
      el.style.opacity = fo.toFixed(3); el.style.transform = 'translateY(' + (-36 * (1 - fo)).toFixed(1) + 'px)';
      el.style.pointerEvents = fo < .5 ? 'none' : '';
    });
    root.classList.toggle('on-light', p < .3);

    /* El cel es fa postal; el vector es fon amb la foto */
    var q = ease(seg(p, .62, .82));
    var iT = slotR.y * q, iR = (W - slotR.x - slotR.w) * q, iB = (H - slotR.y - slotR.h) * q, iL = slotR.x * q;
    sky.style.clipPath = 'inset(' + iT.toFixed(1) + 'px ' + iR.toFixed(1) + 'px ' + iB.toFixed(1) + 'px ' + iL.toFixed(1) + 'px round ' + (4 * q).toFixed(1) + 'px)';
    var x = seg(p, .74, .84);
    svg.style.opacity = (1 - x).toFixed(3); liv.style.opacity = (1 - x).toFixed(3);
    photo.style.opacity = x.toFixed(3);
    var cardO = seg(p, .76, .85);
    card.style.opacity = cardO.toFixed(3); card.style.transform = 'scale(' + lerp(1.04, 1, cardO).toFixed(4) + ')';
    mark.style.opacity = seg(p, .82, .9).toFixed(3);

    /* "La marca" entra al costat de la postal */
    var bo = seg(p, .76, .87);
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
