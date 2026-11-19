// Leonida Map – Spielkoordinaten in Metern (x = Ost, y = Nord), wie bei gta6map.github.io.
// Kacheln: 1024 px, Zoom 0–6, Welt 32768 m, Ursprung (0,0) bei Pixel 16384/16384 (Zoom 5 = 1 px/m).

// Beschriftungen kommen aus I18N (cat.*)
const CATEGORIES = {
  landmark: { color: '#4fb3ff' }, mission: { color: '#ff4f9a' }, side: { color: '#ffb84f' }, secret: { color: '#b84fff' },
  weapon: { color: '#ff5a4f' }, vehicle: { color: '#4fff9a' }, activity: { color: '#4ffff0' }, shop: { color: '#ffe14f' },
};
const DATA_FILES = ['data/landmarks.json', 'data/gtadb.json', 'data/pois.json'];
const DATA_SRC = ['base', 'gtadb', 'base', 'own']; // Datenquelle je Liste (DATA_FILES + eigene Daten)

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
    srcTitle: 'Angezeigte Daten', 'src.base': 'Basis-Orte (gta6map)', 'src.gtadb': 'gtadb.org', 'src.own': 'Eigene Daten',
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
    'i.credits': 'Kartenkacheln &amp; einige Orte: gta6map.github.io (Public Domain).<br>Orte/Vorbilder: <a href="https://gtadb.org">gtadb.org</a> and all contributors, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> (konvertiert).<br>Kartenstil „Day“: GTA VI Map Tiles (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>) – <a href="https://map.gtadb.org">map.gtadb.org</a>, Kartenbild © Rockstar Games.<br>Symbole: <a href="https://pictogrammers.com/library/mdi/">Material Design Icons</a> (Apache 2.0).',
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
    srcTitle: 'Shown data', 'src.base': 'Base places (gta6map)', 'src.gtadb': 'gtadb.org', 'src.own': 'Own data',
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
    'i.credits': 'Map tiles &amp; some places: gta6map.github.io (Public Domain).<br>Places/models: <a href="https://gtadb.org">gtadb.org</a> and all contributors, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> (converted).<br>Map style “Day”: GTA VI Map Tiles (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>) – <a href="https://map.gtadb.org">map.gtadb.org</a>, map image © Rockstar Games.<br>Icons: <a href="https://pictogrammers.com/library/mdi/">Material Design Icons</a> (Apache 2.0).',
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
const hiddenSrc = new Set(store.get('hiddenSrc', []));
const layer = L.layerGroup().addTo(map); // keine Gruppierung: jeder Marker einzeln

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Symbole: Material Design Icons (Apache 2.0). Standard je Kategorie, genauer je Typ über die Tags.
const GLYPHS = {
  landmark: 'M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z',
  mission: 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,10.84 21.79,9.69 21.39,8.61L19.79,10.21C19.93,10.8 20,11.4 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4C12.6,4 13.2,4.07 13.79,4.21L15.4,2.6C14.31,2.21 13.16,2 12,2M19,2L15,6V7.5L12.45,10.05C12.3,10 12.15,10 12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12C14,11.85 14,11.7 13.95,11.55L16.5,9H18L22,5H19V2M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12H16A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8V6Z',
  side: 'M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z',
  secret: 'M10,19H13V22H10V19M12,2C17.35,2.22 19.68,7.62 16.5,11.67C15.67,12.67 14.33,13.33 13.67,14.17C13,15 13,16 13,17H10C10,15.33 10,13.92 10.67,12.92C11.33,11.92 12.67,11.33 13.5,10.67C15.92,8.43 15.32,5.26 12,5A3,3 0 0,0 9,8H6A6,6 0 0,1 12,2Z',
  weapon: 'M7,5H23V9H22V10H16A1,1 0 0,0 15,11V12A2,2 0 0,1 13,14H9.62C9.24,14 8.89,14.22 8.72,14.56L6.27,19.45C6.1,19.79 5.76,20 5.38,20H2C2,20 -1,20 3,14C3,14 6,10 2,10V5H3L3.5,4H6.5L7,5M14,12V11A1,1 0 0,0 13,10H12C12,10 11,11 12,12A2,2 0 0,1 10,10A1,1 0 0,0 9,11V12A1,1 0 0,0 10,13H13A1,1 0 0,0 14,12Z',
  vehicle: 'M5,11L6.5,6.5H17.5L19,11M17.5,16A1.5,1.5 0 0,1 16,14.5A1.5,1.5 0 0,1 17.5,13A1.5,1.5 0 0,1 19,14.5A1.5,1.5 0 0,1 17.5,16M6.5,16A1.5,1.5 0 0,1 5,14.5A1.5,1.5 0 0,1 6.5,13A1.5,1.5 0 0,1 8,14.5A1.5,1.5 0 0,1 6.5,16M18.92,6C18.72,5.42 18.16,5 17.5,5H6.5C5.84,5 5.28,5.42 5.08,6L3,12V20A1,1 0 0,0 4,21H5A1,1 0 0,0 6,20V19H18V20A1,1 0 0,0 19,21H20A1,1 0 0,0 21,20V12L18.92,6Z',
  activity: 'M16.5,5.5A2,2 0 0,0 18.5,3.5A2,2 0 0,0 16.5,1.5A2,2 0 0,0 14.5,3.5A2,2 0 0,0 16.5,5.5M12.9,19.4L13.9,15L16,17V23H18V15.5L15.9,13.5L16.5,10.5C17.89,12.09 19.89,13 22,13V11C20.24,11.03 18.6,10.11 17.7,8.6L16.7,7C16.34,6.4 15.7,6 15,6C14.7,6 14.5,6.1 14.2,6.1L9,8.3V13H11V9.6L12.8,8.9L11.2,17L6.3,16L5.9,18L12.9,19.4M4,9A1,1 0 0,1 3,8A1,1 0 0,1 4,7H7V9H4M5,5A1,1 0 0,1 4,4A1,1 0 0,1 5,3H10V5H5M3,13A1,1 0 0,1 2,12A1,1 0 0,1 3,11H7V13H3Z',
  shop: 'M12,13A5,5 0 0,1 7,8H9A3,3 0 0,0 12,11A3,3 0 0,0 15,8H17A5,5 0 0,1 12,13M12,3A3,3 0 0,1 15,6H9A3,3 0 0,1 12,3M19,6H17A5,5 0 0,0 12,1A5,5 0 0,0 7,6H5C3.89,6 3,6.89 3,8V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V8C21,6.89 20.1,6 19,6Z',
  cash: 'M3,6H21V18H3V6M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M7,8A2,2 0 0,1 5,10V14A2,2 0 0,1 7,16H17A2,2 0 0,1 19,14V10A2,2 0 0,1 17,8H7Z',
  bank: 'M11.5,1L2,6V8H21V6M16,10V17H19V10M2,22H21V19H2M10,10V17H13V10M4,10V17H7V10H4Z',
  loan: 'M16 12C18.76 12 21 9.76 21 7S18.76 2 16 2 11 4.24 11 7 13.24 12 16 12M21.45 17.6C21.06 17.2 20.57 17 20 17H13L10.92 16.27L11.25 15.33L13 16H15.8C16.15 16 16.43 15.86 16.66 15.63S17 15.12 17 14.81C17 14.27 16.74 13.9 16.22 13.69L8.95 11H7V20L14 22L22.03 19C22.04 18.47 21.84 18 21.45 17.6M5 11H.984V22H5V11Z',
  jewel: 'M16,9H19L14,16M10,9H14L12,17M5,9H8L10,16M15,4H17L19,7H16M11,4H13L14,7H10M7,4H9L8,7H5M6,2L2,8L12,22L22,8L18,2H6Z',
  fuel: 'M18,10A1,1 0 0,1 17,9A1,1 0 0,1 18,8A1,1 0 0,1 19,9A1,1 0 0,1 18,10M12,10H6V5H12M19.77,7.23L19.78,7.22L16.06,3.5L15,4.56L17.11,6.67C16.17,7 15.5,7.93 15.5,9A2.5,2.5 0 0,0 18,11.5C18.36,11.5 18.69,11.42 19,11.29V18.5A1,1 0 0,1 18,19.5A1,1 0 0,1 17,18.5V14C17,12.89 16.1,12 15,12H14V5C14,3.89 13.1,3 12,3H6C4.89,3 4,3.89 4,5V21H14V13.5H15.5V18.5A2.5,2.5 0 0,0 18,21A2.5,2.5 0 0,0 20.5,18.5V9C20.5,8.31 20.22,7.68 19.77,7.23Z',
  ev: 'M19.77,7.23L19.78,7.22L16.06,3.5L15,4.56L17.11,6.67C16.17,7.03 15.5,7.93 15.5,9A2.5,2.5 0 0,0 18,11.5C18.36,11.5 18.69,11.42 19,11.29V18.5A1,1 0 0,1 18,19.5A1,1 0 0,1 17,18.5V14A2,2 0 0,0 15,12H14V5A2,2 0 0,0 12,3H6A2,2 0 0,0 4,5V21H14V13.5H15.5V18.5A2.5,2.5 0 0,0 18,21A2.5,2.5 0 0,0 20.5,18.5V9C20.5,8.31 20.22,7.68 19.77,7.23M18,10A1,1 0 0,1 17,9A1,1 0 0,1 18,8A1,1 0 0,1 19,9A1,1 0 0,1 18,10M8,18V13.5H6L10,6V11H12L8,18Z',
  bus: 'M18,11H6V6H18M16.5,17A1.5,1.5 0 0,1 15,15.5A1.5,1.5 0 0,1 16.5,14A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 16.5,17M7.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,14A1.5,1.5 0 0,1 9,15.5A1.5,1.5 0 0,1 7.5,17M4,16C4,16.88 4.39,17.67 5,18.22V20A1,1 0 0,0 6,21H7A1,1 0 0,0 8,20V19H16V20A1,1 0 0,0 17,21H18A1,1 0 0,0 19,20V18.22C19.61,17.67 20,16.88 20,16V6C20,2.5 16.42,2 12,2C7.58,2 4,2.5 4,6V16Z',
  train: 'M12,2C8,2 4,2.5 4,6V15.5A3.5,3.5 0 0,0 7.5,19L6,20.5V21H8.23L10.23,19H14L16,21H18V20.5L16.5,19A3.5,3.5 0 0,0 20,15.5V6C20,2.5 16.42,2 12,2M7.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,14A1.5,1.5 0 0,1 9,15.5A1.5,1.5 0 0,1 7.5,17M11,10H6V6H11V10M13,10V6H18V10H13M16.5,17A1.5,1.5 0 0,1 15,15.5A1.5,1.5 0 0,1 16.5,14A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 16.5,17Z',
  ferry: 'M6,6H18V9.96L12,8L6,9.96M3.94,19H4C5.6,19 7,18.12 8,17C9,18.12 10.4,19 12,19C13.6,19 15,18.12 16,17C17,18.12 18.4,19 20,19H20.05L21.95,12.31C22.03,12.06 22,11.78 21.89,11.54C21.76,11.3 21.55,11.12 21.29,11.04L20,10.62V6C20,4.89 19.1,4 18,4H15V1H9V4H6A2,2 0 0,0 4,6V10.62L2.71,11.04C2.45,11.12 2.24,11.3 2.11,11.54C2,11.78 1.97,12.06 2.05,12.31M20,21C18.61,21 17.22,20.53 16,19.67C13.56,21.38 10.44,21.38 8,19.67C6.78,20.53 5.39,21 4,21H2V23H4C5.37,23 6.74,22.65 8,22C10.5,23.3 13.5,23.3 16,22C17.26,22.65 18.62,23 20,23H22V21H20Z',
  plane: 'M20.56 3.91C21.15 4.5 21.15 5.45 20.56 6.03L16.67 9.92L18.79 19.11L17.38 20.53L13.5 13.1L9.6 17L9.96 19.47L8.89 20.53L7.13 17.35L3.94 15.58L5 14.5L7.5 14.87L11.37 11L3.94 7.09L5.36 5.68L14.55 7.8L18.44 3.91C19 3.33 20 3.33 20.56 3.91Z',
  drink: 'M7.5,7L5.5,5H18.5L16.5,7M11,13V19H6V21H18V19H13V13L21,5V3H3V5L11,13Z',
  liquor: 'M10,22A1,1 0 0,1 9,21V11C9,9 10,7.25 11,7V2.5A0.5,0.5 0 0,1 11.5,2H12.5A0.5,0.5 0 0,1 13,2.5V7C14,7.25 15,9 15,11V21A1,1 0 0,1 14,22H10Z',
  music: 'M21,3V15.5A3.5,3.5 0 0,1 17.5,19A3.5,3.5 0 0,1 14,15.5A3.5,3.5 0 0,1 17.5,12C18.04,12 18.55,12.12 19,12.34V6.47L9,8.6V17.5A3.5,3.5 0 0,1 5.5,21A3.5,3.5 0 0,1 2,17.5A3.5,3.5 0 0,1 5.5,14C6.04,14 6.55,14.12 7,14.34V6L21,3Z',
  coffee: 'M2,21H20V19H2M20,8H18V5H20M20,3H4V13A4,4 0 0,0 8,17H14A4,4 0 0,0 18,13V10H20A2,2 0 0,0 22,8V5C22,3.89 21.1,3 20,3Z',
  burger: 'M22 13C22 14.11 21.11 15 20 15H4C2.9 15 2 14.11 2 13S2.9 11 4 11H13L15.5 13L18 11H20C21.11 11 22 11.9 22 13M12 3C3 3 3 9 3 9H21C21 9 21 3 12 3M3 18C3 19.66 4.34 21 6 21H18C19.66 21 21 19.66 21 18V17H3V18Z',
  food: 'M11,9H9V2H7V9H5V2H3V9C3,11.12 4.66,12.84 6.75,12.97V22H9.25V12.97C11.34,12.84 13,11.12 13,9V2H11V9M16,6V14H18.5V22H21V2C18.24,2 16,4.24 16,6Z',
  stunt: 'M17.42,10L13.41,6H9V8H12.59L14.59,10H6.5C4,10 2,12 2,14.5C2,17 4,19 6.5,19C8.72,19 10.56,17.38 10.92,15.27L13.04,14C13,14.17 13,14.33 13,14.5C13,17 15,19 17.5,19C20,19 22,17 22,14.5C22,12 20,10 17.5,10M8.84,15.26C8.5,16.27 7.58,17 6.47,17C5.09,17 3.97,15.88 3.97,14.5C3.97,13.12 5.09,12 6.47,12C7.59,12 8.5,12.74 8.84,13.75H6V15.25L8.84,15.26M17.47,17C16.09,17 14.97,15.88 14.97,14.5C14.97,13.12 16.09,12 17.47,12A2.5,2.5 0 0,1 19.97,14.5A2.5,2.5 0 0,1 17.47,17Z',
  parachute: 'M21.2,10.95L12,23L2.78,10.96L2.87,10.88C3.08,10.67 3.33,10.5 3.58,10.36L10.73,19.69L8.58,13L9.24,11.81L12,20.38L14.73,11.8L15.4,13L13.27,19.69L20.41,10.35C20.66,10.5 20.9,10.64 21.1,10.85L21.2,10.95M5,9C6.5,9 7.81,9.86 8.5,11.1C9.17,9.86 10.47,9 12,9C13.5,9 14.8,9.85 15.5,11.09C16.16,9.84 17.47,9 19,9C20.09,9 21.09,9.42 21.81,10.14C20.94,5.5 16.88,2 12,2C7.09,2 3.03,5.5 2.16,10.17C2.89,9.45 3.89,9 5,9Z',
  knife: 'M2.5,19H21.5V21H2.5V19M22.07,9.64C21.86,8.84 21.03,8.36 20.23,8.58L14.92,10L8,3.57L6.09,4.08L10.23,11.25L5.26,12.58L3.29,11.04L1.84,11.43L3.66,14.59L4.43,15.92L6.03,15.5L11.34,14.07L15.69,12.91L21,11.5C21.81,11.26 22.28,10.44 22.07,9.64Z',
  repair: 'M22.7,19L13.6,9.9C14.5,7.6 14,4.9 12.1,3C10.1,1 7.1,0.6 4.7,1.7L9,6L6,9L1.6,4.7C0.4,7.1 0.9,10.1 2.9,12.1C4.8,14 7.5,14.5 9.8,13.6L18.9,22.7C19.3,23.1 19.9,23.1 20.3,22.7L22.6,20.4C23.1,20 23.1,19.3 22.7,19Z',
  spray: 'M10,4H12V6H10V4M7,3H9V5H7V3M7,6H9V8H7V6M6,8V10H4V8H6M6,5V7H4V5H6M6,2V4H4V2H6M13,22A2,2 0 0,1 11,20V10A2,2 0 0,1 13,8V7H14V4H17V7H18V8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H13M13,10V20H18V10H13Z',
  wash: 'M5,13L6.5,8.5H17.5L19,13M17.5,18A1.5,1.5 0 0,1 16,16.5A1.5,1.5 0 0,1 17.5,15A1.5,1.5 0 0,1 19,16.5A1.5,1.5 0 0,1 17.5,18M6.5,18A1.5,1.5 0 0,1 5,16.5A1.5,1.5 0 0,1 6.5,15A1.5,1.5 0 0,1 8,16.5A1.5,1.5 0 0,1 6.5,18M18.92,8C18.72,7.42 18.16,7 17.5,7H6.5C5.84,7 5.28,7.42 5.08,8L3,14V22A1,1 0 0,0 4,23H5A1,1 0 0,0 6,22V21H18V22A1,1 0 0,0 19,23H20A1,1 0 0,0 21,22V14M7,5A1.5,1.5 0 0,0 8.5,3.5C8.5,2.5 7,0.8 7,0.8C7,0.8 5.5,2.5 5.5,3.5A1.5,1.5 0 0,0 7,5M12,5A1.5,1.5 0 0,0 13.5,3.5C13.5,2.5 12,0.8 12,0.8C12,0.8 10.5,2.5 10.5,3.5A1.5,1.5 0 0,0 12,5M17,5A1.5,1.5 0 0,0 18.5,3.5C18.5,2.5 17,0.8 17,0.8C17,0.8 15.5,2.5 15.5,3.5A1.5,1.5 0 0,0 17,5Z',
  garage: 'M19,20H17V11H7V20H5V9L12,5L19,9V20M8,12H16V14H8V12M8,15H16V17H8V15M16,18V20H8V18H16Z',
  rental: 'M9 0C7.3 0 6 1.3 6 3S7.3 6 9 6C10.3 6 11.4 5.2 11.8 4H14V6H16V4H18V2H11.8C11.4 .8 10.3 0 9 0M9 2C9.6 2 10 2.4 10 3S9.6 4 9 4 8 3.6 8 3 8.4 2 9 2M6.5 8C5.8 8 5.3 8.4 5.1 9L3 15V23C3 23.6 3.4 24 4 24H5C5.6 24 6 23.6 6 23V22H18V23C18 23.6 18.4 24 19 24H20C20.6 24 21 23.6 21 23V15L18.9 9C18.7 8.4 18.1 8 17.5 8H6.5M6.5 9.5H17.5L19 14H5L6.5 9.5M6.5 16C7.3 16 8 16.7 8 17.5S7.3 19 6.5 19 5 18.3 5 17.5 5.7 16 6.5 16M17.5 16C18.3 16 19 16.7 19 17.5S18.3 19 17.5 19 16 18.3 16 17.5 16.7 16 17.5 16Z',
  safe: 'M4,4A2,2 0 0,0 2,6V17A2,2 0 0,0 4,19V20H6V19H17V20H19V19A2,2 0 0,0 21,17V16H22V14H21V9H22V7H21V6A2,2 0 0,0 19,4H4M4,6H19V17H4V6M13.5,7.5A4,4 0 0,0 9.5,11.5A4,4 0 0,0 13.5,15.5A4,4 0 0,0 17.5,11.5A4,4 0 0,0 13.5,7.5M5,9V14H7V9H5M13.5,9.5A2,2 0 0,1 15.5,11.5A2,2 0 0,1 13.5,13.5A2,2 0 0,1 11.5,11.5A2,2 0 0,1 13.5,9.5Z',
  basket: 'M2.34,14.63C2.94,14.41 3.56,14.3 4.22,14.3C5.56,14.3 6.73,14.72 7.73,15.56L4.59,18.7C3.53,17.5 2.78,16.13 2.34,14.63M15.56,9.8C17.53,11.27 19.66,11.63 21.94,10.88C21.97,11.09 22,11.47 22,12C22,13.03 21.75,14.18 21.28,15.45C20.81,16.71 20.23,17.73 19.55,18.5L13.22,12.19L15.56,9.8M8.77,16.64C9.83,18.17 10.05,19.84 9.42,21.66C8,21.25 6.73,20.61 5.67,19.73L8.77,16.64M12.19,13.22L18.5,19.55C16.33,21.45 13.78,22.25 10.88,21.94C11.09,21.28 11.2,20.56 11.2,19.78C11.2,19.16 11.06,18.43 10.78,17.6C10.5,16.77 10.17,16.09 9.8,15.56L12.19,13.22M8.81,14.5C7.88,13.67 6.8,13.15 5.58,12.91C4.36,12.68 3.19,12.75 2.06,13.13C2.03,12.91 2,12.53 2,12C2,10.97 2.25,9.82 2.72,8.55C3.19,7.29 3.77,6.27 4.45,5.5L11.11,12.19L8.81,14.5M15.56,7.73C14.22,6.08 13.91,4.28 14.63,2.34C15.25,2.5 15.96,2.8 16.76,3.26C17.55,3.71 18.2,4.16 18.7,4.59L15.56,7.73M21.66,9.38C21.06,9.59 20.44,9.7 19.78,9.7C18.69,9.7 17.64,9.38 16.64,8.72L19.73,5.67C20.61,6.77 21.25,8 21.66,9.38M12.19,11.11L5.5,4.45C7.67,2.55 10.22,1.75 13.13,2.06C12.91,2.72 12.8,3.44 12.8,4.22C12.8,4.94 12.96,5.75 13.29,6.66C13.62,7.56 14,8.28 14.5,8.81L12.19,11.11Z',
  tennis: 'M18,15A4,4 0 0,1 22,19A4,4 0 0,1 18,23A4,4 0 0,1 14,19A4,4 0 0,1 18,15M18,17A2,2 0 0,0 16,19A2,2 0 0,0 18,21A2,2 0 0,0 20,19A2,2 0 0,0 18,17M6.05,14.54C6.05,14.54 7.46,13.12 7.47,10.3C7.11,8.11 7.97,5.54 9.94,3.58C12.87,0.65 17.14,0.17 19.5,2.5C21.83,4.86 21.35,9.13 18.42,12.06C16.46,14.03 13.89,14.89 11.7,14.53C8.88,14.54 7.46,15.95 7.46,15.95L3.22,20.19L1.81,18.78L6.05,14.54M18.07,3.93C16.5,2.37 13.5,2.84 11.35,5C9.21,7.14 8.73,10.15 10.29,11.71C11.86,13.27 14.86,12.79 17,10.65C19.16,8.5 19.63,5.5 18.07,3.93Z',
  golf: 'M19.5,18A1.5,1.5 0 0,1 21,19.5A1.5,1.5 0 0,1 19.5,21A1.5,1.5 0 0,1 18,19.5A1.5,1.5 0 0,1 19.5,18M17,5.92L11,9V18.03C13.84,18.19 16,19 16,20C16,21.1 13.31,22 10,22C6.69,22 4,21.1 4,20C4,19.26 5.21,18.62 7,18.27V20H9V2L17,5.92Z',
  pool: 'M11,13H13V15H11M11,9H13V11H11M11,17H13A2,2 0 0,0 15,15V13.5A1.5,1.5 0 0,0 13.5,12A1.5,1.5 0 0,0 15,10.5V9A2,2 0 0,0 13,7H11A2,2 0 0,0 9,9V10.5A1.5,1.5 0 0,0 10.5,12A1.5,1.5 0 0,0 9,13.5V15A2,2 0 0,0 11,17M12,1C5.92,1 1,5.92 1,12C1,18.08 5.92,23 12,23C18.08,23 23,18.08 23,12C23,5.92 18.08,1 12,1M12,19A7,7 0 0,1 5,12A7,7 0 0,1 12,5A7,7 0 0,1 19,12A7,7 0 0,1 12,19Z',
  fish: 'M12,20L12.76,17C9.5,16.79 6.59,15.4 5.75,13.58C5.66,14.06 5.53,14.5 5.33,14.83C4.67,16 3.33,16 2,16C3.1,16 3.5,14.43 3.5,12.5C3.5,10.57 3.1,9 2,9C3.33,9 4.67,9 5.33,10.17C5.53,10.5 5.66,10.94 5.75,11.42C6.4,10 8.32,8.85 10.66,8.32L9,5C11,5 13,5 14.33,5.67C15.46,6.23 16.11,7.27 16.69,8.38C19.61,9.08 22,10.66 22,12.5C22,14.38 19.5,16 16.5,16.66C15.67,17.76 14.86,18.78 14.17,19.33C13.33,20 12.67,20 12,20M17,11A1,1 0 0,0 16,12A1,1 0 0,0 17,13A1,1 0 0,0 18,12A1,1 0 0,0 17,11Z',
  race: 'M14.4,6H20V16H13L12.6,14H7V21H5V4H14L14.4,6M14,14H16V12H18V10H16V8H14V10L13,8V6H11V8H9V6H7V8H9V10H7V12H9V10H11V12H13V10L14,12V14M11,10V8H13V10H11M14,10H16V12H14V10Z',
  bridge: 'M7,14V10.91C6.28,10.58 5.61,10.18 5,9.71V14H7M5,18H3V16H1V14H3V7H5V8.43C6.8,10 9.27,11 12,11C14.73,11 17.2,10 19,8.43V7H21V14H23V16H21V18H19V16H5V18M17,10.91V14H19V9.71C18.39,10.18 17.72,10.58 17,10.91M16,14V11.32C15.36,11.55 14.69,11.72 14,11.84V14H16M13,14V11.96L12,12L11,11.96V14H13M10,14V11.84C9.31,11.72 8.64,11.55 8,11.32V14H10Z',
  shirt: 'M16,21H8A1,1 0 0,1 7,20V12.07L5.7,13.07C5.31,13.46 4.68,13.46 4.29,13.07L1.46,10.29C1.07,9.9 1.07,9.27 1.46,8.88L7.34,3H9C9,4.1 10.34,5 12,5C13.66,5 15,4.1 15,3H16.66L22.54,8.88C22.93,9.27 22.93,9.9 22.54,10.29L19.71,13.12C19.32,13.5 18.69,13.5 18.3,13.12L17,12.12V20A1,1 0 0,1 16,21',
  shoe: 'M2 15C2 15 2 12 4 12C4.68 12 5.46 11.95 6.28 11.82C7.2 12.54 8.5 13 10 13H10.25L8.56 11.29C8.91 11.18 9.25 11.05 9.59 10.91L11.5 12.82C11.89 12.74 12.25 12.63 12.58 12.5L10.55 10.45C10.85 10.28 11.14 10.11 11.43 9.91L13.5 12C13.8 11.79 14.04 11.56 14.25 11.32L12.22 9.29C12.46 9.07 12.7 8.83 12.92 8.58L14.79 10.45C14.91 10.14 15 9.83 15 9.5C15 8.65 14.55 7.89 13.84 7.28C13.89 7.19 13.95 7.1 14 7L15.53 6.23C16.38 7.17 18.14 7.84 20.25 7.97L20.3 8H21C21 8 22 9 22 12.5C22 13.07 22 13.57 21.96 14H19C17.9 14 16.58 14.26 15.3 14.5C14.12 14.76 12.9 15 12 15H2M21 17C21 17 21.58 17 21.86 15H19C17 15 14 16 12 16H2.28C2.62 16.6 3.26 17 4 17H21Z',
  tie: 'M6,2L10,6L7,17L12,22L17,17L14,6L18,2Z',
  hair: 'M19,3L13,9L15,11L22,4V3M12,12.5A0.5,0.5 0 0,1 11.5,12A0.5,0.5 0 0,1 12,11.5A0.5,0.5 0 0,1 12.5,12A0.5,0.5 0 0,1 12,12.5M6,20A2,2 0 0,1 4,18C4,16.89 4.9,16 6,16A2,2 0 0,1 8,18C8,19.11 7.1,20 6,20M6,8A2,2 0 0,1 4,6C4,4.89 4.9,4 6,4A2,2 0 0,1 8,6C8,7.11 7.1,8 6,8M9.64,7.64C9.87,7.14 10,6.59 10,6A4,4 0 0,0 6,2A4,4 0 0,0 2,6A4,4 0 0,0 6,10C6.59,10 7.14,9.87 7.64,9.64L10,12L7.64,14.36C7.14,14.13 6.59,14 6,14A4,4 0 0,0 2,18A4,4 0 0,0 6,22A4,4 0 0,0 10,18C10,17.41 9.87,16.86 9.64,16.36L12,14L19,21H22V20L9.64,7.64Z',
  tattoo: 'M11.15,15.18L9.73,13.77L11.15,12.35L12.56,13.77L13.97,12.35L12.56,10.94L13.97,9.53L15.39,10.94L16.8,9.53L13.97,6.7L6.9,13.77L9.73,16.6L11.15,15.18M3.08,19L6.2,15.89L4.08,13.77L13.97,3.87L16.1,6L17.5,4.58L16.1,3.16L17.5,1.75L21.75,6L20.34,7.4L18.92,6L17.5,7.4L19.63,9.53L9.73,19.42L7.61,17.3L3.08,21.84V19Z',
  gym: 'M20.57,14.86L22,13.43L20.57,12L17,15.57L8.43,7L12,3.43L10.57,2L9.14,3.43L7.71,2L5.57,4.14L4.14,2.71L2.71,4.14L4.14,5.57L2,7.71L3.43,9.14L2,10.57L3.43,12L7,8.43L15.57,17L12,20.57L13.43,22L14.86,20.57L16.29,22L18.43,19.86L19.86,21.29L21.29,19.86L19.86,18.43L22,16.29L20.57,14.86Z',
  phone: 'M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z',
  cart: 'M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5.5C20.95,5.34 21,5.17 21,5A1,1 0 0,0 20,4H5.21L4.27,2M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z',
  gift: 'M9.06,1.93C7.17,1.92 5.33,3.74 6.17,6H3A2,2 0 0,0 1,8V10A1,1 0 0,0 2,11H11V8H13V11H22A1,1 0 0,0 23,10V8A2,2 0 0,0 21,6H17.83C19,2.73 14.6,0.42 12.57,3.24L12,4L11.43,3.22C10.8,2.33 9.93,1.94 9.06,1.93M9,4C9.89,4 10.34,5.08 9.71,5.71C9.08,6.34 8,5.89 8,5A1,1 0 0,1 9,4M15,4C15.89,4 16.34,5.08 15.71,5.71C15.08,6.34 14,5.89 14,5A1,1 0 0,1 15,4M2,12V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V12H13V20H11V12H2Z',
  target: 'M11,2V4.07C7.38,4.53 4.53,7.38 4.07,11H2V13H4.07C4.53,16.62 7.38,19.47 11,19.93V22H13V19.93C16.62,19.47 19.47,16.62 19.93,13H22V11H19.93C19.47,7.38 16.62,4.53 13,4.07V2M11,6.08V8H13V6.09C15.5,6.5 17.5,8.5 17.92,11H16V13H17.91C17.5,15.5 15.5,17.5 13,17.92V16H11V17.91C8.5,17.5 6.5,15.5 6.08,13H8V11H6.09C6.5,8.5 8.5,6.5 11,6.08M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11Z',
  arcade: 'M7,6H17A6,6 0 0,1 23,12A6,6 0 0,1 17,18C15.22,18 13.63,17.23 12.53,16H11.47C10.37,17.23 8.78,18 7,18A6,6 0 0,1 1,12A6,6 0 0,1 7,6M6,9V11H4V13H6V15H8V13H10V11H8V9H6M15.5,12A1.5,1.5 0 0,0 14,13.5A1.5,1.5 0 0,0 15.5,15A1.5,1.5 0 0,0 17,13.5A1.5,1.5 0 0,0 15.5,12M18.5,9A1.5,1.5 0 0,0 17,10.5A1.5,1.5 0 0,0 18.5,12A1.5,1.5 0 0,0 20,10.5A1.5,1.5 0 0,0 18.5,9Z',
  drone: 'M5.5,1C8,1 10,3 10,5.5C10,6.38 9.75,7.2 9.31,7.9L9.41,8H14.59L14.69,7.9C14.25,7.2 14,6.38 14,5.5C14,3 16,1 18.5,1C21,1 23,3 23,5.5C23,8 21,10 18.5,10C17.62,10 16.8,9.75 16.1,9.31L15,10.41V13.59L16.1,14.69C16.8,14.25 17.62,14 18.5,14C21,14 23,16 23,18.5C23,21 21,23 18.5,23C16,23 14,21 14,18.5C14,17.62 14.25,16.8 14.69,16.1L14.59,16H9.41L9.31,16.1C9.75,16.8 10,17.62 10,18.5C10,21 8,23 5.5,23C3,23 1,21 1,18.5C1,16 3,14 5.5,14C6.38,14 7.2,14.25 7.9,14.69L9,13.59V10.41L7.9,9.31C7.2,9.75 6.38,10 5.5,10C3,10 1,8 1,5.5C1,3 3,1 5.5,1M5.5,3A2.5,2.5 0 0,0 3,5.5A2.5,2.5 0 0,0 5.5,8A2.5,2.5 0 0,0 8,5.5A2.5,2.5 0 0,0 5.5,3M5.5,16A2.5,2.5 0 0,0 3,18.5A2.5,2.5 0 0,0 5.5,21A2.5,2.5 0 0,0 8,18.5A2.5,2.5 0 0,0 5.5,16M18.5,3A2.5,2.5 0 0,0 16,5.5A2.5,2.5 0 0,0 18.5,8A2.5,2.5 0 0,0 21,5.5A2.5,2.5 0 0,0 18.5,3M18.5,16A2.5,2.5 0 0,0 16,18.5A2.5,2.5 0 0,0 18.5,21A2.5,2.5 0 0,0 21,18.5A2.5,2.5 0 0,0 18.5,16M3.91,17.25L5.04,17.91C5.17,17.81 5.33,17.75 5.5,17.75A0.75,0.75 0 0,1 6.25,18.5L6.24,18.6L7.37,19.25L7.09,19.75L5.96,19.09C5.83,19.19 5.67,19.25 5.5,19.25A0.75,0.75 0 0,1 4.75,18.5L4.76,18.4L3.63,17.75L3.91,17.25M3.63,6.25L4.76,5.6L4.75,5.5A0.75,0.75 0 0,1 5.5,4.75C5.67,4.75 5.83,4.81 5.96,4.91L7.09,4.25L7.37,4.75L6.24,5.4L6.25,5.5A0.75,0.75 0 0,1 5.5,6.25C5.33,6.25 5.17,6.19 5.04,6.09L3.91,6.75L3.63,6.25M16.91,4.25L18.04,4.91C18.17,4.81 18.33,4.75 18.5,4.75A0.75,0.75 0 0,1 19.25,5.5L19.24,5.6L20.37,6.25L20.09,6.75L18.96,6.09C18.83,6.19 18.67,6.25 18.5,6.25A0.75,0.75 0 0,1 17.75,5.5L17.76,5.4L16.63,4.75L16.91,4.25M16.63,19.25L17.75,18.5A0.75,0.75 0 0,1 18.5,17.75C18.67,17.75 18.83,17.81 18.96,17.91L20.09,17.25L20.37,17.75L19.25,18.5A0.75,0.75 0 0,1 18.5,19.25C18.33,19.25 18.17,19.19 18.04,19.09L16.91,19.75L16.63,19.25Z',
  atv: 'M20 11C19.8 11 19.6 11 19.5 11.1L17.4 9H20V6L16.3 7.9L13.4 5H9V7H12.6L14.6 9H11L7 11L5 9H0V11H4C1.8 11 0 12.8 0 15S1.8 19 4 19 8 17.2 8 15L10 17H13L16.5 10.9L17.5 11.9C16.6 12.6 16 13.8 16 15C16 17.2 17.8 19 20 19S24 17.2 24 15 22.2 11 20 11M4 17C2.9 17 2 16.1 2 15S2.9 13 4 13 6 13.9 6 15 5.1 17 4 17M20 17C18.9 17 18 16.1 18 15S18.9 13 20 13 22 13.9 22 15 21.1 17 20 17Z',
  paw: 'M8.35,3C9.53,2.83 10.78,4.12 11.14,5.9C11.5,7.67 10.85,9.25 9.67,9.43C8.5,9.61 7.24,8.32 6.87,6.54C6.5,4.77 7.17,3.19 8.35,3M15.5,3C16.69,3.19 17.35,4.77 17,6.54C16.62,8.32 15.37,9.61 14.19,9.43C13,9.25 12.35,7.67 12.72,5.9C13.08,4.12 14.33,2.83 15.5,3M3,7.6C4.14,7.11 5.69,8 6.5,9.55C7.26,11.13 7,12.79 5.87,13.28C4.74,13.77 3.2,12.89 2.41,11.32C1.62,9.75 1.9,8.08 3,7.6M21,7.6C22.1,8.08 22.38,9.75 21.59,11.32C20.8,12.89 19.26,13.77 18.13,13.28C17,12.79 16.74,11.13 17.5,9.55C18.31,8 19.86,7.11 21,7.6M19.33,18.38C19.37,19.32 18.65,20.36 17.79,20.75C16,21.57 13.88,19.87 11.89,19.87C9.9,19.87 7.76,21.64 6,20.75C5,20.26 4.31,18.96 4.44,17.88C4.62,16.39 6.41,15.59 7.47,14.5C8.88,13.09 9.88,10.44 11.89,10.44C13.89,10.44 14.95,13.05 16.3,14.5C17.41,15.72 19.26,16.75 19.33,18.38Z',
  contact: 'M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z',
  card: 'M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z',
  mag: 'M20 3H4C2.89 3 2 3.89 2 5V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V5C22 3.89 21.11 3 20 3M5 7H10V13H5V7M19 17H5V15H19V17M19 13H12V11H19V13M19 9H12V7H19V9Z',
  book: 'M19 2L14 6.5V17.5L19 13V2M6.5 5C4.55 5 2.45 5.4 1 6.5V21.16C1 21.41 1.25 21.66 1.5 21.66C1.6 21.66 1.65 21.59 1.75 21.59C3.1 20.94 5.05 20.5 6.5 20.5C8.45 20.5 10.55 20.9 12 22C13.35 21.15 15.8 20.5 17.5 20.5C19.15 20.5 20.85 20.81 22.25 21.56C22.35 21.61 22.4 21.59 22.5 21.59C22.75 21.59 23 21.34 23 21.09V6.5C22.4 6.05 21.75 5.75 21 5.5V19C19.9 18.65 18.7 18.5 17.5 18.5C15.8 18.5 13.35 19.15 12 20V6.5C10.55 5.4 8.45 5 6.5 5Z',
  curio: 'M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z',
  art: 'M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.5,1.5 0 0,0 13.5,19.5C13.5,19.11 13.35,18.76 13.11,18.5C12.88,18.23 12.73,17.88 12.73,17.5A1.5,1.5 0 0,1 14.23,16H16A5,5 0 0,0 21,11C21,6.58 16.97,3 12,3Z',
  call: 'M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z',
  playlist: 'M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z',
  hotel: 'M19,7H11V14H3V5H1V20H3V17H21V20H23V11A4,4 0 0,0 19,7M7,13A3,3 0 0,0 10,10A3,3 0 0,0 7,7A3,3 0 0,0 4,10A3,3 0 0,0 7,13Z',
  home: 'M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z',
  factory: 'M4,18V20H8V18H4M4,14V16H14V14H4M10,18V20H14V18H10M16,14V16H20V14H16M16,18V20H20V18H16M2,22V8L7,12V8L12,12V8L17,12L18,2H21L22,12V22H2Z',
  tree: 'M11,21V16.74C10.53,16.91 10.03,17 9.5,17C7,17 5,15 5,12.5C5,11.23 5.5,10.09 6.36,9.27C6.13,8.73 6,8.13 6,7.5C6,5 8,3 10.5,3C12.06,3 13.44,3.8 14.25,5C14.33,5 14.41,5 14.5,5A5.5,5.5 0 0,1 20,10.5A5.5,5.5 0 0,1 14.5,16C14,16 13.5,15.93 13,15.79V21H11Z',
  sweet: 'M12,1.5A2.5,2.5 0 0,1 14.5,4A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 9.5,4A2.5,2.5 0 0,1 12,1.5M15.87,5C18,5 20,7 20,9C22.7,9 22.7,13 20,13H4C1.3,13 1.3,9 4,9C4,7 6,5 8.13,5C8.57,6.73 10.14,8 12,8C13.86,8 15.43,6.73 15.87,5M5,15H8L9,22H7L5,15M10,15H14L13,22H11L10,15M16,15H19L17,22H15L16,15Z',
  statue: 'M6,5H18A1,1 0 0,1 19,6A1,1 0 0,1 18,7H6A1,1 0 0,1 5,6A1,1 0 0,1 6,5M21,2V4H3V2H21M15,8H17V22H15V8M7,8H9V22H7V8M11,8H13V22H11V8Z',
};
const GLYPH_RULES = [ // Reihenfolge zählt: Spezielles vor Allgemeinem
  [/\batm\b/, 'cash'], [/bank/, 'bank'], [/payday|pawn/, 'loan'], [/jewel/, 'jewel'],
  [/charger/, 'ev'], [/gas|fuel/, 'fuel'], [/ferry|marina/, 'ferry'], [/airport/, 'plane'], [/train|metro/, 'train'],
  [/bus|transportation/, 'bus'], [/mud club/, 'atv'], [/liquor/, 'liquor'], [/\bbar\b|drinks/, 'drink'], [/club|playlist/, 'music'],
  [/cafe|takeout/, 'coffee'], [/fast food|street food/, 'burger'], [/food|restaurant/, 'food'],
  [/stunt/, 'stunt'], [/base jump/, 'parachute'], [/knife flight/, 'knife'], [/spray/, 'spray'], [/car ?wash/, 'wash'],
  [/garage/, 'garage'], [/mod ?shop/, 'repair'], [/rental/, 'rental'], [/\bsafe\b/, 'safe'],
  [/basketball/, 'basket'], [/tennis/, 'tennis'], [/golf/, 'golf'], [/pool table/, 'pool'], [/fishing/, 'fish'],
  [/rac(e|ing)|speedway/, 'race'], [/bridge/, 'bridge'], [/souvenir/, 'gift'], [/footwear|shoes/, 'shoe'], [/formal/, 'tie'],
  [/hair/, 'hair'], [/tattoo/, 'tattoo'], [/cloth|wear|casual|thrift/, 'shirt'], [/gym/, 'gym'], [/electronic/, 'phone'],
  [/convenience|supermarket/, 'cart'], [/shooting/, 'target'], [/arcade/, 'arcade'], [/drone/, 'drone'], [/animal/, 'paw'],
  [/contact/, 'contact'], [/jack of hearts/, 'card'], [/magazine/, 'mag'], [/book/, 'book'], [/curiosit/, 'curio'],
  [/mural/, 'art'], [/sculpture/, 'statue'], [/nine1nine/, 'call'], [/delight/, 'sweet'],
  [/hotel/, 'hotel'], [/residential/, 'home'], [/industrial/, 'factory'], [/natural|nature/, 'tree'],
];
function glyph(p) {
  if (p.g) return p.g;
  const s = (p.tags || []).join(' ').toLowerCase();
  return (p.g = (GLYPH_RULES.find(([re]) => re.test(s)) || [, GLYPHS[p.cat] ? p.cat : 'landmark'])[1]);
}
const svg = (g) => `<svg viewBox="0 0 24 24"><path d="${GLYPHS[g]}"/></svg>`;

