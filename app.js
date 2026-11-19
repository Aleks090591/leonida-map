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
  crs, minZoom: 0, maxZoom: 8, zoomSnap: 0.25, attributionControl: true,
  maxBounds: tileBounds.pad(0.1), maxBoundsViscosity: 0.8,
});
// Kartenstile: „In-Game“ (yanis, HD-Universe-Look), „Atlas“ (dupzor, farbiges Terrain), „Day“ (gtadb, offizielle Karte)
const STYLES = { ingame: 'tiles/yanis', atlas: 'tiles/base', day: 'tiles/day' };
const NATIVE = { ingame: 5, atlas: 6, day: 6 }; // höchste vorhandene Kachel-Zoomstufe je Stil
let style = (() => { try { return JSON.parse(localStorage.getItem('mapStyle')); } catch { return null; } })();
if (!STYLES[style]) style = 'ingame';
const base = L.tileLayer(`${STYLES[style]}/{z}/{z},{y},{x}.jpg`, {
  tileSize: 1024, maxNativeZoom: NATIVE[style], minZoom: 0, maxZoom: 8, noWrap: true, bounds: tileBounds,
  attribution: '<a href="https://gtadb.org">gtadb.org</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>',
}).addTo(map);
map.attributionControl.setPrefix(false);
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
  const F = stats.reduce((s, x) => s + x.f, 0), N = stats.reduce((s, x) => s + x.n, 0), P = N ? Math.round((F / N) * 100) : 0;
  $('#total').innerHTML = `<div><b>${F} / ${N}</b> gefunden<span>${P} %</span></div><i style="--p:${N ? (F / N) * 100 : 0}%"></i>`;
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

// Abgleich: gleicher Name aus anderer Quelle, nächster Treffer im Umkreis von 600 m
const key = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function counterpart(p) {
  const k = key(p.name);
  return pois.filter((q) => q.source !== p.source && key(q.name) === k)
    .map((q) => ({ q, d: Math.hypot(q.x - p.x, q.y - p.y) }))
    .filter((m) => m.d <= 600).sort((a, b) => a.d - b.d)[0];
}

