/* Can Colls Disseny · clauers 3D interactius (three.js r128)
   Avió en miniatura, xapa del nedador i bossa de mà. Arrossega'ls: pengen d'una barra i es balancegen com un pèndol. */
(function(){
  var cv = document.getElementById('keys');
  if (!cv) return;
  var fig = cv.closest('.keys');
  function fail(){ if (fig) fig.classList.add('keys-off'); }
  if (!window.THREE){ fail(); return; }
  var T = window.THREE;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var renderer;
  try { renderer = new T.WebGLRenderer({canvas:cv, antialias:true, alpha:true}); }
  catch(e){ fail(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(30, 1, 0.1, 100);
  var LOOK_Y = -1.38;

  /* Colors oficials del manual */
  function col(hex){ return new T.Color(hex).convertSRGBToLinear(); }
  var BLAU = '#0D469A', MARI = '#052367', VERMELL = '#9A1701', BLANC = '#F0EAEF';

  /* Entorn per als reflexos del metall */
  (function(){
    var c = document.createElement('canvas'); c.width = 512; c.height = 256;
    var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#c9ced9'); g.addColorStop(.45, '#a7afc2'); g.addColorStop(.55, '#5d6782'); g.addColorStop(1, '#1b2236');
    x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(70, 46, 90, 26);
    var tex = new T.CanvasTexture(c); tex.mapping = T.EquirectangularReflectionMapping; tex.encoding = T.sRGBEncoding;
    var pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromEquirectangular(tex).texture;
    tex.dispose(); pm.dispose();
  })();

  scene.add(new T.HemisphereLight(0xfff6ec, 0x4a5578, 0.28));
  var key = new T.DirectionalLight(0xfff3e6, 0.85); key.position.set(3.5, 5, 7); key.target.position.set(0, -1.4, 0); scene.add(key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0006;
  var sc = key.shadow.camera; sc.left = -6; sc.right = 6; sc.top = 3; sc.bottom = -5; sc.near = 1; sc.far = 25;
  scene.add(key);
  var rim = new T.DirectionalLight(0xc8d6ff, 0.22); rim.position.set(-6, 3, -5); scene.add(rim);

  /* Materials */
  var M = {
    metal: new T.MeshStandardMaterial({color:col('#a8acb5'), metalness:1, roughness:.36, envMapIntensity:.85}),
    white: new T.MeshStandardMaterial({color:col('#eceef2'), metalness:0, roughness:.5, envMapIntensity:.4}),
    wing:  new T.MeshStandardMaterial({color:col('#d8dbe2'), metalness:.15, roughness:.4}),
    engine:new T.MeshStandardMaterial({color:col('#b9bdc7'), metalness:.7, roughness:.3}),
    dark:  new T.MeshStandardMaterial({color:col('#1a1f2e'), metalness:.2, roughness:.5}),
    blau:  new T.MeshStandardMaterial({color:col(BLAU), metalness:0, roughness:.42}),
    blauFosc: new T.MeshStandardMaterial({color:col('#0a3a82'), metalness:0, roughness:.5}),
    mari:  new T.MeshStandardMaterial({color:col(MARI), metalness:.1, roughness:.55}),
    piping:new T.MeshStandardMaterial({color:col('#f3f1f2'), metalness:0, roughness:.35})
  };

  function canvasTex(c){
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
  }

  /* Globus "CAN COLLS" (logotip de les aplicacions de viatge) */
  function drawGlobe(x, cx, cy, r, fg, bg, label){
    x.save();
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fillStyle = bg; x.fill();
    x.clip();
    x.strokeStyle = fg; x.lineWidth = r * .07; x.lineCap = 'round';
    x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx, cy + r); x.stroke();
    [.42, .78].forEach(function(k){
      x.beginPath(); x.ellipse(cx, cy, r * k, r, 0, 0, Math.PI * 2); x.stroke();
    });
    [-.72, -.42, .42, .72].forEach(function(o){
      var y = cy + o * r, bow = o * r * .28;
      x.beginPath(); x.moveTo(cx - r, y + bow); x.quadraticCurveTo(cx, y - bow * 1.2, cx + r, y + bow); x.stroke();
    });
    if (label){
      x.fillStyle = bg; x.fillRect(cx - r, cy - r * .2, r * 2, r * .4);
      x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '600 ' + Math.round(r * .3) + 'px Montserrat, Arial, sans-serif';
      x.fillText('CAN COLLS', cx, cy + r * .015);
    }
    x.restore();
  }
  function globeTexture(fg, bg){
    var c = document.createElement('canvas'); c.width = c.height = 512;
    var x = c.getContext('2d'); drawGlobe(x, 256, 256, 250, fg, bg, true);
    return canvasTex(c);
  }

  /* ---------- 1. Avió en miniatura ---------- */
  function makePlane(){
    var g = new T.Group();
    var R = .22, L = 2.0;
    /* Textura del fusellatge: proporció real (circumferència x llargada) */
    var W = 1024, H = Math.round(1024 * L / (2 * Math.PI * R));
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d');
    x.fillStyle = '#f6f6f8'; x.fillRect(0, 0, W, H);
    function side(sign){
      /* sign 1: costat de la càmera (u≈.5); sign -1: costat oposat (u≈0) */
      var U = function(u){ return (sign > 0 ? u : .5 - u) * W; };
      var bandA = U(.538), bandB = U(.565);
      x.fillStyle = BLAU; x.fillRect(Math.min(bandA, bandB), 0, Math.abs(bandB - bandA), H * .93);
      x.fillStyle = MARI; var thin = U(.572); x.fillRect(thin - 3, 0, 6, H * .9);
      x.fillStyle = '#20263a';
      var wu = U(.452);
      for (var v = H * .12; v < H * .86; v += H * .021){ x.beginPath(); x.ellipse(wu, v, 7, 5, 0, 0, Math.PI * 2); x.fill(); }
      [H * .2, H * .45, H * .7].forEach(function(v){ x.fillStyle = '#c9ccd6'; x.fillRect(U(.465) - 14, v, 28, 40); });
      x.save(); x.translate(U(.495), H * .44); x.rotate(sign > 0 ? -Math.PI / 2 : Math.PI / 2);
      x.fillStyle = BLAU; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '600 76px Montserrat, Arial, sans-serif';
      if ('letterSpacing' in x) x.letterSpacing = '6px';
      x.fillText('CAN  COLLS', 0, 0);
      x.restore();
    }
    side(1); side(-1);
    var bodyTex = canvasTex(c);
    var body = new T.Mesh(new T.CylinderGeometry(R, R, L, 64, 1, true, Math.PI, Math.PI * 2),
      new T.MeshStandardMaterial({map:bodyTex, roughness:.48, metalness:0, envMapIntensity:.4, color:col('#e6e7ec')}));
    body.rotation.z = -Math.PI / 2; g.add(body);
    /* Morro (a l'esquerra, com a la referència) i gepa del 747 */
    var nose = new T.Mesh(new T.SphereGeometry(R, 40, 24), M.white); nose.scale.set(1.9, 1, 1); nose.position.x = -L / 2; g.add(nose);
    var cock = new T.Mesh(new T.BoxGeometry(.12, .035, .2), M.dark); cock.position.set(-1.22, .12, 0); cock.rotation.z = -.35; g.add(cock);
    var hump = new T.Mesh(new T.SphereGeometry(.2, 32, 16), M.white); hump.scale.set(2.7, .72, .92); hump.position.set(-.5, .12, 0); g.add(hump);
    var tailCone = new T.Mesh(new T.CylinderGeometry(.05, R, .6, 40), M.white);
    tailCone.rotation.z = -Math.PI / 2; tailCone.position.set(L / 2 + .3, .04, 0); g.add(tailCone);
    /* Ales en fletxa, estabilitzadors i deriva */
    function slab(pts, depth, mat){
      var s = new T.Shape(); s.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
      s.closePath();
      var geo = new T.ExtrudeGeometry(s, {depth:depth, bevelEnabled:true, bevelThickness:.008, bevelSize:.008, bevelSegments:2});
      geo.translate(0, 0, -depth / 2);
      return new T.Mesh(geo, mat);
    }
    var wingPts = [[-.36, 0], [.28, 0], [.66, 1.18], [.46, 1.18]];
    [1, -1].forEach(function(sgn){
      var w = slab(wingPts, .028, M.wing); w.rotation.x = sgn * Math.PI / 2; w.rotation.z = sgn * .0; w.position.y = -.09;
      w.rotation.y = 0; g.add(w);
      var st = slab([[1.12, 0], [1.42, 0], [1.66, .46], [1.52, .46]], .022, M.wing); st.rotation.x = sgn * Math.PI / 2; st.position.y = .06; g.add(st);
      [.42, .82].forEach(function(s){
        var le = -.36 + (.46 + .36) * (s / 1.18);
        var eng = new T.Mesh(new T.CylinderGeometry(.068, .075, .3, 28), M.engine);
        eng.rotation.z = Math.PI / 2; eng.position.set(le - .02, -.19, sgn * s); g.add(eng);
        var intake = new T.Mesh(new T.CircleGeometry(.062, 28), M.dark);
        intake.rotation.y = -Math.PI / 2; intake.position.set(le - .172, -.19, sgn * s); g.add(intake);
        var pylon = new T.Mesh(new T.BoxGeometry(.16, .08, .02), M.wing); pylon.position.set(le + .02, -.13, sgn * s); g.add(pylon);
      });
    });
    var fin = slab([[.98, .14], [1.52, .14], [1.66, .9], [1.4, .9]], .03, M.white); g.add(fin);
    var gt = globeTexture(BLAU, '#f6f6f8');
    [1, -1].forEach(function(sgn){
      var d = new T.Mesh(new T.CircleGeometry(.17, 48), new T.MeshStandardMaterial({map:gt, roughness:.35, transparent:true}));
      d.position.set(1.36, .55, sgn * .024); if (sgn < 0) d.rotation.y = Math.PI; g.add(d);
    });
    /* Anella per penjar-lo */
    var eye = new T.Mesh(new T.TorusGeometry(.075, .022, 12, 32), M.metal); eye.position.set(0, R + .07, 0); g.add(eye);
    g.userData.eyeY = R + .14;
    g.scale.setScalar(.74);
    g.rotation.set(.32, .38, 0);
    return g;
  }

  /* ---------- 2. Xapa del nedador amb relleu ---------- */
  function makeBadge(swimmer){
    var g = new T.Group();
    var R = .8, TH = .1;
    var S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
    var x = c.getContext('2d');
    var b = document.createElement('canvas'); b.width = b.height = S;
    var bx = b.getContext('2d');
    bx.fillStyle = '#000'; bx.fillRect(0, 0, S, S);
    var cx = S / 2, ring = S * .5, inner = S * .37;
    /* Anell exterior blau amb text */
    x.fillStyle = BLAU; x.fillRect(0, 0, S, S);
    x.beginPath(); x.arc(cx, cx, inner, 0, Math.PI * 2); x.fillStyle = BLANC; x.fill();
    /* Ones de la marca a l'interior */
    x.save(); x.beginPath(); x.arc(cx, cx, inner, 0, Math.PI * 2); x.clip();
    x.strokeStyle = 'rgba(13,70,154,.16)'; x.lineWidth = 16;
    for (var yy = cx - inner; yy < cx + inner + 40; yy += 46){
      x.beginPath();
      for (var xx = cx - inner; xx <= cx + inner; xx += 8){ var wy = yy + Math.sin((xx / S) * Math.PI * 4) * 14; if (xx === cx - inner) x.moveTo(xx, wy); else x.lineTo(xx, wy); }
      x.stroke();
    }
    x.restore();
    x.lineWidth = 10; x.strokeStyle = MARI; x.beginPath(); x.arc(cx, cx, inner, 0, Math.PI * 2); x.stroke();
    bx.lineWidth = 14; bx.strokeStyle = '#fff'; bx.beginPath(); bx.arc(cx, cx, inner, 0, Math.PI * 2); bx.stroke();
    bx.beginPath(); bx.arc(cx, cx, ring - 18, 0, Math.PI * 2); bx.stroke();
    function ringText(ctx, str, rad, color){
      ctx.save(); ctx.translate(cx, cx); ctx.fillStyle = color;
      ctx.font = '600 58px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var step = (Math.PI * 2) / str.length;
      for (var i = 0; i < str.length; i++){
        ctx.save(); ctx.rotate(-Math.PI / 2 + i * step + step / 2); ctx.translate(rad, 0); ctx.rotate(Math.PI / 2);
        ctx.fillText(str[i], 0, 0); ctx.restore();
      }
      ctx.restore();
    }
    var txt = 'CAN COLLS DISSENY · OLD VALUES, NEW LIFE · ';
    ringText(x, txt, S * .435, BLANC);
    ringText(bx, txt, S * .435, '#fff');
    /* Nedador al centre, en relleu */
    var sw = S * .6, so = cx - sw / 2;
    if (swimmer){ x.drawImage(swimmer, so, so + 8, sw, sw); }
    if (swimmer){
      var m = document.createElement('canvas'); m.width = m.height = S;
      var mx = m.getContext('2d'); mx.drawImage(swimmer, so, so + 8, sw, sw);
      mx.globalCompositeOperation = 'source-in'; mx.fillStyle = '#fff'; mx.fillRect(0, 0, S, S);
      if ('filter' in bx) bx.filter = 'blur(3px)';
      bx.drawImage(m, 0, 0); bx.filter = 'none';
    }
    var faceTex = canvasTex(c);
    var bumpTex = new T.CanvasTexture(b);
    var faceMat = (T.MeshPhysicalMaterial ? new T.MeshPhysicalMaterial({map:faceTex, bumpMap:bumpTex, bumpScale:.9, roughness:.32, metalness:0, clearcoat:.6, clearcoatRoughness:.3, envMapIntensity:.5})
                                          : new T.MeshStandardMaterial({map:faceTex, bumpMap:bumpTex, bumpScale:.9, roughness:.32}));
    /* Cara bombada amb UV planes */
    var th = .27, Rs = R / Math.sin(th);
    var cap = new T.SphereGeometry(Rs, 96, 24, 0, Math.PI * 2, 0, th);
    cap.rotateX(Math.PI / 2);
    cap.translate(0, 0, TH / 2 - Rs * Math.cos(th));
    var pos = cap.attributes.position, uv = cap.attributes.uv;
    for (var i = 0; i < pos.count; i++){ uv.setXY(i, pos.getX(i) / (2 * R) + .5, pos.getY(i) / (2 * R) + .5); }
    uv.needsUpdate = true; cap.computeVertexNormals();
    g.add(new T.Mesh(cap, faceMat));
    var bodyM = new T.Mesh(new T.CylinderGeometry(R, R, TH, 96, 1, true), M.metal); bodyM.rotation.x = Math.PI / 2; g.add(bodyM);
    var back = new T.Mesh(new T.CircleGeometry(R, 96), M.metal); back.rotation.y = Math.PI; back.position.z = -TH / 2; g.add(back);
    var lip = new T.Mesh(new T.TorusGeometry(R, .028, 14, 128), M.metal); lip.position.z = TH / 2; g.add(lip);
    var lipB = lip.clone(); lipB.position.z = -TH / 2; g.add(lipB);
    /* Agulla del darrere i anella superior */
    var pin = new T.Mesh(new T.CylinderGeometry(.012, .012, 1.1, 8), M.metal); pin.rotation.z = Math.PI / 2; pin.position.set(0, -.15, -TH / 2 - .04); g.add(pin);
    var bail = new T.Mesh(new T.TorusGeometry(.08, .022, 12, 32), M.metal); bail.rotation.y = Math.PI / 2; bail.position.set(0, R + .07, 0); g.add(bail);
    g.userData.eyeY = R + .14;
    g.scale.setScalar(.98);
    g.rotation.set(.06, -.18, 0);
    return g;
  }

  /* ---------- 3. Bossa de mà en miniatura ---------- */
  function makeBag(){
    var g = new T.Group();
    var s = new T.Shape();
    s.moveTo(-.72, 0); s.lineTo(.72, 0);
    s.quadraticCurveTo(.86, 0, .8, .13);
    s.lineTo(.58, .7);
    s.quadraticCurveTo(.5, .86, .3, .88);
    s.lineTo(-.3, .88);
    s.quadraticCurveTo(-.5, .86, -.58, .7);
    s.lineTo(-.8, .13);
    s.quadraticCurveTo(-.86, 0, -.72, 0);
    var D = .62, BT = .07;
    var geo = new T.ExtrudeGeometry(s, {depth:D, bevelEnabled:true, bevelThickness:BT, bevelSize:.06, bevelSegments:5, curveSegments:28});
    geo.translate(0, -.44, -D / 2);
    var body = new T.Mesh(geo, new T.MeshStandardMaterial({color:col(BLAU), metalness:0, roughness:.4, envMapIntensity:.45}));
    g.add(body);
    /* Ribet blanc a les dues cares */
    var pts = s.getPoints(14).map(function(p){ return new T.Vector3(p.x, p.y - .44, 0); });
    [1, -1].forEach(function(sgn){
      var curve = new T.CatmullRomCurve3(pts.map(function(p){ return new T.Vector3(p.x, p.y, sgn * (D / 2 + BT)); }), true);
      g.add(new T.Mesh(new T.TubeGeometry(curve, 200, .028, 10, true), M.piping));
    });
    /* Logotip globus */
    var gt = globeTexture(BLAU, '#ecebf0');
    [1, -1].forEach(function(sgn){
      var d = new T.Mesh(new T.CircleGeometry(.3, 64), new T.MeshStandardMaterial({map:gt, roughness:.45}));
      d.position.set(-.06, -.04, sgn * (D / 2 + BT + .003)); if (sgn < 0) d.rotation.y = Math.PI; g.add(d);
    });
    /* Nanses */
    [1, -1].forEach(function(sgn){
      var h = new T.Mesh(new T.TorusGeometry(.3, .038, 14, 40, Math.PI), M.blauFosc);
      h.position.set(0, .47, sgn * .2); g.add(h);
      [-.3, .3].forEach(function(xx){
        var rv = new T.Mesh(new T.SphereGeometry(.03, 12, 8), M.metal); rv.position.set(xx, .47, sgn * .2 + sgn * .03); g.add(rv);
      });
    });
    /* Cremallera i etiqueta */
    var zip = new T.Mesh(new T.BoxGeometry(.66, .014, .045), M.metal); zip.position.set(0, .507, 0); g.add(zip);
    var pull = new T.Mesh(new T.BoxGeometry(.03, .1, .015), M.metal); pull.position.set(.36, .46, .03); g.add(pull);
    var tagTex = globeTexture(BLANC, BLAU);
    var tag = new T.Mesh(new T.CylinderGeometry(.085, .085, .016, 32), [M.blauFosc, new T.MeshStandardMaterial({map:tagTex}), new T.MeshStandardMaterial({map:tagTex})]);
    tag.rotation.x = Math.PI / 2; tag.position.set(.22, .2, D / 2 + BT + .05); g.add(tag);
    var tagRing = new T.Mesh(new T.TorusGeometry(.03, .008, 8, 20), M.metal); tagRing.position.set(.22, .3, D / 2 + BT + .05); g.add(tagRing);
    /* Anella per penjar a la nansa davantera */
    var eye = new T.Mesh(new T.TorusGeometry(.07, .02, 12, 32), M.metal); eye.rotation.y = Math.PI / 2; eye.position.set(0, .82, .2); g.add(eye);
    g.userData.eyeY = .88; g.userData.eyeZ = .2;
    g.scale.setScalar(1.02);
    g.rotation.set(.18, -.5, 0);
    return g;
  }

  /* ---------- Clauer: anella partida + cadena + objecte ---------- */
  function makeKeychain(obj){
    var pivot = new T.Group();
    var swing = new T.Group(); pivot.add(swing);
    var spin = new T.Group(); swing.add(spin);
    var ring = new T.Mesh(new T.TorusGeometry(.26, .034, 16, 64), M.metal); ring.position.y = -.26; ring.rotation.y = .9; spin.add(ring);
    var ring2 = new T.Mesh(new T.TorusGeometry(.26, .034, 16, 64, Math.PI * 1.6), M.metal); ring2.position.set(0, -.26, .02); ring2.rotation.set(0, .9, .4); ring2.scale.setScalar(.985); spin.add(ring2);
    for (var i = 0; i < 3; i++){
      var link = new T.Mesh(new T.TorusGeometry(.085, .022, 10, 28), M.metal);
      link.scale.y = 1.45; link.position.y = -.6 - i * .2; link.rotation.y = i % 2 ? Math.PI / 2 : 0;
      spin.add(link);
    }
    var holder = new T.Group(); spin.add(holder);
    holder.add(obj);
    var sc = obj.scale.x;
    holder.position.y = -1.06 - obj.userData.eyeY * sc;
    holder.position.z = -(obj.userData.eyeZ || 0) * sc;
    pivot.userData = {swing:swing, spin:spin, a:0, va:0, b:0, vb:0, phi:0, vphi:0, drag:false};
    return pivot;
  }

  /* Barra on pengen */
  var rail = new T.Mesh(new T.CylinderGeometry(.05, .05, 8.4, 24), M.mari); rail.rotation.z = Math.PI / 2; rail.position.set(0, .08, -.1); scene.add(rail);
  [-4.2, 4.2].forEach(function(xx){ var cap = new T.Mesh(new T.SphereGeometry(.09, 20, 12), M.mari); cap.position.set(xx, .08, -.1); scene.add(cap); });

  var wall = new T.Mesh(new T.PlaneGeometry(40, 20), new T.ShadowMaterial({opacity:.2}));
  wall.position.set(0, -2, -1.3); wall.receiveShadow = true; scene.add(wall);
  var chains = [];
  var X = [-2.55, 0, 2.55];

  function build(swimmer){
    [makePlane(), makeBadge(swimmer), makeBag()].forEach(function(obj, i){
      var k = makeKeychain(obj);
      k.position.set(X[i], 0, 0);
      var hook = new T.Mesh(new T.TorusGeometry(.09, .02, 10, 24, Math.PI * 1.3), M.metal);
      hook.position.set(X[i], .02, -.02); hook.rotation.z = Math.PI * .85; scene.add(hook);
      if (!reduce){ k.userData.va = (i - 1) * .6; k.userData.vphi = (i - 1) * -.8; }
      scene.add(k); chains.push(k);
    });
    scene.traverse(function(o){ if (o.isMesh && o !== wall){ o.castShadow = true; [].concat(o.material).forEach(function(m){ if (m && m.envMapIntensity === 1) m.envMapIntensity = .5; }); } });
    resize(); start();
  }

  /* Interacció */
  var ray = new T.Raycaster(), ndc = new T.Vector2(), plane = new T.Plane(new T.Vector3(0, 0, 1), 0), hit = new T.Vector3();
  var dragK = null, lastPX = 0, lastPY = 0, lastT = 0, pvx = 0;
  function setNdc(e){
    var r = cv.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  }
  function pick(){
    for (var i = 0; i < chains.length; i++){
      if (ray.intersectObject(chains[i], true).length) return chains[i];
    }
    return null;
  }
  cv.addEventListener('pointerdown', function(e){
    setNdc(e); var k = pick(); if (!k) return;
    dragK = k; k.userData.drag = true; cv.setPointerCapture(e.pointerId);
    cv.style.cursor = 'grabbing'; lastPX = e.clientX; lastPY = e.clientY; lastT = performance.now();
    k.userData.vb += 1.6;
    wake();
  });
  cv.addEventListener('pointermove', function(e){
    setNdc(e);
    var now = performance.now(), dt = Math.max(1, now - lastT);
    pvx = (e.clientX - lastPX) / dt;
    if (dragK){
      if (ray.ray.intersectPlane(plane, hit)){
        var dx = hit.x - dragK.position.x, dy = hit.y - dragK.position.y;
        var target = Math.atan2(dx, -dy);
        dragK.userData.target = Math.max(-1.35, Math.min(1.35, target));
      }
      dragK.userData.vphi += (e.clientX - lastPX) * .02;
    } else {
      var k = pick();
      cv.style.cursor = k ? 'grab' : 'default';
      if (k && Math.abs(pvx) > .05){ k.userData.va += pvx * .35; k.userData.vphi += pvx * .4; wake(); }
    }
    lastPX = e.clientX; lastPY = e.clientY; lastT = now;
  });
  function end(e){
    if (!dragK) return;
    dragK.userData.drag = false; dragK.userData.target = null;
    try { cv.releasePointerCapture(e.pointerId); } catch(err){}
    dragK = null; cv.style.cursor = 'grab';
  }
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  cv.addEventListener('pointerleave', function(){ if (!dragK) cv.style.cursor = 'default'; });

  /* Física de pèndol */
  var G = 16, DAMP = 1.5, TW = 3.2, TWD = 1.3;
  function step(dt, t){
    var moving = false;
    chains.forEach(function(k, i){
      var u = k.userData;
      if (u.drag && u.target != null){
        var prev = u.a; u.a += (u.target - u.a) * Math.min(1, dt * 14); u.va = (u.a - prev) / dt;
      } else {
        u.va += (-G * Math.sin(u.a) - DAMP * u.va) * dt;
        if (!reduce) u.va += Math.sin(t * .6 + i * 1.7) * .05 * dt;
        u.a += u.va * dt;
      }
      u.vb += (-G * Math.sin(u.b) - DAMP * 1.4 * u.vb) * dt; u.b += u.vb * dt;
      u.vphi += (-TW * u.phi - TWD * u.vphi) * dt; u.phi += u.vphi * dt;
      u.swing.rotation.z = u.a; u.swing.rotation.x = u.b * .5; u.spin.rotation.y = u.phi;
      if (Math.abs(u.va) + Math.abs(u.vb) + Math.abs(u.vphi) + Math.abs(u.a) + Math.abs(u.phi) > .002 || u.drag) moving = true;
    });
    return moving;
  }

  function resize(){
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    var tan = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    var dW = (8.2 / 2) / (tan * camera.aspect), dH = (3.75 / 2) / tan;
    var d = Math.max(dW, dH);
    camera.position.set(0, LOOK_Y + .2, d); camera.lookAt(0, LOOK_Y, 0);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }

  var running = false, visible = true, lastFrame = 0, idleFrames = 0;
  function frame(now){
    if (!running) return;
    var dt = Math.min(.033, (now - lastFrame) / 1000 || .016); lastFrame = now;
    var moving = step(dt, now / 1000);
    renderer.render(scene, camera);
    idleFrames = moving || !reduce ? 0 : idleFrames + 1;
    if (!visible || idleFrames > 30){ running = false; return; }
    requestAnimationFrame(frame);
  }
  function start(){ if (running) return; running = true; lastFrame = performance.now(); requestAnimationFrame(frame); }
  function wake(){ idleFrames = 0; start(); }

  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if (visible) wake(); }).observe(cv);
  }
  window.addEventListener('resize', resize);

  /* Carregar la tipografia i la il·lustració abans de pintar les textures */
  var img = new Image();
  var fontReady = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('600 76px Montserrat'), document.fonts.ready]).catch(function(){}) : Promise.resolve();
  var imgReady = new Promise(function(res){ img.onload = function(){ res(img); }; img.onerror = function(){ res(null); }; img.src = 'assets/nedador.png'; });
  Promise.all([fontReady, imgReady]).then(function(r){ build(r[1]); });
})();
