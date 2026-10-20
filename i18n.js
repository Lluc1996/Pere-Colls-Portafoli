/* Can Colls Disseny · idiomes
   El català és l'idioma de sèrie. Cada bloc de text es tradueix sencer; les etiquetes internes
   (enllaços, negretes...) es converteixen en marcadors [1]…[/1] perquè la traducció no toqui l'HTML. */
(function(){
  var LANGS = {ca:'CA', en:'EN', es:'ES', ja:'JA', zh:'ZH', fr:'FR', de:'DE'};
  var HTML_LANG = {ca:'ca', en:'en', es:'es', ja:'ja', zh:'zh-Hans', fr:'fr', de:'de'};
  var LEAF = /^(P|H1|H2|H3|H4|H5|H6|LI|DT|DD|FIGCAPTION|BUTTON|A|SPAN|B|STRONG|SMALL|EM|I|LABEL|SUP)$/;
  var INLINE = /^(A|B|STRONG|SMALL|EM|I|SPAN|SUP|SUB|BR|IMG|WBR)$/;
  var SKIP = /^(SCRIPT|STYLE|SVG|CANVAS|NOSCRIPT|TEMPLATE|TEXTAREA|SELECT|DIALOG)$/;
  var VOID = /^(BR|IMG|WBR)$/;

  function onlyInline(el){
    var all = el.getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) if (!INLINE.test(all[i].tagName)) return false;
    return true;
  }
  function tokenize(el){
    var tags = [], n = 0;
    function walk(node){
      var out = '';
      node.childNodes.forEach(function(c){
        if (c.nodeType === 3) out += c.nodeValue;
        else if (c.nodeType === 1){
          var k = ++n, shell = c.cloneNode(false).outerHTML;
          if (VOID.test(c.tagName)){ tags[k] = {open:shell, close:''}; out += '[' + k + '/]'; }
          else {
            var cut = shell.lastIndexOf('</');
            tags[k] = {open:shell.slice(0, cut), close:shell.slice(cut)};
            out += '[' + k + ']' + walk(c) + '[/' + k + ']';
          }
        }
      });
      return out;
    }
    var text = walk(el).replace(/\s+/g, ' ').trim();
    return {key:text, tags:tags};
  }
  function esc(s){ return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function rebuild(str, tags){
    return str.split(/(\[\/?\d+\/?\])/).map(function(part){
      var m = /^\[(\/?)(\d+)(\/?)\]$/.exec(part);
      if (!m) return esc(part);
      var t = tags[+m[2]]; if (!t) return '';
      return m[1] ? t.close : t.open;
    }).join('');
  }
  var worthy = /[A-Za-zÀ-ÿ぀-ヿ㐀-鿿]{2,}/;
  var blocks = [];
  function collect(node){
    for (var c = node.firstElementChild; c; c = c.nextElementSibling){
      if (SKIP.test(c.tagName) || c.getAttribute('translate') === 'no' || c.hasAttribute('data-no-i18n')) continue;
      if (LEAF.test(c.tagName) && onlyInline(c) && worthy.test(c.textContent)){
        var t = tokenize(c);
        blocks.push({el:c, key:t.key, tags:t.tags, orig:c.innerHTML, text:c.id === 'manifest' ? c.textContent.trim() : null});
      } else collect(c);
    }
  }
  collect(document.body);
  var titleOrig = document.title;

  var cache = {ca:{}}, current = 'ca';
  function get(lang){
    if (cache[lang]) return Promise.resolve(cache[lang]);
    return fetch('i18n/' + lang + '.json').then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(d){ cache[lang] = d; return d; });
  }
  function apply(lang, dict){
    current = lang;
    blocks.forEach(function(b){
      var tr = lang === 'ca' ? null : dict[b.key];
      if (b.text !== null){
        var plain = tr ? tr.replace(/\[\/?\d+\/?\]/g, '') : b.text;
        if (window.CC && window.CC.setManifest) window.CC.setManifest(plain); else b.el.textContent = plain;
        return;
      }
      b.el.innerHTML = tr ? rebuild(tr, b.tags) : b.orig;
    });
    document.title = (lang !== 'ca' && dict['@title:' + titleOrig]) || titleOrig;
    document.documentElement.lang = HTML_LANG[lang];
    var cur = document.getElementById('lang-cur'); if (cur) cur.textContent = LANGS[lang];
    var opts = document.querySelectorAll('#lang-list [data-lang]');
    Array.prototype.forEach.call(opts, function(o){ o.setAttribute('aria-selected', o.dataset.lang === lang ? 'true' : 'false'); });
    if (window.CC && window.CC.relayoutMenu) window.CC.relayoutMenu();
    window.dispatchEvent(new Event('resize'));
  }
  function setLang(lang){
    if (!LANGS[lang]) lang = 'ca';
    try { localStorage.setItem('cc-lang', lang); } catch(e){}
    if (lang === 'ca') return apply('ca', {});
    get(lang).then(function(d){ apply(lang, d); }, function(){ apply('ca', {}); });
  }

  /* Selector */
  var btn = document.getElementById('lang-btn'), list = document.getElementById('lang-list');
  function open(v){
    if (!list) return;
    list.hidden = !v; btn.setAttribute('aria-expanded', v ? 'true' : 'false');
    if (v){ var sel = list.querySelector('[aria-selected="true"]') || list.querySelector('button'); if (sel) sel.focus(); }
  }
  if (btn && list){
    btn.addEventListener('click', function(e){ e.stopPropagation(); open(list.hidden); });
    list.addEventListener('click', function(e){
      var b = e.target.closest('[data-lang]'); if (!b) return;
      setLang(b.dataset.lang); open(false); btn.focus();
    });
    list.addEventListener('keydown', function(e){
      var items = Array.prototype.slice.call(list.querySelectorAll('button')), i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown'){ e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp'){ e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Escape'){ open(false); btn.focus(); }
    });
    document.addEventListener('click', function(e){ if (!list.hidden && !list.contains(e.target)) open(false); });
  }

  window.CCI18N = {
    keys: function(){ var o = blocks.map(function(b){ return b.text !== null ? b.text : b.key; }); o.push('@title:' + titleOrig); return o; },
    set: setLang,
    t: function(s){ return (current !== 'ca' && cache[current] && cache[current][s]) || s; }
  };

  var saved = 'ca';
  try { saved = localStorage.getItem('cc-lang') || 'ca'; } catch(e){}
  /* Esperar que app.js hagi preparat el manifest i el menú */
  if (saved !== 'ca') setTimeout(function(){ setLang(saved); }, 0);
  else apply('ca', {});
})();
