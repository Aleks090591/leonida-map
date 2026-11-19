// Leonida Map – Spielkoordinaten in Metern (x = Ost, y = Nord), wie bei gta6map.github.io.
// Kacheln: 1024 px, Zoom 0–6, Welt 32768 m, Ursprung (0,0) bei Pixel 16384/16384 (Zoom 5 = 1 px/m).

// Beschriftungen kommen aus I18N (cat.*)
const CATEGORIES = {
  landmark: { color: '#4fb3ff' }, mission: { color: '#ff4f9a' }, side: { color: '#ffb84f' }, secret: { color: '#b84fff' },
  weapon: { color: '#ff5a4f' }, vehicle: { color: '#4fff9a' }, activity: { color: '#4ffff0' }, shop: { color: '#ffe14f' },
};
const DATA_FILES = ['data/landmarks.json', 'data/gtadb.json', 'data/pois.json'];

const crs = L.extend({}, L.CRS.Simple, { transformation: new L.Transformation(1 / 32, 512, -1 / 32, 512) });
const tileBounds = L.latLngBounds([-8192, -16384], [12288, 4096]);

const map = L.map('map', {
  crs, minZoom: 0, maxZoom: 8, zoomSnap: 0.25, attributionControl: true,
  maxBounds: tileBounds.pad(0.1), maxBoundsViscosity: 0.8,
});
// Kartenstile: „In-Game“ (yanis, HD-Universe-Look), „Atlas“ (dupzor, farbiges Terrain), „Day“ (gtadb, offizielle Karte)
const STYLES = { ingame: 'tiles/yanis', atlas: 'tiles/base', day: 'tiles/day' };
const NATIVE = { ingame: 6, atlas: 6, day: 6 }; // höchste vorhandene Kachel-Zoomstufe je Stil
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
// ---------- Sprache (DE/EN) ----------
// Alle Anzeigetexte laufen über t('schlüssel'). Neue Texte immer in BEIDE Sprachen eintragen.
// Daten sind sprachneutral (Schlüssel wie cat, certainty, tags, info.*) und werden hier übersetzt;
// unbekannte Tags erscheinen im Original (englisch).
const I18N = {
  de: {
    'cat.landmark': 'Orte', 'cat.mission': 'Missionen', 'cat.side': 'Nebenmissionen', 'cat.secret': 'Secrets',
    'cat.weapon': 'Waffen', 'cat.vehicle': 'Fahrzeuge', 'cat.activity': 'Aktivitäten', 'cat.shop': 'Shops',
    'cert.confirmed': 'Bestätigt', 'cert.likely': 'Wahrscheinlich', 'cert.speculation': 'Spekulation',
    search: 'Leonida durchsuchen …', 'aria.filter': 'Fortschritt & Filter', 'aria.info': 'Info', 'aria.quick': 'Kategorien',
    'aria.style': 'Kartenstil wechseln', 'aria.zin': 'Hineinzoomen', 'aria.zout': 'Herauszoomen', 'aria.home': 'Ganze Karte',
    progress: 'Fortschritt', found: '{n} gefunden', hideFound: 'Gefundene ausblenden', language: 'Sprache',
    syncTitle: 'Geräte synchronisieren', syncText: 'Link mit deinem Fortschritt und deinen Notizen. Auf dem anderen Gerät öffnen – wird dort zusammengeführt.',
    syncBtn: 'Sync-Link teilen', syncCopied: 'Link kopiert ✓', syncInvalid: 'Sync-Link ist ungültig.',
    syncNothing: 'Sync-Link: nichts Neues – alles schon vorhanden.',
    ownTitle: 'Eigene Daten', ownText: 'JSON-Datei mit zusätzlichen Markern laden. Bleibt nur auf diesem Gerät gespeichert.',
    ownBtn: 'Eigene Daten importieren', ownDel: 'Eigene Daten löschen', ownInfo: '{n} eigene Marker geladen',
    ownInvalid: 'Datei ist keine gültige Marker-Liste.', ownDelConfirm: 'Eigene Daten von diesem Gerät löschen?',
    syncConfirm: 'Sync-Link übernehmen?\n{f} neue Gefunden-Markierungen, {n} neue Notizen (wird zusammengeführt).',
    dataDate: 'Daten aktualisiert am {d} (gtadb.org)', reset: 'Fortschritt zurücksetzen', resetConfirm: 'Alle „Gefunden“-Markierungen löschen?',
    model: 'Reales Vorbild: {m}', modelShort: 'Vorbild', source: 'Quelle', view: 'ansehen', coords: 'Koordinaten', compare: 'Abgleich',
    match: '✓ stimmt überein', mismatch: 'Abweichung', noSecond: 'keine zweite Quelle', isFound: '✓ Gefunden', markFound: 'Als gefunden markieren',
    share: 'Teilen', shareAria: 'Link teilen', copied: 'Kopiert ✓', noHits: 'Keine Treffer',
    edit: 'Bearbeiten', del: 'Löschen', noteEdit: 'Notiz bearbeiten:', noteDel: 'Notiz löschen?', noteNew: 'Notiz für diesen Punkt:',
    noteSet: '✎ Notiz setzen', measure: '📏 Messen ab hier', measureTarget: 'Ziel auf der Karte antippen',
    'info.realCoords': 'Reale Koordinaten', 'info.photos': 'Fotos', 'info.edited': 'Zuletzt bearbeitet', 'photo.game': 'Spiel', 'photo.real': 'Real',
    'i.title': 'Über diese Karte', 'i.fan': '<b>Inoffizielle Fan-Karte.</b> Nicht verbunden mit Rockstar Games oder Take-Two Interactive.',
    'i.badges': 'Jeder Eintrag hat ein Badge: <span class="badge confirmed">Bestätigt</span> = offiziell/im Spiel verifiziert, <span class="badge likely">Wahrscheinlich</span> = Community-Abgleich aus Trailern, <span class="badge speculation">Spekulation</span>.',
    'i.official': 'Offiziell bestätigt',
    'i.o1': 'Staat <b>Leonida</b> (an Florida angelehnt): Vice City, Grassrivers, Leonida Keys, Ambrosia, Mount Kalaga National Park, Port Gellhorn',
    'i.o2': 'Protagonisten: Jason Duval &amp; Lucia Caminos', 'i.o3': 'Waffen: 2 Primärwaffen + 2 Seitenwaffen am Körper, Rest im Fahrzeug',
    'i.o4': 'Aktivitäten u. a.: Fallschirmspringen, Wrestling, Basketball, Kajak, Tauchen', 'i.o5': 'Release: 19.11.2026 (PS5, Xbox Series X|S)',
    'i.tips': 'Tipps', 'i.tip': 'Lange auf die Karte drücken (bzw. Rechtsklick): Koordinate kopieren, <b>eigene Notiz</b> setzen oder <b>Entfernung messen</b>.',
    'i.later': 'Missionen, Collectibles, Waffen- und Fahrzeug-Spawns werden erst nach Release verifiziert und eingetragen.',
    'i.credits': 'Kartenkacheln &amp; einige Orte: gta6map.github.io (Public Domain).<br>Orte/Vorbilder: <a href="https://gtadb.org">gtadb.org</a> and all contributors, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> (konvertiert).<br>Kartenstil „Day“: GTA VI Map Tiles (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>) – <a href="https://map.gtadb.org">map.gtadb.org</a>, Kartenbild © Rockstar Games.',
    // Tags (gtadb-Typen); fehlende bleiben englisch
    'tag.enterable': 'betretbar', 'tag.residential': 'Wohngebiet', 'tag.unconfirmed': 'unbestätigt', 'tag.retail': 'Einzelhandel',
    'tag.transportation': 'Verkehr', 'tag.transport': 'Verkehr', 'tag.natural': 'Natur', 'tag.nature': 'Natur', 'tag.demolished': 'abgerissen',
    'tag.industrial': 'Industrie', 'tag.hotel': 'Hotel', 'tag.leisure': 'Freizeit', 'tag.government': 'Behörde', 'tag.closed': 'geschlossen',
    'tag.reused': 'wiederverwendet', 'tag.utilities': 'Versorgung', 'tag.bus': 'Bus', 'tag.public': 'öffentlich', 'tag.landmark': 'Wahrzeichen',
    'tag.restaurant': 'Restaurant', 'tag.construction': 'Baustelle', 'tag.supermarket': 'Supermarkt', 'tag.commercial': 'Gewerbe',
    'tag.gas': 'Tankstelle', 'tag.events': 'Veranstaltungen', 'tag.train': 'Zug', 'tag.mirrored': 'gespiegelt', 'tag.marina': 'Yachthafen',
    'tag.airport': 'Flughafen', 'tag.entertainment': 'Unterhaltung', 'tag.office': 'Büro', 'tag.hair': 'Friseur', 'tag.clothes': 'Kleidung',
    'tag.fence': 'Zaun', 'tag.guns': 'Waffenladen', 'tag.food': 'Essen', 'tag.vendor': 'Verkaufsstand', 'tag.tennis': 'Tennis',
    'tag.safehouse': 'Unterschlupf', 'tag.racetrack': 'Rennstrecke', 'tag.modshop': 'Tuning-Werkstatt', 'tag.police': 'Polizei',
    'tag.hospital': 'Krankenhaus', 'tag.bar': 'Bar', 'tag.electronics': 'Elektronik', 'tag.fastfood': 'Fast Food', 'tag.shoes': 'Schuhe',
    'tag.stripclub': 'Stripclub', 'tag.nightclub': 'Nachtclub', 'tag.agriculture': 'Landwirtschaft', 'tag.jail': 'Gefängnis',
    'tag.point-of-interest': 'Sehenswürdigkeit', 'tag.tattoos': 'Tattoos', 'tag.service': 'Dienstleistung', 'tag.drinks': 'Getränke',
    'tag.blimp': 'Luftschiff', 'tag.carwash': 'Autowäsche', 'tag.airbase': 'Luftwaffenstützpunkt', 'tag.ferriswheel': 'Riesenrad',
    'tag.fictional': 'fiktiv', 'tag.golf': 'Golf', 'tag.liquor': 'Spirituosen', 'tag.cancelled': 'gestrichen', 'tag.bikeshop': 'Fahrradladen',
    'tag.gym': 'Fitnessstudio', 'tag.cinema': 'Kino', 'tag.recreation': 'Erholung', 'tag.volleyball': 'Volleyball', 'tag.pharmacy': 'Apotheke',
  },
  en: {
    'cat.landmark': 'Places', 'cat.mission': 'Missions', 'cat.side': 'Side missions', 'cat.secret': 'Secrets',
    'cat.weapon': 'Weapons', 'cat.vehicle': 'Vehicles', 'cat.activity': 'Activities', 'cat.shop': 'Shops',
    'cert.confirmed': 'Confirmed', 'cert.likely': 'Likely', 'cert.speculation': 'Speculation',
    search: 'Search Leonida …', 'aria.filter': 'Progress & filters', 'aria.info': 'Info', 'aria.quick': 'Categories',
    'aria.style': 'Change map style', 'aria.zin': 'Zoom in', 'aria.zout': 'Zoom out', 'aria.home': 'Whole map',
    progress: 'Progress', found: '{n} found', hideFound: 'Hide found', language: 'Language',
    syncTitle: 'Sync devices', syncText: 'A link with your progress and notes. Open it on the other device – it gets merged there.',
    syncBtn: 'Share sync link', syncCopied: 'Link copied ✓', syncInvalid: 'Sync link is invalid.',
    syncNothing: 'Sync link: nothing new – everything is already here.',
    ownTitle: 'Own data', ownText: 'Load a JSON file with additional markers. Stays stored on this device only.',
    ownBtn: 'Import own data', ownDel: 'Delete own data', ownInfo: '{n} own markers loaded',
    ownInvalid: 'File is not a valid marker list.', ownDelConfirm: 'Delete own data from this device?',
    syncConfirm: 'Apply sync link?\n{f} new found markers, {n} new notes (will be merged).',
    dataDate: 'Data updated on {d} (gtadb.org)', reset: 'Reset progress', resetConfirm: 'Delete all “found” markers?',
    model: 'Real-world model: {m}', modelShort: 'model', source: 'Source', view: 'view', coords: 'Coordinates', compare: 'Cross-check',
    match: '✓ matches', mismatch: 'Deviation', noSecond: 'no second source', isFound: '✓ Found', markFound: 'Mark as found',
    share: 'Share', shareAria: 'Share link', copied: 'Copied ✓', noHits: 'No results',
    edit: 'Edit', del: 'Delete', noteEdit: 'Edit note:', noteDel: 'Delete note?', noteNew: 'Note for this spot:',
    noteSet: '✎ Add note', measure: '📏 Measure from here', measureTarget: 'Tap the target on the map',
    'info.realCoords': 'Real coordinates', 'info.photos': 'Photos', 'info.edited': 'Last edited', 'photo.game': 'Game', 'photo.real': 'Real',
    'i.title': 'About this map', 'i.fan': '<b>Unofficial fan map.</b> Not affiliated with Rockstar Games or Take-Two Interactive.',
    'i.badges': 'Every entry has a badge: <span class="badge confirmed">Confirmed</span> = official/verified in game, <span class="badge likely">Likely</span> = community match from trailers, <span class="badge speculation">Speculation</span>.',
    'i.official': 'Officially confirmed',
    'i.o1': 'State of <b>Leonida</b> (based on Florida): Vice City, Grassrivers, Leonida Keys, Ambrosia, Mount Kalaga National Park, Port Gellhorn',
    'i.o2': 'Protagonists: Jason Duval &amp; Lucia Caminos', 'i.o3': 'Weapons: 2 primary + 2 sidearms on the body, the rest in the vehicle',
    'i.o4': 'Activities include: skydiving, wrestling, basketball, kayaking, diving', 'i.o5': 'Release: Nov 19, 2026 (PS5, Xbox Series X|S)',
    'i.tips': 'Tips', 'i.tip': 'Long-press the map (or right-click): copy the coordinate, add <b>your own note</b> or <b>measure a distance</b>.',
    'i.later': 'Missions, collectibles, weapon and vehicle spawns will only be verified and added after release.',
    'i.credits': 'Map tiles &amp; some places: gta6map.github.io (Public Domain).<br>Places/models: <a href="https://gtadb.org">gtadb.org</a> and all contributors, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> (converted).<br>Map style “Day”: GTA VI Map Tiles (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>) – <a href="https://map.gtadb.org">map.gtadb.org</a>, map image © Rockstar Games.',
  },
};
let lang = store.get('lang', null);
if (!I18N[lang]) lang = (navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en';
const t = (k, v = {}) => (I18N[lang][k] ?? I18N.en[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '');
const tag = (s) => I18N[lang]['tag.' + s] ?? s;
const fmtDate = (iso) => new Date(iso).toLocaleDateString(lang, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
const pname = (p) => (p.unnamed ? `${p.name} (${t('modelShort')})` : p.name); // unbenannt: Name des realen Vorbilds
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((e) => (e.innerHTML = t(e.dataset.i18n)));
  document.querySelectorAll('[data-i18n-ph]').forEach((e) => (e.placeholder = t(e.dataset.i18nPh)));
  document.querySelectorAll('[data-i18n-aria]').forEach((e) => e.setAttribute('aria-label', t(e.dataset.i18nAria)));
  document.querySelectorAll('#lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
}
applyLang();

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
  $('#total').innerHTML = `<div>${t('found', { n: `<b>${F} / ${N}</b>` })}<span>${P} %</span></div><i style="--p:${N ? (F / N) * 100 : 0}%"></i>`;
  $('#chips').innerHTML = stats.map(({ k, c, n, f, off }) => `<button class="chip${off}" data-cat="${k}" style="--c:${c.color};--p:${n ? (f / n) * 100 : 0}%">
      <i></i>${t('cat.' + k)}<small>${t('found', { n: `${f} / ${n}` })}</small><b></b></button>`).join('');
  // Schnellfilter: Kategorien mit Einträgen zuerst
  $('#quick').innerHTML = [...stats].sort((a, b) => (b.n > 0) - (a.n > 0)).map(({ k, c, n, off }) =>
    `<button class="qchip${off}${n ? '' : ' empty'}" data-cat="${k}" style="--c:${c.color}"><i></i>${t('cat.' + k)}<small>${n}</small></button>`).join('');
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
  const c = CATEGORIES[p.cat] || { color: '#fff' };
  const info = (k, v) => (k === 'photos' ? v.map((x) => t('photo.' + x)).join(', ') : k === 'edited' ? fmtDate(v) : v);
  const isFound = found.has(p.id), cmp = counterpart(p);
  $('#detail-body').innerHTML = `
    <div class="d-head" style="--c:${c.color}"><div class="d-icon"><i></i></div>
      <div><h2>${esc(pname(p))}</h2><small>${esc(t('cat.' + p.cat))}${p.area ? ' · ' + esc(p.area) : ''}</small></div></div>
    <div class="tags"><span class="badge ${esc(p.certainty)}">${esc(t('cert.' + p.certainty))}</span>
      ${(p.tags || []).map((s) => `<span class="tag">${esc(tag(s))}</span>`).join('')}</div>
    ${p.model ? `<p>${esc(t('model', { m: p.model }))}</p>` : ''}
    ${p.desc ? `<p>${esc(p.desc)}</p>` : ''}
    ${(p.imgs || []).map((u) => `<img class="d-photo" src="${esc(u)}" loading="lazy" alt="">`).join('')}
    <dl class="meta"><dt>${t('source')}</dt><dd>${esc(p.source)}${p.url ? ` · <a href="${esc(p.url)}" target="_blank" rel="noopener">${t('view')}</a>` : ''}</dd>
      <dt>${t('coords')}</dt><dd><button class="link" id="btn-xy">${p.x}, ${p.y} ⧉</button></dd>
      ${Object.entries(p.info || {}).map(([k, v]) => `<dt>${esc(t('info.' + k))}</dt><dd>${esc(info(k, v))}</dd>`).join('')}
      <dt>${t('compare')}</dt><dd>${cmp ? `<button class="link" id="btn-cmp">${cmp.d <= 25 ? t('match') : t('mismatch')}
        (${Math.round(cmp.d)} m) · ${esc(cmp.q.source.split(' (')[0])}</button>` : `<span class="muted">${t('noSecond')}</span>`}</dd></dl>
    <div class="actions">
      <button class="primary${isFound ? ' done' : ''}" id="btn-found">${isFound ? t('isFound') : t('markFound')}</button>
      <button class="ghost" id="btn-share" aria-label="${t('shareAria')}">${t('share')}</button>
    </div>`;
  $('#btn-found').onclick = () => { toggleFound(p); showDetail(p); };
  $('#btn-xy').onclick = (e) => { navigator.clipboard?.writeText(`${p.x}, ${p.y}`); e.target.textContent = t('copied'); };
  if (cmp) $('#btn-cmp').onclick = () => focus(cmp.q);
  $('#btn-share').onclick = () => {
    const url = location.href.split('#')[0] + '#p=' + encodeURIComponent(p.id);
    if (navigator.share) navigator.share({ title: pname(p), url }).catch(() => {});
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
  if (!confirm(t('resetConfirm'))) return;
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
  d.innerHTML = `<p>${esc(n.text)}</p><button class="link" data-a="edit">${t('edit')}</button> · <button class="link" data-a="del">${t('del')}</button>`;
  d.onclick = (e) => {
    const a = e.target.dataset.a;
    if (a === 'edit') { const s = prompt(t('noteEdit'), n.text); if (s?.trim()) { n.text = s.trim(); saveNotes(); } }
    if (a === 'del' && confirm(t('noteDel'))) { notes = notes.filter((q) => q !== n); saveNotes(); }
  };
  return d;
}
function saveNotes() { store.set('notes', notes); map.closePopup(); renderNotes(); }
function addNote(ll) {
  const s = prompt(t('noteNew')); if (!s?.trim()) return;
  notes.push({ id: Date.now().toString(36), x: Math.round(ll.lng), y: Math.round(ll.lat), text: s.trim() });
  saveNotes();
}
renderNotes();

// ---------- Entfernung messen (Spielkoordinaten = Meter) ----------
let measureFrom = null;
const measureLayer = L.layerGroup().addTo(map);
const dot = (ll) => L.circleMarker(ll, { radius: 6, weight: 2, color: '#fff', fillColor: '#ff4f9a', fillOpacity: 1 }).addTo(measureLayer);
const fmtDist = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`);

// Langes Drücken (bzw. Rechtsklick) auf die Karte: Koordinate kopieren, Notiz setzen, Messen starten
map.on('contextmenu', (e) => {
  const xy = `${Math.round(e.latlng.lng)}, ${Math.round(e.latlng.lat)}`;
  const d = L.DomUtil.create('div', 'ctx');
  d.innerHTML = `<button class="link" data-a="xy">${xy} ⧉</button><button class="link" data-a="note">${t('noteSet')}</button><button class="link" data-a="measure">${t('measure')}</button>`;
  d.onclick = (ev) => {
    const a = ev.target.dataset.a;
    if (a === 'xy') { navigator.clipboard?.writeText(xy); ev.target.textContent = t('copied'); }
    if (a === 'note') { map.closePopup(); addNote(e.latlng); }
    if (a === 'measure') {
      map.closePopup(); measureLayer.clearLayers(); measureFrom = e.latlng;
      dot(e.latlng).bindTooltip(t('measureTarget'), { permanent: true, direction: 'top', className: 'dist' }).openTooltip();
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
  else { navigator.clipboard?.writeText(url); $('#btn-sync').textContent = t('syncCopied'); }
};
async function importSync() {
  const m = location.hash.match(/#sync=(.+)/); if (!m) return;
  history.replaceState(null, '', location.pathname);
  let d; try { d = await unpackSync(m[1]); } catch { alert(t('syncInvalid')); return; }
  const f = (d.found || []).filter((id) => !found.has(id)), n = (d.notes || []).filter((x) => !notes.some((q) => q.id === x.id));
  if (!f.length && !n.length) { alert(t('syncNothing')); return; }
  if (!confirm(t('syncConfirm', { f: f.length, n: n.length }))) return;
  f.forEach((id) => found.add(id)); store.set('found', [...found]);
  notes = notes.concat(n); saveNotes();
  markers.forEach((mk, id) => mk.setIcon(icon(pois.find((p) => p.id === id)))); render();
}

// Datenstand: jüngstes „edited“ der gtadb-Einträge
function showDataDate() {
  const last = pois.map((p) => p.info?.edited).filter(Boolean).sort().at(-1);
  $('#data-date').textContent = last ? t('dataDate', { d: fmtDate(last) }) : '';
}
$('#lang').onclick = (e) => {
  const l = e.target.closest('[data-lang]')?.dataset.lang; if (!l || l === lang) return;
  lang = l; store.set('lang', lang);
  applyLang(); renderChips(); showDataDate(); showOwn();
  map.closePopup(); $('#results').hidden = true; $('#search').value = '';
  const p = selected && pois.find((q) => q.id === selected);
  if (p && !$('#detail').hidden) showDetail(p);
  markers.forEach((m, id) => { const q = pois.find((x) => x.id === id); if (m._icon) m._icon.title = pname(q); m.options.title = pname(q); });
};
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
  const hits = pois.filter((p) => norm(`${pname(p)} ${p.area} ${p.model} ${p.desc} ${(p.tags || []).map((s) => s + ' ' + tag(s)).join(' ')}`).includes(q)).slice(0, 30);
  ul.innerHTML = hits.map((p) => `<li data-id="${esc(p.id)}" style="--c:${CATEGORIES[p.cat]?.color || '#fff'}"><i></i><div>${esc(pname(p))}<small>${esc(t('cat.' + p.cat))}${p.area ? ' · ' + esc(p.area) : ''}</small></div></li>`).join('')
    || `<li class="muted">${t('noHits')}</li>`;
  ul.hidden = false;
};
$('#results').onclick = (e) => {
  const id = e.target.closest('li')?.dataset.id; if (!id) return;
  $('#results').hidden = true; $('#search').blur(); focus(pois.find((p) => p.id === id));
};

// ---------- Eigene Daten (nur lokal in IndexedDB) ----------
function ownDB(mode, fn) {
  return new Promise((res, rej) => {
    const o = indexedDB.open('leonida', 1);
    o.onupgradeneeded = () => o.result.createObjectStore('own');
    o.onerror = () => rej(o.error);
    o.onsuccess = () => { const tx = o.result.transaction('own', mode), r = fn(tx.objectStore('own')); tx.oncomplete = () => res(r.result); tx.onerror = () => rej(tx.error); };
  });
}
const ownGet = () => ownDB('readonly', (s) => s.get('pois')).then((l) => l || []).catch(() => []);
let ownCount = 0;
function showOwn() {
  $('#own-info').hidden = $('#btn-import-del').hidden = !ownCount;
  $('#own-info').textContent = t('ownInfo', { n: ownCount });
}
$('#btn-import').onclick = () => $('#import-file').click();
$('#import-file').onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  let l; try { l = JSON.parse(await f.text()); } catch { l = null; }
  if (!Array.isArray(l) || !l.some((p) => p && p.id && Number.isFinite(p.x) && Number.isFinite(p.y))) { alert(t('ownInvalid')); return; }
  await ownDB('readwrite', (s) => s.put(l, 'pois'));
  location.reload();
};
$('#btn-import-del').onclick = async () => {
  if (!confirm(t('ownDelConfirm'))) return;
  await ownDB('readwrite', (s) => s.delete('pois'));
  location.reload();
};

// ---------- Daten laden ----------
Promise.all([...DATA_FILES.map((f) => fetch(f).then((r) => (r.ok ? r.json() : [])).catch(() => [])),
  ownGet().then((l) => { ownCount = l.length; showOwn(); return l; })])
  .then((lists) => {
    pois = lists.flat().filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    for (const p of pois) {
      const m = L.marker([p.y, p.x], { icon: icon(p), title: pname(p), cat: p.cat });
      m.on('click', () => showDetail(p));
      markers.set(p.id, m);
    }
    render();
    showDataDate();
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
