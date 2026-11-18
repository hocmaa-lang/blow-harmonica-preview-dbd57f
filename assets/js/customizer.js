/* פאנל "התאמה אישית" — לתצוגה המקדימה בלבד (לא נכלל בשופיפיי) */
(function () {
  'use strict';
  var root = document.getElementById('eh');
  var panel = document.getElementById('cz');
  var gear = document.getElementById('czGear');
  if (!root || !panel || !gear) return;
  if (/[?&]clean=1/.test(location.search)) { gear.remove(); panel.remove(); return; }

  var KEY = 'eh-customizer-v1';
  var VARS = [
    ['--c-primary', 'ראשי'],
    ['--c-secondary', 'משני'],
    ['--c-bg', 'רקע'],
    ['--c-text', 'טקסט'],
    ['--c-accent', 'הדגשה']
  ];
  var PRESETS = [
    { name: 'זהב-שחור יוקרתי', c: { '--c-primary': '#C9A35C', '--c-secondary': '#2BB3C0', '--c-bg': '#14110E', '--c-text': '#F3ECE0', '--c-accent': '#E8C987' } },
    { name: 'כסף-כחול לילה', c: { '--c-primary': '#C9D2DD', '--c-secondary': '#2BB3C0', '--c-bg': '#0B1220', '--c-text': '#E8EEF6', '--c-accent': '#8FC3FF' } },
    { name: 'עץ-קרם חם', c: { '--c-primary': '#8A5A2B', '--c-secondary': '#1F7A80', '--c-bg': '#F4ECDF', '--c-text': '#2A2119', '--c-accent': '#C08A4A' } }
  ];
  var DEFAULTS = PRESETS[0].c;

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode */ } }
  var state = load(); state.colors = state.colors || {}; state.texts = state.texts || {};

  function lum(hex) {
    var h = hex.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h, 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  function applyColors() {
    VARS.forEach(function (v) {
      var val = state.colors[v[0]];
      if (val) root.style.setProperty(v[0], val); else root.style.removeProperty(v[0]);
    });
    var bg = state.colors['--c-bg'] || DEFAULTS['--c-bg'];
    var pr = state.colors['--c-primary'] || DEFAULTS['--c-primary'];
    // text on primary buttons: pick contrasting
    root.style.setProperty('--c-on-primary', lum(pr) > .55 ? '#15120f' : '#fffaf2');
    document.body.style.background = bg;
    var logoDark = lum(bg) > .6;
    Array.prototype.forEach.call(root.querySelectorAll('img[src*="logo-light"],img[src*="logo-dark"]'), function (img) {
      img.src = img.src.replace(logoDark ? 'logo-light' : 'logo-dark', logoDark ? 'logo-dark' : 'logo-light');
    });
    syncInputs();
  }
  function applyTexts() {
    Object.keys(state.texts).forEach(function (k) {
      Array.prototype.forEach.call(root.querySelectorAll('[data-k="' + k + '"]'), function (el) { el.innerHTML = state.texts[k]; });
    });
    if (window.EH_render) window.EH_render();
  }

  /* build UI */
  var presetsBox = document.getElementById('czPresets');
  PRESETS.forEach(function (p) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'cz__preset';
    b.innerHTML = '<span class="cz__dots">' + ['--c-bg', '--c-primary', '--c-secondary', '--c-text'].map(function (k) { return '<i style="background:' + p.c[k] + '"></i>'; }).join('') + '</span>' + p.name;
    b.addEventListener('click', function () { state.colors = Object.assign({}, p.c); save(state); applyColors(); });
    presetsBox.appendChild(b);
  });
  var colorsBox = document.getElementById('czColors');
  var inputs = {};
  VARS.forEach(function (v) {
    var l = document.createElement('label'); l.className = 'cz__color';
    var i = document.createElement('input'); i.type = 'color';
    i.addEventListener('input', function () { state.colors[v[0]] = i.value; save(state); applyColors(); });
    var s = document.createElement('span'); s.textContent = v[1];
    var code = document.createElement('code');
    l.appendChild(i); l.appendChild(s); l.appendChild(code);
    colorsBox.appendChild(l); inputs[v[0]] = { i: i, code: code };
  });
  function syncInputs() {
    VARS.forEach(function (v) {
      var val = (state.colors[v[0]] || DEFAULTS[v[0]]).toUpperCase();
      inputs[v[0]].i.value = val.length === 7 ? val : '#000000';
      inputs[v[0]].code.textContent = val;
    });
  }

  /* open/close */
  function toggle(open) { panel.hidden = !open; gear.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  gear.addEventListener('click', function () { toggle(panel.hidden); });
  document.getElementById('czClose').addEventListener('click', function () { toggle(false); });

  /* inline text editing */
  var editBox = document.getElementById('czEdit');
  function onEdit(e) {
    var el = e.target.closest('[data-k]'); if (!el) return;
    var k = el.getAttribute('data-k');
    state.texts[k] = el.innerHTML; save(state);
    Array.prototype.forEach.call(root.querySelectorAll('[data-k="' + k + '"]'), function (o) { if (o !== el) o.innerHTML = el.innerHTML; });
  }
  function blockNav(e) { if (root.classList.contains('cz-editing') && e.target.closest('[data-k]')) { e.preventDefault(); } }
  editBox.addEventListener('change', function () {
    var on = editBox.checked;
    root.classList.toggle('cz-editing', on);
    Array.prototype.forEach.call(root.querySelectorAll('[data-k]'), function (el) {
      if (el.tagName === 'TITLE') return;
      if (on) el.setAttribute('contenteditable', 'true'); else el.removeAttribute('contenteditable');
    });
  });
  root.addEventListener('input', function (e) { if (root.classList.contains('cz-editing')) onEdit(e); });
  root.addEventListener('click', blockNav, true);

  /* export / reset */
  document.getElementById('czExport').addEventListener('click', function () {
    var colors = {}; VARS.forEach(function (v) { colors[v[0]] = (state.colors[v[0]] || DEFAULTS[v[0]]).toUpperCase(); });
    var texts = Object.assign({}, window.EH_CONTENT || {}, state.texts);
    var data = { exported: new Date().toISOString(), colors: colors, texts: texts };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'blow-site-settings.json';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    if (window.EH_toast) window.EH_toast('ההגדרות יוצאו לקובץ JSON');
  });
  document.getElementById('czReset').addEventListener('click', function () {
    state = { colors: {}, texts: {} }; save(state);
    try { localStorage.removeItem(KEY); } catch (e) {}
    var C = window.EH_CONTENT || {};
    Array.prototype.forEach.call(root.querySelectorAll('[data-k]'), function (el) { var k = el.getAttribute('data-k'); if (C[k] != null) el.innerHTML = C[k]; });
    applyColors(); if (window.EH_render) window.EH_render();
    if (window.EH_toast) window.EH_toast('אופס לברירת המחדל');
  });

  applyColors(); applyTexts();
  window.EH_cz = { state: function () { return state; }, presets: PRESETS, applyPreset: function (i) { state.colors = Object.assign({}, PRESETS[i].c); save(state); applyColors(); } };
})();
