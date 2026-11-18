// Leonida Map – Spielkoordinaten in Metern (x = Ost, y = Nord), wie bei gta6map.github.io.
// Kacheln: 1024 px, Zoom 0–6, Welt 32768 m, Ursprung (0,0) bei Pixel 16384/16384 (Zoom 5 = 1 px/m).

const CATEGORIES = {
  landmark:  { label: 'Orte',          color: '#4fb3ff' },
  mission:   { label: 'Missionen',     color: '#ff4f9a' },
  side:      { label: 'Nebenmissionen',color: '#ffb84f' },
  secret:    { label: 'Secrets',       color: '#b84fff' },
  weapon:    { label: 'Waffen',        color: '#ff5a4f' },
  vehicle:   { label: 'Fahrzeuge',     color: '#4fff9a' },
  activity:  { label: 'Aktivitäten',   color: '#4ffff0' },
  shop:      { label: 'Shops',         color: '#ffe14f' },
};
const CERTAINTY = { confirmed: 'Bestätigt', likely: 'Wahrscheinlich', speculation: 'Spekulation' };
const DATA_FILES = ['data/landmarks.json', 'data/gtadb.json', 'data/pois.json'];

const crs = L.extend({}, L.CRS.Simple, { transformation: new L.Transformation(1 / 32, 512, -1 / 32, 512) });
const tileBounds = L.latLngBounds([-8192, -16384], [12288, 4096]);

const map = L.map('map', {
  crs, minZoom: 1, maxZoom: 8, zoomSnap: 0.25, attributionControl: true,
  maxBounds: tileBounds.pad(0.1), maxBoundsViscosity: 0.8,
});
// Kartenstile: „In-Game“ (yanis, HD-Universe-Look) und „Atlas“ (dupzor, farbiges Terrain)
const STYLES = { ingame: 'tiles/yanis', atlas: 'tiles/base' };
let style = (() => { try { return JSON.parse(localStorage.getItem('mapStyle')); } catch { return null; } })();
if (!STYLES[style]) style = 'ingame';
const base = L.tileLayer(`${STYLES[style]}/{z}/{z},{y},{x}.jpg`, {
  tileSize: 1024, maxNativeZoom: 6, minZoom: 1, maxZoom: 8, noWrap: true, bounds: tileBounds,
  attribution: 'Karte: gta6map.github.io (PD) · Orte: gtadb.org (CC BY 4.0) · Fan-Projekt, nicht mit Rockstar verbunden',
}).addTo(map);
document.body.dataset.style = style;
map.fitBounds([[-7000, -9000], [11000, 3500]]);

// ---------- Zustand ----------
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const found = new Set(store.get('found', []));
const hidden = new Set(store.get('hiddenCats', []));
let hideFound = store.get('hideFound', false);
let pois = [];
let selected = null;
const markers = new Map();
const cluster = L.markerClusterGroup({
  chunkedLoading: true, maxClusterRadius: 70, showCoverageOnHover: false, spiderfyDistanceMultiplier: 1.6,
  iconCreateFunction(cl) { // Ring zeigt den Kategorie-Mix des Clusters
    const ms = cl.getAllChildMarkers(), n = ms.length, cnt = {};
    ms.forEach((m) => (cnt[m.options.cat] = (cnt[m.options.cat] || 0) + 1));
    let a = 0;
    const seg = Object.entries(cnt).map(([k, v]) => { const s = a; a += (v / n) * 360; return `${CATEGORIES[k]?.color || '#fff'} ${s}deg ${a}deg`; });
    const size = n < 10 ? 36 : n < 100 ? 42 : n < 1000 ? 50 : 58;
    return L.divIcon({ className: 'cl', iconSize: [size, size],
      html: `<div style="background:conic-gradient(${seg.join(',')})"><span>${n}</span></div>` });
  },
});
map.addLayer(cluster);

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function icon(p) {
  const c = CATEGORIES[p.cat]?.color || '#fff';
  return L.divIcon({ className: '', iconSize: [20, 20],
    html: `<div class="pin ${esc(p.certainty)}${found.has(p.id) ? ' found' : ''}${p.id === selected ? ' sel' : ''}" style="--c:${c}"></div>` });
}

