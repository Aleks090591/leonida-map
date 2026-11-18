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
L.tileLayer('tiles/base/{z}/{z},{y},{x}.jpg', {
  tileSize: 1024, maxNativeZoom: 6, minZoom: 1, maxZoom: 8, noWrap: true, bounds: tileBounds,
  attribution: 'Karte: gta6map.github.io (PD) · Orte: gtadb.org (CC BY 4.0) · Fan-Projekt, nicht mit Rockstar verbunden',
}).addTo(map);
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
const markers = new Map();
const cluster = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 45, showCoverageOnHover: false });
map.addLayer(cluster);

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function icon(p) {
  const c = CATEGORIES[p.cat]?.color || '#fff';
  return L.divIcon({ className: '', iconSize: [16, 16],
    html: `<div class="pin${found.has(p.id) ? ' found' : ''}" style="background:${c}"></div>` });
}

function render() {
  cluster.clearLayers();
  const visible = pois.filter((p) => !hidden.has(p.cat) && !(hideFound && found.has(p.id)));
  cluster.addLayers(visible.map((p) => markers.get(p.id)));
  renderChips();
}

function renderChips() {
  $('#chips').innerHTML = Object.entries(CATEGORIES).map(([k, c]) => {
    const all = pois.filter((p) => p.cat === k);
    const f = all.filter((p) => found.has(p.id)).length;
    return `<button class="chip${hidden.has(k) ? ' off' : ''}" data-cat="${k}">
      <i style="background:${c.color}"></i>${c.label} <small>${f}/${all.length}</small></button>`;
  }).join('');
}

// ---------- Sheets ----------
function openSheet(id) {
  ['#filter', '#detail', '#info'].forEach((s) => ($(s).hidden = s !== id));
}
function closeSheets() { openSheet(null); }

function showDetail(p) {
  const c = CATEGORIES[p.cat] || { label: p.cat, color: '#fff' };
  const isFound = found.has(p.id);
  $('#detail-body').innerHTML = `
    <h2>${esc(p.name)}</h2>
    <div><span class="dot" style="background:${c.color}"></span> ${esc(c.label)}${p.area ? ' · ' + esc(p.area) : ''}</div>
    <p><span class="badge ${esc(p.certainty)}">${esc(CERTAINTY[p.certainty] || p.certainty)}</span>
       ${p.tags?.length ? '<small> ' + p.tags.map(esc).join(', ') + '</small>' : ''}</p>
    ${p.desc ? `<p>${esc(p.desc)}</p>` : ''}
    <small>Quelle: ${esc(p.source)}</small><br>
    <small>Koordinaten: ${p.x}, ${p.y}</small><br>
    <button class="primary${isFound ? ' done' : ''}" id="btn-found">${isFound ? '✓ Gefunden' : 'Als gefunden markieren'}</button>
    <button class="ghost" id="btn-share">Link teilen</button>`;
  $('#btn-found').onclick = () => { toggleFound(p); showDetail(p); };
  $('#btn-share').onclick = () => {
    const url = location.href.split('#')[0] + '#p=' + encodeURIComponent(p.id);
    if (navigator.share) navigator.share({ title: p.name, url }).catch(() => {});
    else navigator.clipboard?.writeText(url);
  };
  openSheet('#detail');
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
$('#chips').onclick = (e) => {
  const k = e.target.closest('.chip')?.dataset.cat; if (!k) return;
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

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
$('#search').oninput = (e) => {
  const q = norm(e.target.value.trim());
  const ul = $('#results');
  if (q.length < 2) { ul.hidden = true; return; }
  const hits = pois.filter((p) => norm(`${p.name} ${p.area} ${p.desc}`).includes(q)).slice(0, 30);
  ul.innerHTML = hits.map((p) => `<li data-id="${esc(p.id)}">${esc(p.name)}<small>${esc(CATEGORIES[p.cat]?.label)} · ${esc(p.area)}</small></li>`).join('')
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
      const m = L.marker([p.y, p.x], { icon: icon(p), title: p.name });
      m.on('click', () => showDetail(p));
      markers.set(p.id, m);
    }
    render();
    const id = decodeURIComponent((location.hash.match(/#p=(.+)/) || [])[1] || '');
    const p = pois.find((q) => q.id === id);
    if (p) focus(p);
  });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