function showDetail(p) {
  const c = CATEGORIES[p.cat] || { label: p.cat, color: '#fff' };
  const isFound = found.has(p.id), cmp = counterpart(p);
  $('#detail-body').innerHTML = `
    <div class="d-head" style="--c:${c.color}"><div class="d-icon"><i></i></div>
      <div><h2>${esc(p.name)}</h2><small>${esc(c.label)}${p.area ? ' · ' + esc(p.area) : ''}</small></div></div>
    <div class="tags"><span class="badge ${esc(p.certainty)}">${esc(CERTAINTY[p.certainty] || p.certainty)}</span>
      ${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    ${p.desc ? `<p>${esc(p.desc)}</p>` : ''}
    <dl class="meta"><dt>Quelle</dt><dd>${esc(p.source)}${p.url ? ` · <a href="${esc(p.url)}" target="_blank" rel="noopener">ansehen</a>` : ''}</dd>
      <dt>Koordinaten</dt><dd><button class="link" id="btn-xy">${p.x}, ${p.y} ⧉</button></dd>
      ${Object.entries(p.info || {}).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}
      <dt>Abgleich</dt><dd>${cmp ? `<button class="link" id="btn-cmp">${cmp.d <= 25 ? '✓ stimmt überein' : 'Abweichung'}
        (${Math.round(cmp.d)} m) · ${esc(cmp.q.source.split(' (')[0])}</button>` : '<span class="muted">keine zweite Quelle</span>'}</dd></dl>
    <div class="actions">
      <button class="primary${isFound ? ' done' : ''}" id="btn-found">${isFound ? '✓ Gefunden' : 'Als gefunden markieren'}</button>
      <button class="ghost" id="btn-share" aria-label="Link teilen">Teilen</button>
    </div>`;
  $('#btn-found').onclick = () => { toggleFound(p); showDetail(p); };
  $('#btn-xy').onclick = (e) => { navigator.clipboard?.writeText(`${p.x}, ${p.y}`); e.target.textContent = 'Kopiert ✓'; };
  if (cmp) $('#btn-cmp').onclick = () => focus(cmp.q);
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
// ---------- Eigene Notizen ----------
let notes = store.get('notes', []);
const noteLayer = L.layerGroup().addTo(map);
function renderNotes() {
  noteLayer.clearLayers();
  for (const n of notes) {
    L.marker([n.y, n.x], { icon: L.divIcon({ className: '', iconSize: [28, 28], html: '<div class="note-pin">✎</div>' }), title: n.text })
      .bindPopup(() => notePopup(n), { closeButton: false, className: 'xy-pop' }).addTo(noteLayer);
  }
}
function notePopup(n) {
  const d = L.DomUtil.create('div', 'note-pop');
  d.innerHTML = `<p>${esc(n.text)}</p><button class="link" data-a="edit">Bearbeiten</button> · <button class="link" data-a="del">Löschen</button>`;
  d.onclick = (e) => {
    const a = e.target.dataset.a;
    if (a === 'edit') { const t = prompt('Notiz bearbeiten:', n.text); if (t?.trim()) { n.text = t.trim(); saveNotes(); } }
    if (a === 'del' && confirm('Notiz löschen?')) { notes = notes.filter((q) => q !== n); saveNotes(); }
  };
  return d;
}
function saveNotes() { store.set('notes', notes); map.closePopup(); renderNotes(); }
function addNote(ll) {
  const t = prompt('Notiz für diesen Punkt:'); if (!t?.trim()) return;
  notes.push({ id: Date.now().toString(36), x: Math.round(ll.lng), y: Math.round(ll.lat), text: t.trim() });
  saveNotes();
}
renderNotes();

// ---------- Entfernung messen (Spielkoordinaten = Meter) ----------
let measureFrom = null;
const measureLayer = L.layerGroup().addTo(map);
const dot = (ll) => L.circleMarker(ll, { radius: 6, weight: 2, color: '#fff', fillColor: '#ff4f9a', fillOpacity: 1 }).addTo(measureLayer);
const fmtDist = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2).replace('.', ',')} km`);

// Langes Drücken (bzw. Rechtsklick) auf die Karte: Koordinate kopieren, Notiz setzen, Messen starten
map.on('contextmenu', (e) => {
  const xy = `${Math.round(e.latlng.lng)}, ${Math.round(e.latlng.lat)}`;
  const d = L.DomUtil.create('div', 'ctx');
  d.innerHTML = `<button class="link" data-a="xy">${xy} ⧉</button><button class="link" data-a="note">✎ Notiz setzen</button><button class="link" data-a="measure">📏 Messen ab hier</button>`;
  d.onclick = (ev) => {
    const a = ev.target.dataset.a;
    if (a === 'xy') { navigator.clipboard?.writeText(xy); ev.target.textContent = 'Kopiert ✓'; }
    if (a === 'note') { map.closePopup(); addNote(e.latlng); }
    if (a === 'measure') {
      map.closePopup(); measureLayer.clearLayers(); measureFrom = e.latlng;
      dot(e.latlng).bindTooltip('Ziel auf der Karte antippen', { permanent: true, direction: 'top', className: 'dist' }).openTooltip();
    }
  };
  L.popup({ closeButton: false, className: 'xy-pop' }).setLatLng(e.latlng).setContent(d).openOn(map);
});
map.on('click', (e) => {
  if (measureFrom) { // zweiter Punkt: Linie + Entfernung anzeigen
    const a = measureFrom; measureFrom = null; measureLayer.clearLayers();
    dot(a); dot(e.latlng);
    L.polyline([a, e.latlng], { color: '#ff4f9a', weight: 3, dashArray: '6 6' }).addTo(measureLayer)
      .bindTooltip(fmtDist(Math.hypot(e.latlng.lng - a.lng, e.latlng.lat - a.lat)), { permanent: true, direction: 'center', className: 'dist' }).openTooltip();
    return;
  }
  measureLayer.clearLayers();
  closeSheets(); $('#results').hidden = true; history.replaceState(null, '', location.pathname);
});

// ---------- Sync-Link: Fortschritt + Notizen komprimiert im Link (#sync=…) ----------
async function packSync() {
  const s = new Blob([JSON.stringify({ found: [...found], notes })]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const u8 = new Uint8Array(await new Response(s).arrayBuffer());
  let bin = ''; for (const b of u8) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function unpackSync(str) {
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  const s = new Blob([Uint8Array.from(bin, (c) => c.charCodeAt(0))]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return JSON.parse(await new Response(s).text());
}
$('#btn-sync').onclick = async () => {
  const url = location.href.split('#')[0] + '#sync=' + (await packSync());
  if (navigator.share) navigator.share({ title: 'Leonida Map – Sync', url }).catch(() => {});
  else { navigator.clipboard?.writeText(url); $('#btn-sync').textContent = 'Link kopiert ✓'; }
};
async function importSync() {
  const m = location.hash.match(/#sync=(.+)/); if (!m) return;
  history.replaceState(null, '', location.pathname);
  let d; try { d = await unpackSync(m[1]); } catch { alert('Sync-Link ist ungültig.'); return; }
  const f = (d.found || []).filter((id) => !found.has(id)), n = (d.notes || []).filter((x) => !notes.some((q) => q.id === x.id));
  if (!f.length && !n.length) { alert('Sync-Link: nichts Neues – alles schon vorhanden.'); return; }
  if (!confirm(`Sync-Link übernehmen?\n${f.length} neue Gefunden-Markierungen, ${n.length} neue Notizen (wird zusammengeführt).`)) return;
  f.forEach((id) => found.add(id)); store.set('found', [...found]);
  notes = notes.concat(n); saveNotes();
  markers.forEach((mk, id) => mk.setIcon(icon(pois.find((p) => p.id === id)))); render();
}

$('#z-in').onclick = () => map.zoomIn();
$('#z-out').onclick = () => map.zoomOut();
$('#z-style').onclick = () => {
  const keys = Object.keys(STYLES);
  style = keys[(keys.indexOf(style) + 1) % keys.length];
  store.set('mapStyle', style);
  document.body.dataset.style = style;
  base.options.maxNativeZoom = NATIVE[style];
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
    // Datenstand: jüngstes „Zuletzt bearbeitet“ der gtadb-Einträge
    const last = pois.map((p) => p.info?.['Zuletzt bearbeitet']).filter(Boolean).map((s) => s.split('.').reverse().join('-')).sort().at(-1);
    if (last) $('#data-date').textContent = `Daten aktualisiert am ${last.split('-').reverse().join('.')} (gtadb.org)`;
    importSync();
    const id = decodeURIComponent((location.hash.match(/#p=(.+)/) || [])[1] || '');
    const p = pois.find((q) => q.id === id);
    if (p) focus(p);
  });

// iOS: Browser-Pinch/Pull-to-Refresh unterbinden (sonst lädt die Seite beim Rauszoomen neu)
for (const ev of ['gesturestart', 'gesturechange']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });

if ('serviceWorker' in navigator) {
  // Neue Version aktiv → einmal neu laden (nicht beim allerersten Installieren)
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) location.reload(); });
  navigator.serviceWorker.register('sw.js').then((reg) =>
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update(); }));
}