function render() {
  cluster.clearLayers();
  const visible = pois.filter((p) => !hidden.has(p.cat) && !(hideFound && found.has(p.id)));
  cluster.addLayers(visible.map((p) => markers.get(p.id)));
  renderChips();
}

function renderChips() {
  const stats = Object.entries(CATEGORIES).map(([k, c]) => {
    const all = pois.filter((p) => p.cat === k);
    return { k, c, n: all.length, f: all.filter((p) => found.has(p.id)).length, off: hidden.has(k) ? ' off' : '' };
  });
  $('#chips').innerHTML = stats.map(({ k, c, n, f, off }) => `<button class="chip${off}" data-cat="${k}" style="--c:${c.color};--p:${n ? (f / n) * 100 : 0}%">
      <i></i>${c.label}<small>${f} / ${n} gefunden</small><b></b></button>`).join('');
  // Schnellfilter: Kategorien mit Einträgen zuerst
  $('#quick').innerHTML = [...stats].sort((a, b) => (b.n > 0) - (a.n > 0)).map(({ k, c, n, off }) =>
    `<button class="qchip${off}${n ? '' : ' empty'}" data-cat="${k}" style="--c:${c.color}"><i></i>${c.label}<small>${n}</small></button>`).join('');
  $('#btn-filter').classList.toggle('on', hidden.size > 0 || hideFound);
}

// ---------- Sheets ----------
function openSheet(id) {
  ['#filter', '#detail', '#info'].forEach((s) => ($(s).hidden = s !== id));
  if (id !== '#detail') select(null);
}
function select(id) { // ausgewählten Pin pulsieren lassen
  const prev = selected; selected = id;
  for (const i of [prev, id]) { const p = i && pois.find((q) => q.id === i); if (p) markers.get(i).setIcon(icon(p)); }
}
function closeSheets() { openSheet(null); }

function showDetail(p) {
  const c = CATEGORIES[p.cat] || { label: p.cat, color: '#fff' };
  const isFound = found.has(p.id);
  $('#detail-body').innerHTML = `
    <div class="d-head" style="--c:${c.color}"><div class="d-icon"><i></i></div>
      <div><h2>${esc(p.name)}</h2><small>${esc(c.label)}${p.area ? ' · ' + esc(p.area) : ''}</small></div></div>
    <div class="tags"><span class="badge ${esc(p.certainty)}">${esc(CERTAINTY[p.certainty] || p.certainty)}</span>
      ${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    ${p.desc ? `<p>${esc(p.desc)}</p>` : ''}
    <dl class="meta"><dt>Quelle</dt><dd>${esc(p.source)}</dd><dt>Koordinaten</dt><dd>${p.x}, ${p.y}</dd></dl>
    <div class="actions">
      <button class="primary${isFound ? ' done' : ''}" id="btn-found">${isFound ? '✓ Gefunden' : 'Als gefunden markieren'}</button>
      <button class="ghost" id="btn-share" aria-label="Link teilen">Teilen</button>
    </div>`;
  $('#btn-found').onclick = () => { toggleFound(p); showDetail(p); };
  $('#btn-share').onclick = () => {
    const url = location.href.split('#')[0] + '#p=' + encodeURIComponent(p.id);
    if (navigator.share) navigator.share({ title: p.name, url }).catch(() => {});
    else navigator.clipboard?.writeText(url);
  };
  openSheet('#detail');
  select(p.id);
  history.replaceState(null, '', '#p=' + encodeURIComponent(p.id));
}

function toggleFound(p) {
  found.has(p.id) ? found.delete(p.id) : found.add(p.id);
  store.set('found', [...found]);
  markers.get(p.id).setIcon(icon(p));
  if (hideFound) render(); else renderChips();
}

