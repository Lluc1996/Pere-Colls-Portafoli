/* Can Colls Disseny · piscina desbordant
   Una piscina rodona amb les ones del logotip, el nedador flotant i aigua que vessa en fer scroll.
   El cursor fa ones i aparta el nedador; un clic fa un esquitx. */
(function(){
  var pool = document.getElementById('pool');
  if (!pool) return;
  var cv = document.getElementById('pool-gl'), sw = document.getElementById('swimmer');
  var hero = pool.closest('.hero') || document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var gl = null;
  try { gl = cv.getContext('webgl', {premultipliedAlpha:true, alpha:true, antialias:true}); } catch(e){}
  if (!gl){ pool.classList.add('pool-static'); return; }

  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uT;uniform float uS;uniform float uDpr;uniform vec4 uR[10];',
    'const vec3 BLAU=vec3(13.,70.,154.)/255.;const vec3 BLANC=vec3(240.,234.,239.)/255.;const vec3 MARI=vec3(5.,35.,103.)/255.;',
    'float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}',
    'float sdCap(vec2 p,vec2 a,vec2 b,float r){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}',
    'float hash(float n){return fract(sin(n)*43758.5453);}',
    'void main(){',
    ' vec2 q=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr;',
    ' float W=uRes.x/uDpr;vec2 c=vec2(W*.5);float R=W*.43;float rim=W*.035;',
    /* ones del cursor i del nedador */
    ' vec2 disp=vec2(0.);float h=0.;',
    ' for(int i=0;i<10;i++){vec4 r=uR[i];if(r.w<=0.)continue;float age=uT-r.z;if(age<0.||age>4.)continue;',
    '  vec2 d=q-r.xy;float dist=length(d)+.001;float front=age*W*.30;',
    '  float env=exp(-pow((dist-front)/(W*.07),2.))*exp(-age*1.05)*r.w;',
    '  float w=sin(dist*.11-age*8.)*env;h+=w;disp+=d/dist*w;}',
    ' h+=.12*sin(q.x*.021+uT*1.2)*sin(q.y*.026-uT*.9);',
    ' vec2 qs=q+disp*7.;',
    /* forma de l'aigua: cercle que puja i regalims que vessen */
    ' float dc=length(q-c)-R;',
    ' float ang=atan(q.y-c.y,q.x-c.x);',
    ' float d=dc+sin(ang*7.+uT*1.4)*W*.004*(.4+uS)-uS*W*.03;',
    ' for(int k=0;k<7;k++){float fk=float(k);',
    '  float x=c.x+(fk-3.)*R*.27+(hash(fk*3.7)-.5)*R*.08;',
    '  float dx=(x-c.x)/R;float y0=c.y+R*sqrt(max(0.,1.-dx*dx));',
    '  float len=uS*W*(.35+1.05*hash(fk*9.1))*smoothstep(0.,.35,uS+hash(fk)*.2);',
    '  float wob=sin(uT*1.7+fk*2.1)*W*.006;',
    '  float rr=W*(.016+.014*hash(fk*5.3));',
    '  float cap=sdCap(q,vec2(x,y0-W*.03),vec2(x+wob,y0+len),rr*(.55+.45*uS));',
    '  float bulb=length(q-vec2(x+wob,y0+len+rr*.4))-rr*1.3*smoothstep(0.,.15,uS);',
    '  d=smin(d,min(cap,bulb),W*.035);}',
    ' float aa=1./uDpr;',
    ' float water=1.-smoothstep(-aa,aa,d);',
    ' float ring=(1.-smoothstep(-aa,aa,dc-rim))*smoothstep(-aa,aa,dc);',
    ' float tile=step(.93,fract(ang*48./6.2832));',
    ' vec3 rimCol=mix(BLANC,BLANC*.84,tile);',
    ' rimCol*=1.-.18*smoothstep(rim*.2,rim,dc);',
    /* ratlles ondulades del logotip, subtils */
    ' float yy=qs.y+W*.04*sin(qs.x/W*7.5+uT*.45+qs.y/W*2.2);',
    ' float st=smoothstep(.42,.58,fract(yy/(W*.06)));',
    ' vec3 wcol=mix(BLAU,mix(BLAU,BLANC,.2),st);',
    ' wcol=mix(wcol,MARI,clamp(smoothstep(-R*.25,0.,dc)*.35+step(0.,dc)*.25,0.,1.));',
    ' wcol+=clamp(h*1.1,0.,1.)*.28;',
    ' wcol+=.07*smoothstep(.55,1.,sin((qs.x*.8+qs.y)*.045+uT*1.8)*sin((qs.x-qs.y)*.03-uT*1.1));',
    ' float inner=smoothstep(-W*.03,0.,dc)*(1.-step(0.,dc));',
    ' wcol*=1.-inner*.35;',
    ' vec4 col=vec4(0.);',
    ' col=mix(col,vec4(rimCol,1.),ring);',
    ' col=mix(col,vec4(wcol,1.),water);',
    ' gl_FragColor=vec4(col.rgb*col.a,col.a);',
    '}'
  ].join('\n');

  function sh(type, src){ var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch(e){ pool.classList.add('pool-static'); return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['uRes', 'uT', 'uS', 'uDpr', 'uR'].forEach(function(n){ U[n] = gl.getUniformLocation(prog, n); });
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  var W = 0, dpr = 1, ripples = new Float32Array(40), rIdx = 0, t0 = performance.now();
  function now(){ return (performance.now() - t0) / 1000; }
  function ripple(x, y, amp){ var i = rIdx++ % 10; ripples[i*4] = x; ripples[i*4+1] = y; ripples[i*4+2] = now(); ripples[i*4+3] = amp; wake(); }

  function size(){
    W = pool.clientWidth; dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    gl.viewport(0, 0, cv.width, cv.height);
  }

  /* Nedador: molla cap al seu lloc, empès pel cursor */
  var pos = null, vel = {x:0, y:0}, mouse = null, lastEmit = 0, scrollP = 0;
  function home(){ return {x: W * .5 + W * .07, y: W * .46 + scrollP * W * .16}; }
  function clampIn(p){
    var c = W * .5, R = W * .43 * .58, dx = p.x - c, dy = p.y - c, d = Math.hypot(dx, dy);
    if (d > R){ p.x = c + dx / d * R; p.y = c + dy / d * R; }
  }
  function local(e){ var r = pool.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; }
  var lastMove = 0;
  hero.addEventListener('pointermove', function(e){
    var p = local(e), t = now();
    var inside = Math.hypot(p.x - W * .5, p.y - W * .5) < W * .45;
    if (mouse && inside && t - lastMove > .12){
      var sp = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (sp > 6) ripple(p.x, p.y, Math.min(1, sp / 40) * .8);
      lastMove = t;
    }
    mouse = inside ? p : null; wake();
  });
  hero.addEventListener('pointerleave', function(){ mouse = null; });
  pool.addEventListener('pointerdown', function(e){
    var p = local(e); ripple(p.x, p.y, 1.4);
    if (pos){ var dx = pos.x - p.x, dy = pos.y - p.y, d = Math.hypot(dx, dy) + 1; vel.x += dx / d * W * 1.6; vel.y += dy / d * W * 1.6; }
  });

  function updateScroll(){
    var hgt = hero.offsetHeight || 1;
    scrollP = Math.max(0, Math.min(1, window.scrollY / (hgt * .8)));
  }
  window.addEventListener('scroll', function(){ updateScroll(); wake(); }, {passive:true});

  var running = false, visible = true, last = 0, idle = 0;
  function frame(){
    if (!running) return;
    var t = now(), dt = Math.min(.033, t - last || .016); last = t;
    if (!pos){ pos = home(); }
    var h = home();
    var ax = (h.x - pos.x) * 7, ay = (h.y - pos.y) * 7;
    if (mouse){
      var dx = pos.x - mouse.x, dy = pos.y - mouse.y, d = Math.hypot(dx, dy), reach = W * .26;
      if (d < reach){ var f = (1 - d / reach); f = f * f * W * 9; ax += dx / (d + 1) * f; ay += dy / (d + 1) * f; }
    }
    vel.x = (vel.x + ax * dt) * Math.pow(.18, dt); vel.y = (vel.y + ay * dt) * Math.pow(.18, dt);
    pos.x += vel.x * dt; pos.y += vel.y * dt; clampIn(pos);
    var speed = Math.hypot(vel.x, vel.y);
    if (speed > W * .12 && t - lastEmit > .22){ ripple(pos.x, pos.y + W * .05, Math.min(1, speed / (W * .6))); lastEmit = t; }
    else if (!reduce && t - lastEmit > 2.6){ ripple(pos.x, pos.y + W * .05, .35); lastEmit = t; }
    var bob = reduce ? 0 : Math.sin(t * 1.6) * W * .006;
    var rot = -6 + vel.x * .02 + (reduce ? 0 : Math.sin(t * .9) * 2.5) + scrollP * 10;
    sw.style.transform = 'translate(' + (pos.x - sw.offsetWidth / 2).toFixed(1) + 'px,' + (pos.y - sw.offsetHeight / 2 + bob).toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg)';

    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uRes, cv.width, cv.height); gl.uniform1f(U.uT, t); gl.uniform1f(U.uS, scrollP);
    gl.uniform1f(U.uDpr, dpr); gl.uniform4fv(U.uR, ripples);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    idle = (reduce && speed < 1 && !mouse) ? idle + 1 : 0;
    if (!visible || idle > 90){ running = false; return; }
    requestAnimationFrame(frame);
  }
  function start(){ if (running) return; running = true; last = now(); requestAnimationFrame(frame); }
  function wake(){ idle = 0; if (visible) start(); }

  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if (visible) wake(); }, {rootMargin:'200px'}).observe(cv);
  }
  window.addEventListener('resize', function(){ size(); pos = null; wake(); });
  size(); updateScroll(); pool.classList.add('pool-live'); start();
})();