function icon(p) {
  const c = CATEGORIES[p.cat]?.color || '#fff';
  return L.divIcon({ className: '', iconSize: [26, 26],
    html: `<div class="pin ${esc(p.certainty)}${found.has(p.id) ? ' found' : ''}${p.id === selected ? ' sel' : ''}" style="--c:${c}">${svg(glyph(p))}</div>` });
}

let shown = [];
function render() {
  shown = active().filter((p) => !hidden.has(p.cat) && !(hideFound && found.has(p.id)));
  layer.clearLayers(); draw();
  renderChips();
}

const active = () => pois.filter((p) => !hiddenSrc.has(p.src));

// Nur Marker im sichtbaren Ausschnitt (+Rand) ins DOM – ohne Gruppierung sonst zu langsam.
function draw() {
  const b = map.getBounds().pad(0.5);
  for (const p of shown) {
    const m = markers.get(p.id), inView = b.contains([p.y, p.x]);
    if (inView && !layer.hasLayer(m)) layer.addLayer(m); else if (!inView && layer.hasLayer(m)) layer.removeLayer(m);
  }
}
map.on('moveend', draw);

function renderChips() {
  const srcs = [...new Set(DATA_SRC)].map((k) => ({ k, n: pois.filter((p) => p.src === k).length })).filter((x) => x.n);
  $('#sources').innerHTML = srcs.map(({ k, n }) => `<label class="row"><input type="checkbox" data-src="${k}"${hiddenSrc.has(k) ? '' : ' checked'}>
      <span>${t('src.' + k)} <small class="muted">${n}</small></span></label>`).join('');
  const stats = Object.entries(CATEGORIES).map(([k, c]) => {
    const all = active().filter((p) => p.cat === k);
    return { k, c, n: all.length, f: all.filter((p) => found.has(p.id)).length, off: hidden.has(k) ? ' off' : '' };
  });
  const F = stats.reduce((s, x) => s + x.f, 0), N = stats.reduce((s, x) => s + x.n, 0), P = N ? Math.round((F / N) * 100) : 0;
  $('#total').innerHTML = `<div>${t('found', { n: `<b>${F} / ${N}</b>` })}<span>${P} %</span></div><i style="--p:${N ? (F / N) * 100 : 0}%"></i>`;
  $('#chips').innerHTML = stats.map(({ k, c, n, f, off }) => `<button class="chip${off}" data-cat="${k}" style="--c:${c.color};--p:${n ? (f / n) * 100 : 0}%">
      <i></i>${t('cat.' + k)}<small>${t('found', { n: `${f} / ${n}` })}</small><b></b></button>`).join('');
  // Schnellfilter: Kategorien mit Einträgen zuerst
  $('#quick').innerHTML = [...stats].sort((a, b) => (b.n > 0) - (a.n > 0)).map(({ k, c, n, off }) =>
    `<button class="qchip${off}${n ? '' : ' empty'}" data-cat="${k}" style="--c:${c.color}"><i></i>${t('cat.' + k)}<small>${n}</small></button>`).join('');
  $('#btn-filter').classList.toggle('on', hidden.size > 0 || hideFound || pois.some((p) => hiddenSrc.has(p.src)));
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
    <div class="d-head" style="--c:${c.color}"><div class="d-icon">${svg(glyph(p))}</div>
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
  map.flyTo([p.y, p.x], Math.max(map.getZoom(), 5), { duration: 0.6 });
  if (!shown.includes(p)) { hidden.delete(p.cat); hiddenSrc.delete(p.src); store.set('hiddenSrc', [...hiddenSrc]); render(); }
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
$('#sources').onchange = (e) => {
  const k = e.target.dataset.src; if (!k) return;
  e.target.checked ? hiddenSrc.delete(k) : hiddenSrc.add(k);
  store.set('hiddenSrc', [...hiddenSrc]); render();
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
  const hits = active().filter((p) => norm(`${pname(p)} ${p.area} ${p.model} ${p.desc} ${(p.tags || []).map((s) => s + ' ' + tag(s)).join(' ')}`).includes(q)).slice(0, 30);
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
    lists.forEach((l, i) => l.forEach((p) => (p.src = DATA_SRC[i])));
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