function focus(p) {
  const m = markers.get(p.id);
  map.flyTo([p.y, p.x], Math.max(map.getZoom(), 5), { duration: 0.6 });
  if (!cluster.hasLayer(m)) { hidden.delete(p.cat); render(); }
  showDetail(p);
}

// ---------- UI-Events ----------
$('#btn-filter').onclick = () => ($('#filter').hidden ? openSheet('#filter') : closeSheets());
$('#btn-info').onclick = () => ($('#info').hidden ? openSheet('#info') : closeSheets());
$('#chips').onclick = $('#quick').onclick = (e) => {
  const k = e.target.closest('[data-cat]')?.dataset.cat; if (!k) return;
  hidden.has(k) ? hidden.delete(k) : hidden.add(k);
  store.set('hiddenCats', [...hidden]); render();
};
$('#hide-found').checked = hideFound;
$('#hide-found').onchange = (e) => { hideFound = e.target.checked; store.set('hideFound', hideFound); render(); };
$('#btn-reset').onclick = () => {
  if (!confirm('Alle „Gefunden“-Markierungen löschen?')) return;
  found.clear(); store.set('found', []); markers.forEach((m, id) => m.setIcon(icon(pois.find((p) => p.id === id)))); render();
};
map.on('click', () => { closeSheets(); $('#results').hidden = true; history.replaceState(null, '', location.pathname); });

$('#z-in').onclick = () => map.zoomIn();
$('#z-out').onclick = () => map.zoomOut();
$('#z-style').onclick = () => {
  style = style === 'ingame' ? 'atlas' : 'ingame';
  store.set('mapStyle', style);
  document.body.dataset.style = style;
  base.setUrl(`${STYLES[style]}/{z}/{z},{y},{x}.jpg`);
};
$('#z-home').onclick = () => map.flyToBounds([[-7000, -9000], [11000, 3500]], { duration: 0.6 });

// Sheets per Wischen nach unten schließen
document.querySelectorAll('.sheet').forEach((s) => {
  let y0 = null, dy = 0;
  s.addEventListener('touchstart', (e) => { if (s.scrollTop > 0) return; y0 = e.touches[0].clientY; dy = 0; s.style.transition = 'none'; }, { passive: true });
  s.addEventListener('touchmove', (e) => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); s.style.transform = `translateY(${dy}px)`; }, { passive: true });
  s.addEventListener('touchend', () => {
    if (y0 === null) return; y0 = null; s.style.transition = ''; s.style.transform = '';
    if (dy > 80) closeSheets();
  });
});

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
$('#search').oninput = (e) => {
  const q = norm(e.target.value.trim());
  const ul = $('#results');
  if (q.length < 2) { ul.hidden = true; return; }
  const hits = pois.filter((p) => norm(`${p.name} ${p.area} ${p.desc}`).includes(q)).slice(0, 30);
  ul.innerHTML = hits.map((p) => `<li data-id="${esc(p.id)}" style="--c:${CATEGORIES[p.cat]?.color || '#fff'}"><i></i><div>${esc(p.name)}<small>${esc(CATEGORIES[p.cat]?.label)}${p.area ? ' · ' + esc(p.area) : ''}</small></div></li>`).join('')
    || '<li class="muted">Keine Treffer</li>';
  ul.hidden = false;
};
$('#results').onclick = (e) => {
  const id = e.target.closest('li')?.dataset.id; if (!id) return;
  $('#results').hidden = true; $('#search').blur(); focus(pois.find((p) => p.id === id));
};

// ---------- Daten laden ----------
Promise.all(DATA_FILES.map((f) => fetch(f).then((r) => (r.ok ? r.json() : [])).catch(() => [])))
  .then((lists) => {
    pois = lists.flat().filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    for (const p of pois) {
      const m = L.marker([p.y, p.x], { icon: icon(p), title: p.name, cat: p.cat });
      m.on('click', () => showDetail(p));
      markers.set(p.id, m);
    }
    render();
    const id = decodeURIComponent((location.hash.match(/#p=(.+)/) || [])[1] || '');
    const p = pois.find((q) => q.id === id);
    if (p) focus(p);
  });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
