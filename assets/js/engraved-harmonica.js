/* Blow — Engraved Harmonica landing: studio, reveal, parallax, lightbox, cart */
(function () {
  'use strict';
  var root = document.getElementById('eh');
  if (!root) return;
  root.classList.add('js');
  var $ = function (s, c) { return (c || root).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- content (single source: window.EH_CONTENT) ---------- */
  var C = window.EH_CONTENT || {};
  if (window.EH_CONTENT) {
    $$('[data-k]').forEach(function (el) {
      var k = el.getAttribute('data-k');
      if (C[k] != null) el.innerHTML = C[k];
    });
  }
  var t = function (k, fb) { var el = $('[data-k="' + k + '"]'); return el ? el.textContent.trim() : (C[k] || fb || ''); };

  /* ---------- nav / sticky ---------- */
  var nav = document.getElementById('ehNav');
  var sticky = document.getElementById('ehSticky');
  var studio = document.getElementById('studio');
  function onScroll() {
    var y = window.scrollY || 0;
    if (nav) nav.classList.toggle('is-solid', y > 40);
    if (sticky && studio) {
      var r = studio.getBoundingClientRect();
      var inStudio = r.top < innerHeight * .6 && r.bottom > innerHeight * .4;
      sticky.classList.toggle('is-on', y > innerHeight * .8 && !inStudio);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reveal ---------- */
  var rev = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rev.forEach(function (el) {
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty('--d', Math.min(sib, 6) * 0.08 + 's');
      io.observe(el);
    });
  } else rev.forEach(function (el) { el.classList.add('is-in'); });

  /* ---------- parallax ---------- */
  var par = $$('[data-parallax]');
  if (par.length && !reduce) {
    var ticking = false;
    var run = function () {
      par.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        var f = parseFloat(el.getAttribute('data-parallax')) || .2;
        var off = (r.top + r.height / 2 - innerHeight / 2) * -f;
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }

  /* ---------- hero video: keep playing, respect data saver ---------- */
  var vid = $('.eh-hero__video');
  if (vid) {
    vid.muted = true;
    var p = vid.play && vid.play();
    if (p && p.catch) p.catch(function () { /* poster stays */ });
  }

  /* ---------- engraving studio ---------- */
  var form = document.getElementById('ehForm');
  var plate = document.getElementById('ehPlate');
  var input = document.getElementById('ehText');
  var out = document.getElementById('ehEngrave');
  var count = document.getElementById('ehCount');
  var summary = document.getElementById('ehSummary');
  var finishName = document.getElementById('ehFinishName');
  var err = document.getElementById('ehError');
  var MAX = input ? parseInt(input.getAttribute('maxlength'), 10) || 20 : 20;

  function chars(s) { return Array.from ? Array.from(s).length : s.length; }
  function clip(s) { return Array.from ? Array.from(s).slice(0, MAX).join('') : s.slice(0, MAX); }

  function fit() {
    if (!out) return;
    var face = out.parentElement;
    var size = 9; // cqw of the plate
    out.style.setProperty('--es', size + 'cqw');
    var guard = 0;
    while (out.scrollWidth > face.clientWidth * .96 && size > 2.2 && guard++ < 40) {
      size -= .35;
      out.style.setProperty('--es', size + 'cqw');
    }
  }
  var burnT;
  function burn() {
    if (!plate || reduce) return;
    plate.classList.remove('is-burn'); void plate.offsetWidth; plate.classList.add('is-burn');
    clearTimeout(burnT); burnT = setTimeout(function () { plate.classList.remove('is-burn'); }, 950);
  }
  function current() {
    var f = form.querySelector('input[name="properties[Font]"]:checked');
    var fin = form.querySelector('input[name="properties[Finish]"]:checked');
    return {
      text: input.value.trim(),
      font: f ? f.getAttribute('data-font') : 'script',
      fontLabel: f ? f.parentElement.textContent.trim() : '',
      finish: fin ? fin.getAttribute('data-finish') : 'silver',
      finishLabel: fin ? (fin.parentElement.querySelector('em') || {}).textContent || fin.getAttribute('data-label') : ''
    };
  }
  function render(animate) {
    if (!form) return;
    var s = current();
    var shown = s.text || input.getAttribute('data-default') || '';
    out.textContent = shown;
    out.className = 'eh-engrave f-' + s.font;
    plate.setAttribute('data-finish', s.finish);
    $$('[data-finish-img]', plate).forEach(function (img) {
      var on = img.getAttribute('data-finish-img') === s.finish;
      if (on && img.loading === 'lazy') img.loading = 'eager';
      img.classList.toggle('is-on', on);
    });
    if (finishName) finishName.textContent = s.finishLabel;
    var n = chars(input.value);
    count.textContent = n + '/' + MAX;
    count.classList.toggle('is-max', n >= MAX);
    summary.innerHTML = s.text
      ? '<b>' + esc(s.text) + '</b> · ' + esc(s.fontLabel) + ' · ' + esc(s.finishLabel)
      : esc(s.fontLabel) + ' · ' + esc(s.finishLabel);
    if (err && s.text) err.hidden = true;
    if (document.fonts && document.fonts.load) {
      var fam = getComputedStyle(out).fontFamily;
      document.fonts.load('40px ' + fam, shown).then(fit, fit);
    }
    fit();
    if (animate) burn();
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  if (form && input) {
    var typingT;
    input.addEventListener('input', function () {
      if (chars(input.value) > MAX) input.value = clip(input.value);
      render(false);
      clearTimeout(typingT); typingT = setTimeout(function () { burn(); }, 450);
    });
    $$('[data-symbol]').forEach(function (b) {
      b.addEventListener('click', function () {
        var sym = b.getAttribute('data-symbol');
        var v = input.value;
        var add = (v && !/\s$/.test(v) ? ' ' : '') + sym;
        if (chars(v + add) <= MAX) input.value = v + add;
        input.focus();
        render(true);
      });
    });
    $$('input[type=radio]', form).forEach(function (r) { r.addEventListener('change', function () { render(true); }); });

    /* light follows pointer on plate */
    plate.addEventListener('pointermove', function (e) {
      var r = plate.getBoundingClientRect();
      plate.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      plate.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { render(false); });
    render(false);
    setTimeout(burn, 900);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = current();
      if (!s.text) {
        if (err) err.hidden = false;
        studio.classList.remove('shake'); void studio.offsetWidth; studio.classList.add('shake');
        input.focus();
        return;
      }
      var props = { 'Engraving Text': s.text, 'Font': form.querySelector('input[name="properties[Font]"]:checked').value, 'Finish': form.querySelector('input[name="properties[Finish]"]:checked').value };
      if (form.getAttribute('data-shopify') === '1') {
        // pick variant by finish if mapped
        var map = {}; try { map = JSON.parse(form.getAttribute('data-variants') || '{}'); } catch (x) {}
        var idIn = form.querySelector('input[name="id"]');
        if (idIn && map[s.finish]) idIn.value = map[s.finish];
        var btn = document.getElementById('ehAdd'); btn.disabled = true;
        fetch((window.Shopify && Shopify.routes ? Shopify.routes.root : '/') + 'cart/add.js', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ items: [{ id: Number(idIn.value), quantity: 1, properties: props }] })
        }).then(function (r) { if (!r.ok) throw r; return r.json(); })
          .then(function () { toast(t('studio_added', 'נוסף לסל ✓')); setTimeout(function () { location.href = (form.getAttribute('data-cart-url') || '/cart'); }, 700); })
          .catch(function () { form.submit(); })
          .finally(function () { btn.disabled = false; });
      } else {
        // static preview: show what would be sent to Shopify
        toast(t('studio_added', 'נוסף לסל ✓') + ' — ' + s.text + ' · ' + s.fontLabel + ' · ' + s.finishLabel);
        window.EH_LAST_CART = props;
        try { console.info('[preview] line item properties', props); } catch (x) {}
      }
    });
  }

  /* ---------- toast ---------- */
  var toastEl = document.getElementById('ehToast'), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3200);
  }
  window.EH_toast = toast;

  /* ---------- lightbox ---------- */
  var lb = document.getElementById('ehLb');
  var tiles = $$('.eh-tile');
  var idx = 0;
  function openLb(i) {
    idx = (i + tiles.length) % tiles.length;
    var tl = tiles[idx];
    var img = lb.querySelector('img');
    img.src = tl.getAttribute('data-full');
    img.alt = tl.getAttribute('data-cap') || '';
    lb.querySelector('figcaption').textContent = tl.getAttribute('data-cap') || '';
    lb.hidden = false; document.documentElement.style.overflow = 'hidden';
  }
  function closeLb() { lb.hidden = true; document.documentElement.style.overflow = ''; }
  if (lb && tiles.length) {
    tiles.forEach(function (tl, i) { tl.addEventListener('click', function () { openLb(i); }); });
    lb.querySelector('.eh-lb__x').addEventListener('click', closeLb);
    lb.querySelector('.eh-lb__prev').addEventListener('click', function (e) { e.stopPropagation(); openLb(idx - 1); });
    lb.querySelector('.eh-lb__next').addEventListener('click', function (e) { e.stopPropagation(); openLb(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') openLb(idx + 1);
      if (e.key === 'ArrowRight') openLb(idx - 1);
    });
    var sx = 0;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) openLb(idx + (dx > 0 ? 1 : -1)); });
  }

  /* ---------- FAQ: one open at a time ---------- */
  $$('.eh-q').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) $$('.eh-q').forEach(function (o) { if (o !== d) o.open = false; }); });
  });

  window.EH_render = function () { render(false); };
})();
