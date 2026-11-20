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
    markers: 'Markierungen', showAll: 'Alle zeigen', hideAll: 'Alle verbergen', show: 'Anzeigen', hide: 'Ausblenden', complete: 'Erledigt', incomplete: 'Offen', allMarkers: 'Alle Marker', heatmaps: 'Heatmaps',
    heatText: 'Zeigt, wo sich Einträge einer Kategorie häufen.',
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
    markers: 'Markers', showAll: 'Show all', hideAll: 'Hide all', show: 'Show', hide: 'Hide', complete: 'Complete', incomplete: 'Incomplete', allMarkers: 'All markers', heatmaps: 'Heatmaps',
    heatText: 'Shows where entries of a category cluster.',
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
// Untertypen (Symbole): Schlüssel|Deutsch|Englisch
`landmark|Sehenswürdigkeit|Landmark;mission|Mission|Mission;side|Nebenmission|Side mission;secret|Secret|Secret;weapon|Waffe|Weapon;vehicle|Fahrzeug|Vehicle;activity|Aktivität|Activity;shop|Shop|Shop;cash|Geldautomat|ATM;bank|Bank|Bank;loan|Kredite|Payday loans;tow|Geldautomat (abschleppbar)|ATM (towable);ring|Modeschmuck|Low-end jewelry;pawn|Pfandhaus|Pawn shop;timer|Rennherausforderung|Racing challenge;mud|Schlammclub|Mud club;road|Hit 'n' Run|Hit 'n' Run;hanger|Secondhand|Thrift;jewel|Juwelier|Jewelry store;fuel|Tankstelle|Gas station;ev|Ladestation|EV charger;bus|Bus|Bus;train|Zug & Metro|Train & metro;ferry|Fähre & Marina|Ferry & marina;plane|Flughafen|Airport;drink|Bar|Bar;liquor|Spirituosen|Liquor store;music|Club|Club;coffee|Café|Café;burger|Fast Food|Fast food;food|Restaurant|Restaurant;stunt|Stuntsprung|Stunt jump;parachute|Basejump|Base jump;knife|Messerflug|Knife flight;repair|Werkstatt|Mod shop;spray|Lackiererei|Paint shop;wash|Waschanlage|Car wash;garage|Garage|Garage;rental|Verleih|Rental;safe|Tresor|Safe;basket|Basketball|Basketball;tennis|Tennis|Tennis;golf|Golf|Golf;pool|Billard|Pool;fish|Angeln|Fishing;race|Rennen|Racing;bridge|Brücke|Bridge;shirt|Kleidung|Clothing;shoe|Schuhe|Shoes;tie|Formelle Mode|Formal wear;hair|Friseur|Barber;tattoo|Tattoo|Tattoo;gym|Fitnessstudio|Gym;phone|Elektronik|Electronics;cart|Supermarkt|Grocery;gift|Souvenirs|Souvenirs;target|Schießstand|Shooting range;arcade|Spielhalle|Arcade;drone|Drohne|Drone;atv|Quad|ATV;paw|Tiere|Animals;contact|Kontakt|Contact;card|Spielkarte|Playing card;mag|Magazin|Magazine;book|Buch|Book;curio|Kuriosität|Curiosity;art|Wandbild|Mural;call|Notruf|Emergency call;playlist|Playlist|Playlist;hotel|Hotel|Hotel;home|Wohngebäude|Residential;factory|Industrie|Industrial;tree|Natur|Nature;sweet|Süßigkeiten|Sweets;statue|Skulptur|Sculpture;office|Büro|Office;parking|Parken|Parking;prison|Gefängnis|Prison;lifeguard|Rettungsschwimmer|Lifeguard;church|Kirche|Church;police|Polizei|Police;fire|Feuerwehr|Fire station;lighthouse|Leuchtturm|Lighthouse;stadium|Stadion|Stadium;school|Schule|School;hospital|Krankenhaus|Hospital;port|Hafen|Port;power|Versorgung|Utilities;radio|Funk|Radio;beach|Strand|Beach;anchor|Pier|Pier;aquarium|Aquarium|Aquarium;gavel|Behörde|Government;ferriswheel|Riesenrad|Ferris wheel;tunnel|Tunnel|Tunnel;barn|Farm|Farm;store|Geschäft|Store;blimp|Luftschiff|Blimp;museum|Museum|Museum;park|Park|Park;building|Gebäude|Building;construction|Baustelle|Construction`.split(';').forEach((r) => {
  const [k, de, en] = r.split('|'); I18N.de['g.' + k] = de; I18N.en['g.' + k] = en;
});
// Gruppierte Ansicht (nur importierte Daten): Bereiche und Gruppen, Schlüssel|Bereich|Deutsch|Englisch
'loc||Orte|Locations;col||Sammlungen|Collections;act||Aktivitäten|Activities'.split(';').forEach((r) => {
  const [k, , de, en] = r.split('|'); I18N.de['sec.' + k] = de; I18N.en['sec.' + k] = en;
});
const GROUPS = `poi|loc|Sehenswerte Orte|Points of interest;rob|loc|Überfälle|Robberies;veh|loc|Fahrzeuge|Vehicles;style|loc|Style|Style;food|loc|Essen & Trinken|Food & drink;waink|col|Waink-Orte|WAiNK locations;expl|col|Erkundung|Exploration;cards|col|Sammelkarten|Collectible cards;sports|act|Sport|Sports;acts|act|Aktivitäten|Activities;stunts|act|Stunts|Stunts;racing|act|Rennen|Racing;illegal|act|Illegale Geschäfte|Illegal operations`
  .split(';').map((r) => { const [k, s, de, en] = r.split('|'); I18N.de['grp.' + k] = de; I18N.en['grp.' + k] = en; return { k, s, en: en.toLowerCase() }; });
const grpOf = (p) => GROUPS.find((g) => g.en === String(p.tags?.[1] || '').toLowerCase()) || { k: 'c-' + p.cat, s: 'loc', cat: p.cat };
const subKey = (p) => (p.id.startsWith('ext-') && p.tags?.[0]) || 'g:' + glyph(p); // Untertyp = Typname bzw. Symbol
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
const hiddenG = new Set(store.get('hiddenG', []).filter((g) => !g.includes(':') || g.startsWith('g:'))); // ausgeblendete Untertypen (Typname)
let hideOpen = store.get('hideOpen', false);
const collapsed = new Set(store.get('collapsed', []));
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
  coffee: 'M11,9H9V2H7V9H5V2H3V9C3,11.12 4.66,12.84 6.75,12.97V22H9.25V12.97C11.34,12.84 13,11.12 13,9V2H11V9M16,6V14H18.5V22H21V2C18.24,2 16,4.24 16,6Z',
  burger: 'M22 13C22 14.11 21.11 15 20 15H4C2.9 15 2 14.11 2 13S2.9 11 4 11H13L15.5 13L18 11H20C21.11 11 22 11.9 22 13M12 3C3 3 3 9 3 9H21C21 9 21 3 12 3M3 18C3 19.66 4.34 21 6 21H18C19.66 21 21 19.66 21 18V17H3V18Z',
  food: 'M11,9H9V2H7V9H5V2H3V9C3,11.12 4.66,12.84 6.75,12.97V22H9.25V12.97C11.34,12.84 13,11.12 13,9V2H11V9M16,6V14H18.5V22H21V2C18.24,2 16,4.24 16,6Z',
  stunt: 'M22,13V22H2V19L22,13M21.68,7.06L16.86,4.46L17.7,7.24L7.58,10.24C6.63,8.95 4.82,8.67 3.53,9.62C2.24,10.57 1.96,12.38 2.91,13.67C3.85,14.97 5.67,15.24 6.96,14.29C7.67,13.78 8.1,12.97 8.14,12.09L18.26,9.09L19.1,11.87L21.68,7.06Z',
  parachute: 'M21.2,10.95L12,23L2.78,10.96L2.87,10.88C3.08,10.67 3.33,10.5 3.58,10.36L10.73,19.69L8.58,13L9.24,11.81L12,20.38L14.73,11.8L15.4,13L13.27,19.69L20.41,10.35C20.66,10.5 20.9,10.64 21.1,10.85L21.2,10.95M5,9C6.5,9 7.81,9.86 8.5,11.1C9.17,9.86 10.47,9 12,9C13.5,9 14.8,9.85 15.5,11.09C16.16,9.84 17.47,9 19,9C20.09,9 21.09,9.42 21.81,10.14C20.94,5.5 16.88,2 12,2C7.09,2 3.03,5.5 2.16,10.17C2.89,9.45 3.89,9 5,9Z',
  knife: 'M20.56 3.91C21.15 4.5 21.15 5.45 20.56 6.03L16.67 9.92L18.79 19.11L17.38 20.53L13.5 13.1L9.6 17L9.96 19.47L8.89 20.53L7.13 17.35L3.94 15.58L5 14.5L7.5 14.87L11.37 11L3.94 7.09L5.36 5.68L14.55 7.8L18.44 3.91C19 3.33 20 3.33 20.56 3.91Z',
  repair: 'M6.5 5C5.84 5 5.28 5.42 5.08 6L3 12V20A1 1 0 0 0 4 21H5A1 1 0 0 0 6 20V19H11.3A7 7 0 0 1 11 17A7 7 0 0 1 14.41 11H5L6.5 6.5H17.5L18.68 10.03A7 7 0 0 1 20.47 10.46L18.92 6C18.72 5.42 18.16 5 17.5 5H6.5M17 12C16.87 12 16.76 12.09 16.74 12.21L16.55 13.53C16.25 13.66 15.96 13.82 15.7 14L14.46 13.5C14.35 13.5 14.22 13.5 14.15 13.63L13.15 15.36C13.09 15.47 13.11 15.6 13.21 15.68L14.27 16.5C14.25 16.67 14.24 16.83 14.24 17C14.24 17.17 14.25 17.33 14.27 17.5L13.21 18.32C13.12 18.4 13.09 18.53 13.15 18.64L14.15 20.37C14.21 20.5 14.34 20.5 14.46 20.5L15.7 20C15.96 20.18 16.24 20.35 16.55 20.47L16.74 21.79C16.76 21.91 16.86 22 17 22H19C19.11 22 19.22 21.91 19.24 21.79L19.43 20.47C19.73 20.34 20 20.18 20.27 20L21.5 20.5C21.63 20.5 21.76 20.5 21.83 20.37L22.83 18.64C22.89 18.53 22.86 18.4 22.77 18.32L21.7 17.5C21.72 17.33 21.74 17.17 21.74 17C21.74 16.83 21.73 16.67 21.7 16.5L22.76 15.68C22.85 15.6 22.88 15.47 22.82 15.36L21.82 13.63C21.76 13.5 21.63 13.5 21.5 13.5L20.27 14C20 13.82 19.73 13.65 19.42 13.53L19.23 12.21C19.22 12.09 19.11 12 19 12H17M6.5 13A1.5 1.5 0 0 1 8 14.5A1.5 1.5 0 0 1 6.5 16A1.5 1.5 0 0 1 5 14.5A1.5 1.5 0 0 1 6.5 13M18 15.5C18.83 15.5 19.5 16.17 19.5 17C19.5 17.83 18.83 18.5 18 18.5C17.16 18.5 16.5 17.83 16.5 17C16.5 16.17 17.17 15.5 18 15.5Z',
  spray: 'M10,4H12V6H10V4M7,3H9V5H7V3M7,6H9V8H7V6M6,8V10H4V8H6M6,5V7H4V5H6M6,2V4H4V2H6M13,22A2,2 0 0,1 11,20V10A2,2 0 0,1 13,8V7H14V4H17V7H18V8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H13M13,10V20H18V10H13Z',
  wash: 'M5,13L6.5,8.5H17.5L19,13M17.5,18A1.5,1.5 0 0,1 16,16.5A1.5,1.5 0 0,1 17.5,15A1.5,1.5 0 0,1 19,16.5A1.5,1.5 0 0,1 17.5,18M6.5,18A1.5,1.5 0 0,1 5,16.5A1.5,1.5 0 0,1 6.5,15A1.5,1.5 0 0,1 8,16.5A1.5,1.5 0 0,1 6.5,18M18.92,8C18.72,7.42 18.16,7 17.5,7H6.5C5.84,7 5.28,7.42 5.08,8L3,14V22A1,1 0 0,0 4,23H5A1,1 0 0,0 6,22V21H18V22A1,1 0 0,0 19,23H20A1,1 0 0,0 21,22V14M7,5A1.5,1.5 0 0,0 8.5,3.5C8.5,2.5 7,0.8 7,0.8C7,0.8 5.5,2.5 5.5,3.5A1.5,1.5 0 0,0 7,5M12,5A1.5,1.5 0 0,0 13.5,3.5C13.5,2.5 12,0.8 12,0.8C12,0.8 10.5,2.5 10.5,3.5A1.5,1.5 0 0,0 12,5M17,5A1.5,1.5 0 0,0 18.5,3.5C18.5,2.5 17,0.8 17,0.8C17,0.8 15.5,2.5 15.5,3.5A1.5,1.5 0 0,0 17,5Z',
  garage: 'M19,20H17V11H7V20H5V9L12,5L19,9V20M8,12H16V14H8V12M8,15H16V17H8V15M16,18V20H8V18H16Z',
  rental: 'M9 0C7.3 0 6 1.3 6 3S7.3 6 9 6C10.3 6 11.4 5.2 11.8 4H14V6H16V4H18V2H11.8C11.4 .8 10.3 0 9 0M9 2C9.6 2 10 2.4 10 3S9.6 4 9 4 8 3.6 8 3 8.4 2 9 2M6.5 8C5.8 8 5.3 8.4 5.1 9L3 15V23C3 23.6 3.4 24 4 24H5C5.6 24 6 23.6 6 23V22H18V23C18 23.6 18.4 24 19 24H20C20.6 24 21 23.6 21 23V15L18.9 9C18.7 8.4 18.1 8 17.5 8H6.5M6.5 9.5H17.5L19 14H5L6.5 9.5M6.5 16C7.3 16 8 16.7 8 17.5S7.3 19 6.5 19 5 18.3 5 17.5 5.7 16 6.5 16M17.5 16C18.3 16 19 16.7 19 17.5S18.3 19 17.5 19 16 18.3 16 17.5 16.7 16 17.5 16Z',
  safe: 'M4,4A2,2 0 0,0 2,6V17A2,2 0 0,0 4,19V20H6V19H17V20H19V19A2,2 0 0,0 21,17V16H22V14H21V9H22V7H21V6A2,2 0 0,0 19,4H4M4,6H19V17H4V6M13.5,7.5A4,4 0 0,0 9.5,11.5A4,4 0 0,0 13.5,15.5A4,4 0 0,0 17.5,11.5A4,4 0 0,0 13.5,7.5M5,9V14H7V9H5M13.5,9.5A2,2 0 0,1 15.5,11.5A2,2 0 0,1 13.5,13.5A2,2 0 0,1 11.5,11.5A2,2 0 0,1 13.5,9.5Z',
  basket: 'M21,2H3A2,2 0 0,0 1,4V16A2,2 0 0,0 3,18H5V14H19V18H21A2,2 0 0,0 23,16V4A2,2 0 0,0 21,2M17,12H15V9H9V12H7V9A2,2 0 0,1 9,7H15A2,2 0 0,1 17,9V12M7,16V19.5L8,23L10,21L12,23L14,21L16,23L17,19.5V16H7Z',
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
  tattoo: 'M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z',
  gym: 'M20.57,14.86L22,13.43L20.57,12L17,15.57L8.43,7L12,3.43L10.57,2L9.14,3.43L7.71,2L5.57,4.14L4.14,2.71L2.71,4.14L4.14,5.57L2,7.71L3.43,9.14L2,10.57L3.43,12L7,8.43L15.57,17L12,20.57L13.43,22L14.86,20.57L16.29,22L18.43,19.86L19.86,21.29L21.29,19.86L19.86,18.43L22,16.29L20.57,14.86Z',
  phone: 'M12,1C7,1 3,5 3,10V17A3,3 0 0,0 6,20H9V12H5V10A7,7 0 0,1 12,3A7,7 0 0,1 19,10V12H15V20H18A3,3 0 0,0 21,17V10C21,5 16.97,1 12,1Z',
  cart: 'M5.5,21C4.72,21 4.04,20.55 3.71,19.9V19.9L1.1,10.44L1,10A1,1 0 0,1 2,9H6.58L11.18,2.43C11.36,2.17 11.66,2 12,2C12.34,2 12.65,2.17 12.83,2.44L17.42,9H22A1,1 0 0,1 23,10L22.96,10.29L20.29,19.9C19.96,20.55 19.28,21 18.5,21H5.5M12,4.74L9,9H15L12,4.74M12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17A2,2 0 0,0 14,15A2,2 0 0,0 12,13Z',
  gift: 'M9.06,1.93C7.17,1.92 5.33,3.74 6.17,6H3A2,2 0 0,0 1,8V10A1,1 0 0,0 2,11H11V8H13V11H22A1,1 0 0,0 23,10V8A2,2 0 0,0 21,6H17.83C19,2.73 14.6,0.42 12.57,3.24L12,4L11.43,3.22C10.8,2.33 9.93,1.94 9.06,1.93M9,4C9.89,4 10.34,5.08 9.71,5.71C9.08,6.34 8,5.89 8,5A1,1 0 0,1 9,4M15,4C15.89,4 16.34,5.08 15.71,5.71C15.08,6.34 14,5.89 14,5A1,1 0 0,1 15,4M2,12V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V12H13V20H11V12H2Z',
  target: 'M11,2V4.07C7.38,4.53 4.53,7.38 4.07,11H2V13H4.07C4.53,16.62 7.38,19.47 11,19.93V22H13V19.93C16.62,19.47 19.47,16.62 19.93,13H22V11H19.93C19.47,7.38 16.62,4.53 13,4.07V2M11,6.08V8H13V6.09C15.5,6.5 17.5,8.5 17.92,11H16V13H17.91C17.5,15.5 15.5,17.5 13,17.92V16H11V17.91C8.5,17.5 6.5,15.5 6.08,13H8V11H6.09C6.5,8.5 8.5,6.5 11,6.08M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11Z',
  arcade: 'M7,6H17A6,6 0 0,1 23,12A6,6 0 0,1 17,18C15.22,18 13.63,17.23 12.53,16H11.47C10.37,17.23 8.78,18 7,18A6,6 0 0,1 1,12A6,6 0 0,1 7,6M6,9V11H4V13H6V15H8V13H10V11H8V9H6M15.5,12A1.5,1.5 0 0,0 14,13.5A1.5,1.5 0 0,0 15.5,15A1.5,1.5 0 0,0 17,13.5A1.5,1.5 0 0,0 15.5,12M18.5,9A1.5,1.5 0 0,0 17,10.5A1.5,1.5 0 0,0 18.5,12A1.5,1.5 0 0,0 20,10.5A1.5,1.5 0 0,0 18.5,9Z',
  drone: 'M5.5,1C8,1 10,3 10,5.5C10,6.38 9.75,7.2 9.31,7.9L9.41,8H14.59L14.69,7.9C14.25,7.2 14,6.38 14,5.5C14,3 16,1 18.5,1C21,1 23,3 23,5.5C23,8 21,10 18.5,10C17.62,10 16.8,9.75 16.1,9.31L15,10.41V13.59L16.1,14.69C16.8,14.25 17.62,14 18.5,14C21,14 23,16 23,18.5C23,21 21,23 18.5,23C16,23 14,21 14,18.5C14,17.62 14.25,16.8 14.69,16.1L14.59,16H9.41L9.31,16.1C9.75,16.8 10,17.62 10,18.5C10,21 8,23 5.5,23C3,23 1,21 1,18.5C1,16 3,14 5.5,14C6.38,14 7.2,14.25 7.9,14.69L9,13.59V10.41L7.9,9.31C7.2,9.75 6.38,10 5.5,10C3,10 1,8 1,5.5C1,3 3,1 5.5,1M5.5,3A2.5,2.5 0 0,0 3,5.5A2.5,2.5 0 0,0 5.5,8A2.5,2.5 0 0,0 8,5.5A2.5,2.5 0 0,0 5.5,3M5.5,16A2.5,2.5 0 0,0 3,18.5A2.5,2.5 0 0,0 5.5,21A2.5,2.5 0 0,0 8,18.5A2.5,2.5 0 0,0 5.5,16M18.5,3A2.5,2.5 0 0,0 16,5.5A2.5,2.5 0 0,0 18.5,8A2.5,2.5 0 0,0 21,5.5A2.5,2.5 0 0,0 18.5,3M18.5,16A2.5,2.5 0 0,0 16,18.5A2.5,2.5 0 0,0 18.5,21A2.5,2.5 0 0,0 21,18.5A2.5,2.5 0 0,0 18.5,16M3.91,17.25L5.04,17.91C5.17,17.81 5.33,17.75 5.5,17.75A0.75,0.75 0 0,1 6.25,18.5L6.24,18.6L7.37,19.25L7.09,19.75L5.96,19.09C5.83,19.19 5.67,19.25 5.5,19.25A0.75,0.75 0 0,1 4.75,18.5L4.76,18.4L3.63,17.75L3.91,17.25M3.63,6.25L4.76,5.6L4.75,5.5A0.75,0.75 0 0,1 5.5,4.75C5.67,4.75 5.83,4.81 5.96,4.91L7.09,4.25L7.37,4.75L6.24,5.4L6.25,5.5A0.75,0.75 0 0,1 5.5,6.25C5.33,6.25 5.17,6.19 5.04,6.09L3.91,6.75L3.63,6.25M16.91,4.25L18.04,4.91C18.17,4.81 18.33,4.75 18.5,4.75A0.75,0.75 0 0,1 19.25,5.5L19.24,5.6L20.37,6.25L20.09,6.75L18.96,6.09C18.83,6.19 18.67,6.25 18.5,6.25A0.75,0.75 0 0,1 17.75,5.5L17.76,5.4L16.63,4.75L16.91,4.25M16.63,19.25L17.75,18.5A0.75,0.75 0 0,1 18.5,17.75C18.67,17.75 18.83,17.81 18.96,17.91L20.09,17.25L20.37,17.75L19.25,18.5A0.75,0.75 0 0,1 18.5,19.25C18.33,19.25 18.17,19.19 18.04,19.09L16.91,19.75L16.63,19.25Z',
  atv: 'M20 11C19.8 11 19.6 11 19.5 11.1L17.4 9H20V6L16.3 7.9L13.4 5H9V7H12.6L14.6 9H11L7 11L5 9H0V11H4C1.8 11 0 12.8 0 15S1.8 19 4 19 8 17.2 8 15L10 17H13L16.5 10.9L17.5 11.9C16.6 12.6 16 13.8 16 15C16 17.2 17.8 19 20 19S24 17.2 24 15 22.2 11 20 11M4 17C2.9 17 2 16.1 2 15S2.9 13 4 13 6 13.9 6 15 5.1 17 4 17M20 17C18.9 17 18 16.1 18 15S18.9 13 20 13 22 13.9 22 15 21.1 17 20 17Z',
  paw: 'M14,6L10.25,11L13.1,14.8L11.5,16C9.81,13.75 7,10 7,10L1,18H23L14,6Z',
  contact: 'M20 8H22V6L20 4H3A2 2 0 0 0 1 6V15A2 2 0 0 0 3 17H4A3 3 0 0 0 7 20A3 3 0 0 0 10 17H15A3 3 0 0 0 21 17H23V12M7 18.5A1.5 1.5 0 0 1 7 15.5A1.5 1.5 0 0 1 7 18.5M9 12H3V9H9M14 15H11V9H14M18 18.5A1.5 1.5 0 1 1 19.5 17A1.54 1.54 0 0 1 18 18.5M17 12V9.5H19.5L21.5 12Z',
  card: 'M14.7 2.2H16.2C17.3 2.2 18.2 3.1 18.2 4.2V10.6L14.7 2.2M20.1 3.8L21.4 4.4C22.4 4.8 22.9 6 22.5 7L20.1 12.9V3.8M18 15.5L13 3.5C12.7 2.7 12 2.3 11.2 2.3C10.9 2.3 10.7 2.4 10.4 2.5L3 5.5C2 5.9 1.5 7 2 8L7 20C7.3 20.8 8 21.2 8.8 21.2C9.1 21.2 9.3 21.2 9.6 21L17 18C17.8 17.7 18.2 17 18.2 16.2C18.1 16 18.1 15.7 18 15.5M11.4 15L8.2 12.6L8.6 8.6L11.8 11L11.4 15',
  mag: 'M19 2L14 6.5V17.5L19 13V2M6.5 5C4.55 5 2.45 5.4 1 6.5V21.16C1 21.41 1.25 21.66 1.5 21.66C1.6 21.66 1.65 21.59 1.75 21.59C3.1 20.94 5.05 20.5 6.5 20.5C8.45 20.5 10.55 20.9 12 22C13.35 21.15 15.8 20.5 17.5 20.5C19.15 20.5 20.85 20.81 22.25 21.56C22.35 21.61 22.4 21.59 22.5 21.59C22.75 21.59 23 21.34 23 21.09V6.5C22.4 6.05 21.75 5.75 21 5.5V19C19.9 18.65 18.7 18.5 17.5 18.5C15.8 18.5 13.35 19.15 12 20V6.5C10.55 5.4 8.45 5 6.5 5Z',
  book: 'M19 2L14 6.5V17.5L19 13V2M6.5 5C4.55 5 2.45 5.4 1 6.5V21.16C1 21.41 1.25 21.66 1.5 21.66C1.6 21.66 1.65 21.59 1.75 21.59C3.1 20.94 5.05 20.5 6.5 20.5C8.45 20.5 10.55 20.9 12 22C13.35 21.15 15.8 20.5 17.5 20.5C19.15 20.5 20.85 20.81 22.25 21.56C22.35 21.61 22.4 21.59 22.5 21.59C22.75 21.59 23 21.34 23 21.09V6.5C22.4 6.05 21.75 5.75 21 5.5V19C19.9 18.65 18.7 18.5 17.5 18.5C15.8 18.5 13.35 19.15 12 20V6.5C10.55 5.4 8.45 5 6.5 5Z',
  curio: 'M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z',
  art: 'M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z',
  call: 'M14.7 2.2H16.2C17.3 2.2 18.2 3.1 18.2 4.2V10.6L14.7 2.2M20.1 3.8L21.4 4.4C22.4 4.8 22.9 6 22.5 7L20.1 12.9V3.8M18 15.5L13 3.5C12.7 2.7 12 2.3 11.2 2.3C10.9 2.3 10.7 2.4 10.4 2.5L3 5.5C2 5.9 1.5 7 2 8L7 20C7.3 20.8 8 21.2 8.8 21.2C9.1 21.2 9.3 21.2 9.6 21L17 18C17.8 17.7 18.2 17 18.2 16.2C18.1 16 18.1 15.7 18 15.5M11.4 15L8.2 12.6L8.6 8.6L11.8 11L11.4 15',
  playlist: 'M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17S7.79 21 10 21 14 19.21 14 17V7H18V3H12Z',
  hotel: 'M19,7H11V14H3V5H1V20H3V17H21V20H23V11A4,4 0 0,0 19,7M7,13A3,3 0 0,0 10,10A3,3 0 0,0 7,7A3,3 0 0,0 4,10A3,3 0 0,0 7,13Z',
  home: 'M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z',
  factory: 'M4,18V20H8V18H4M4,14V16H14V14H4M10,18V20H14V18H10M16,14V16H20V14H16M16,18V20H20V18H16M2,22V8L7,12V8L12,12V8L17,12L18,2H21L22,12V22H2Z',
  tree: 'M11,21V16.74C10.53,16.91 10.03,17 9.5,17C7,17 5,15 5,12.5C5,11.23 5.5,10.09 6.36,9.27C6.13,8.73 6,8.13 6,7.5C6,5 8,3 10.5,3C12.06,3 13.44,3.8 14.25,5C14.33,5 14.41,5 14.5,5A5.5,5.5 0 0,1 20,10.5A5.5,5.5 0 0,1 14.5,16C14,16 13.5,15.93 13,15.79V21H11Z',
  sweet: 'M14.7 2.2H16.2C17.3 2.2 18.2 3.1 18.2 4.2V10.6L14.7 2.2M20.1 3.8L21.4 4.4C22.4 4.8 22.9 6 22.5 7L20.1 12.9V3.8M18 15.5L13 3.5C12.7 2.7 12 2.3 11.2 2.3C10.9 2.3 10.7 2.4 10.4 2.5L3 5.5C2 5.9 1.5 7 2 8L7 20C7.3 20.8 8 21.2 8.8 21.2C9.1 21.2 9.3 21.2 9.6 21L17 18C17.8 17.7 18.2 17 18.2 16.2C18.1 16 18.1 15.7 18 15.5M11.4 15L8.2 12.6L8.6 8.6L11.8 11L11.4 15',
  statue: 'M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z',
  office: 'M5,3V21H11V17.5H13V21H19V3H5M7,5H9V7H7V5M11,5H13V7H11V5M15,5H17V7H15V5M7,9H9V11H7V9M11,9H13V11H11V9M15,9H17V11H15V9M7,13H9V15H7V13M11,13H13V15H11V13M15,13H17V15H15V13M7,17H9V19H7V17M15,17H17V19H15V17Z',
  parking: 'M13.2,11H10V7H13.2A2,2 0 0,1 15.2,9A2,2 0 0,1 13.2,11M13,3H6V21H10V15H13A6,6 0 0,0 19,9C19,5.68 16.31,3 13,3Z',
  prison: 'M20.24 6.76C18.4 4.91 15.65 4.53 13.42 5.59L12.46 4.63C12.07 4.24 11.44 4.24 11.05 4.63L10.97 4.72C10.83 3.75 10 3 9 3C7.9 3 7 3.9 7 5C7 5.09 7 5.18 7.03 5.26C6.42 5.61 6 6.25 6 7C6 7.46 6.16 7.87 6.42 8.21C6.17 8.39 6 8.67 6 9V10.35C3.67 11.17 2 13.39 2 16C2 19.31 4.69 22 8 22S14 19.31 14 16C14 13.39 12.33 11.17 10 10.35V9C10 8.67 9.83 8.39 9.58 8.21C9.84 7.87 10 7.46 10 7C10 6.91 10 6.82 9.97 6.74C10.15 6.64 10.3 6.5 10.43 6.38C11.36 6.88 12 7.86 12 9V9.08C12.13 9.15 12.25 9.25 12.38 9.33C12.57 8.91 12.83 8.5 13.17 8.17C14.73 6.61 17.27 6.61 18.83 8.17C20.39 9.73 20.39 12.27 18.83 13.83C18.03 14.63 17 15 15.93 15C16 15.32 16 15.66 16 16C16 16.34 15.97 16.67 15.93 17C17.5 17 19.05 16.43 20.24 15.24C22.59 12.9 22.59 9.1 20.24 6.76M9 4C9.55 4 10 4.45 10 5C10 5.33 9.83 5.61 9.58 5.79C9.22 5.31 8.65 5 8 5C8 4.45 8.45 4 9 4M7.42 6.21C7.78 6.69 8.35 7 9 7C9 7.55 8.55 8 8 8S7 7.55 7 7C7 6.67 7.17 6.39 7.42 6.21M12 16C12 18.21 10.21 20 8 20S4 18.21 4 16C4 13.79 5.79 12 8 12S12 13.79 12 16Z',
  lifeguard: 'M19.79,15.41C20.74,13.24 20.74,10.75 19.79,8.59L17.05,9.83C17.65,11.21 17.65,12.78 17.06,14.17L19.79,15.41M15.42,4.21C13.25,3.26 10.76,3.26 8.59,4.21L9.83,6.94C11.22,6.35 12.79,6.35 14.18,6.95L15.42,4.21M4.21,8.58C3.26,10.76 3.26,13.24 4.21,15.42L6.95,14.17C6.35,12.79 6.35,11.21 6.95,9.82L4.21,8.58M8.59,19.79C10.76,20.74 13.25,20.74 15.42,19.78L14.18,17.05C12.8,17.65 11.22,17.65 9.84,17.06L8.59,19.79M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z',
  church: 'M18 12.22V9L13 6.5V5H15V3H13V1H11V3H9V5H11V6.5L6 9V12.22L2 14V22H10V19C10 17.9 10.9 17 12 17S14 17.9 14 19V22H22V14L18 12.22M12 13.5C11.17 13.5 10.5 12.83 10.5 12S11.17 10.5 12 10.5 13.5 11.17 13.5 12 12.83 13.5 12 13.5Z',
  police: 'M22 4L20 2C18.85 2.64 17.4 3 16 3C14.6 3 13.14 2.63 12 2C10.86 2.63 9.4 3 8 3C6.6 3 5.15 2.64 4 2L2 4C2 4 4 6 4 8S2 14 2 16C2 20 12 22 12 22S22 20 22 16C22 14 20 10 20 8S22 4 22 4M15.05 16.45L11.97 14.59L8.9 16.45L9.72 12.95L7 10.61L10.58 10.3L11.97 7L13.37 10.29L16.95 10.6L14.23 12.94L15.05 16.45Z',
  fire: 'M17.04,2C16.85,2 16.66,2.04 16.5,2.14L5.59,8.5H9.55L17.5,3.86C18,3.58 18.13,2.97 17.85,2.5C17.68,2.2 17.38,2 17.04,2M16,8V10H3A2,2 0 0,0 1,12H2V15H1V19H3A3,3 0 0,0 6,22A3,3 0 0,0 9,19H15A3,3 0 0,0 18,22A3,3 0 0,0 21,19H23V12.5L19.5,8H16M18,9.5H19L21.5,12.5V13.5H18V9.5M4,12H7V15H4V12M9,12H12V15H9V12M14,12H16V15H14V12M6,17.5A1.5,1.5 0 0,1 7.5,19A1.5,1.5 0 0,1 6,20.5A1.5,1.5 0 0,1 4.5,19A1.5,1.5 0 0,1 6,17.5M18,17.5A1.5,1.5 0 0,1 19.5,19A1.5,1.5 0 0,1 18,20.5A1.5,1.5 0 0,1 16.5,19A1.5,1.5 0 0,1 18,17.5Z',
  lighthouse: 'M8,10V8H9V4H8V3L12,1L16,3V4H15V8H16V10H14.74L8.44,13.64L9,10H8M13,8V4H11V8H13M7,23L7.04,22.76L16.15,17.5L16.67,20.88L13,23H7M8.05,16.17L15.31,12L15.83,15.37L7.43,20.22L8.05,16.17Z',
  stadium: 'M7 5L3 7V3L7 5M18 3V7L22 5L18 3M11 2V6L15 4L11 2M5 10C6.4 10.5 8.8 11 12 11S17.6 10.5 19 10C19 9.8 16.2 9 12 9S5 9.9 5 10M15 17H9V21.9C4.9 21.5 2 20.4 2 19V10C2 8.3 6.5 7 12 7S22 8.3 22 10V19C22 20.3 19.1 21.5 15 21.9V17Z',
  school: 'M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z',
  hospital: 'M18,14H14V18H10V14H6V10H10V6H14V10H18M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z',
  port: 'M20,20C18.61,20 17.22,19.53 16,18.67C13.56,20.38 10.44,20.38 8,18.67C6.78,19.53 5.39,20 4,20H2V22H4C5.37,22 6.74,21.65 8,21C10.5,22.3 13.5,22.3 16,21C17.26,21.65 18.62,22 20,22H22V20H20M20,4V3A1,1 0 0,0 19,2H9V1H6V2H5V4H6V13H5V11H3V13H2V15H3V19H4C4.33,19 4.67,18.97 5,18.92V15H10V18.65C10.65,18.85 11.33,18.95 12,18.95V18.92L12,15H13V13H12V11H10V13H9V4H17V8.62C16.53,8.79 16.19,9.23 16.19,9.76C16.19,10.2 16.43,10.6 16.8,10.82V12H17.42C17.76,12 18.03,12.28 18.03,12.62C18.03,12.96 17.76,13.24 17.42,13.24C17.2,13.24 17,13.12 16.88,12.93C16.71,12.64 16.34,12.54 16.05,12.71C15.75,12.87 15.65,13.25 15.82,13.55C16.15,14.11 16.76,14.47 17.42,14.47C18.43,14.47 19.26,13.64 19.26,12.62C19.26,11.84 18.76,11.14 18.03,10.88V10.82C18.41,10.6 18.65,10.2 18.65,9.76C18.65,9.3 18.38,8.91 18,8.7V4H20M8,11.66L7,12.66V11.24L8,10.24V11.66M8,8.71L7,9.71V8.29L8,7.29V8.71M7,6.71V5.29L8,4.29V5.71L7,6.71Z',
  power: 'M8.28,5.45L6.5,4.55L7.76,2H16.23L17.5,4.55L15.72,5.44L15,4H9L8.28,5.45M18.62,8H14.09L13.3,5H10.7L9.91,8H5.38L4.1,10.55L5.89,11.44L6.62,10H17.38L18.1,11.45L19.89,10.56L18.62,8M17.77,22H15.7L15.46,21.1L12,15.9L8.53,21.1L8.3,22H6.23L9.12,11H11.19L10.83,12.35L12,14.1L13.16,12.35L12.81,11H14.88L17.77,22M11.4,15L10.5,13.65L9.32,18.13L11.4,15M14.68,18.12L13.5,13.64L12.6,15L14.68,18.12Z',
  radio: 'M12,10A2,2 0 0,1 14,12C14,12.5 13.82,12.94 13.53,13.29L16.7,22H14.57L12,14.93L9.43,22H7.3L10.47,13.29C10.18,12.94 10,12.5 10,12A2,2 0 0,1 12,10M12,8A4,4 0 0,0 8,12C8,12.5 8.1,13 8.28,13.46L7.4,15.86C6.53,14.81 6,13.47 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12C18,13.47 17.47,14.81 16.6,15.86L15.72,13.46C15.9,13 16,12.5 16,12A4,4 0 0,0 12,8M12,4A8,8 0 0,0 4,12C4,14.36 5,16.5 6.64,17.94L5.92,19.94C3.54,18.11 2,15.23 2,12A10,10 0 0,1 12,2A10,10 0 0,1 22,12C22,15.23 20.46,18.11 18.08,19.94L17.36,17.94C19,16.5 20,14.36 20,12A8,8 0 0,0 12,4Z',
  beach: 'M15,18.54C17.13,18.21 19.5,18 22,18V22H5C5,21.35 8.2,19.86 13,18.9V12.4C12.16,12.65 11.45,13.21 11,13.95C10.39,12.93 9.27,12.25 8,12.25C6.73,12.25 5.61,12.93 5,13.95C5.03,10.37 8.5,7.43 13,7.04V7A1,1 0 0,1 14,6A1,1 0 0,1 15,7V7.04C19.5,7.43 22.96,10.37 23,13.95C22.39,12.93 21.27,12.25 20,12.25C18.73,12.25 17.61,12.93 17,13.95C16.55,13.21 15.84,12.65 15,12.39V18.54M7,2A5,5 0 0,1 2,7V2H7Z',
  anchor: 'M12 2A3 3 0 0 0 9 5A3 3 0 0 0 11 7.83V9H8V11H11V19.92C10.26 19.79 9.5 19.58 8.79 19.27C8.05 18.95 7.4 18.56 6.82 18.09C6.24 17.62 5.78 17.11 5.44 16.55L7 15L3 12V15C3 15.97 3.27 16.88 3.82 17.72C4.37 18.56 5.09 19.31 6 19.95C6.87 20.59 7.84 21.09 8.88 21.45C9.93 21.81 10.97 22 12 22C13.03 22 14.07 21.8 15.12 21.44C16.16 21.08 17.13 20.58 18 19.95C18.92 19.31 19.63 18.57 20.18 17.72C20.73 16.88 21 15.97 21 15V12L17 15L18.56 16.55C18.22 17.11 17.76 17.62 17.18 18.09C16.6 18.56 15.95 18.95 15.21 19.27C14.5 19.58 13.74 19.79 13 19.92V11H16V9H13V7.82A3 3 0 0 0 15 5A3 3 0 0 0 12 2M12 4A1 1 0 0 1 13 5A1 1 0 0 1 12 6A1 1 0 0 1 11 5A1 1 0 0 1 12 4Z',
  aquarium: 'M19.11,5H21V3H3V5H4.89C3.11,6.8 2,9.27 2,12C2,15.97 4.31,19.39 7.66,21H16.34C19.69,19.39 22,15.97 22,12C22,9.27 20.89,6.8 19.11,5M13.25,17C12.09,17 11.06,16.64 10.33,16.17C9.67,17 8.33,17 7,17C8.1,17 8.5,15.88 8.5,14.5C8.5,13.12 8.1,12 7,12C8.33,12 9.67,12 10.37,12.91C11.06,12.36 12.09,12 13.25,12C15.32,12 17,13.12 17,14.5C17,15.88 15.32,17 13.25,17M16,7C13.56,8.71 10.44,8.71 8,7C7.06,7.66 6,8.09 4.95,8.25C5.31,7.58 5.77,6.96 6.32,6.41L7.7,5H16.3L17.68,6.41C18.23,6.96 18.69,7.58 19.05,8.25C18,8.09 16.94,7.66 16,7Z',
  gavel: 'M2.3,20.28L11.9,10.68L10.5,9.26L9.78,9.97C9.39,10.36 8.76,10.36 8.37,9.97L7.66,9.26C7.27,8.87 7.27,8.24 7.66,7.85L13.32,2.19C13.71,1.8 14.34,1.8 14.73,2.19L15.44,2.9C15.83,3.29 15.83,3.92 15.44,4.31L14.73,5L16.15,6.43C16.54,6.04 17.17,6.04 17.56,6.43C17.95,6.82 17.95,7.46 17.56,7.85L18.97,9.26L19.68,8.55C20.07,8.16 20.71,8.16 21.1,8.55L21.8,9.26C22.19,9.65 22.19,10.29 21.8,10.68L16.15,16.33C15.76,16.72 15.12,16.72 14.73,16.33L14.03,15.63C13.63,15.24 13.63,14.6 14.03,14.21L14.73,13.5L13.32,12.09L3.71,21.7C3.32,22.09 2.69,22.09 2.3,21.7C1.91,21.31 1.91,20.67 2.3,20.28M20,19A2,2 0 0,1 22,21V22H12V21A2,2 0 0,1 14,19H20Z',
  ferriswheel: 'M12,19C12.86,19 13.59,19.54 13.87,20.29C14.42,20.17 14.95,20 15.46,19.77L13.7,15.62C13.18,15.87 12.61,16 12,16C11.39,16 10.82,15.87 10.3,15.62L8.54,19.77C9.05,20 9.58,20.17 10.13,20.29C10.41,19.54 11.14,19 12,19M18.25,17.76C18,17.42 17.81,17 17.81,16.5C17.81,15.41 18.71,14.5 19.81,14.5L20.12,14.53C20.37,13.73 20.5,12.88 20.5,12C20.5,11.12 20.37,10.27 20.12,9.5H19.81C18.7,9.5 17.81,8.61 17.81,7.5C17.81,7 17.97,6.59 18.25,6.24C17.1,5 15.59,4.09 13.87,3.71C13.59,4.46 12.86,5 12,5C11.14,5 10.41,4.46 10.13,3.71C8.41,4.09 6.9,5 5.75,6.24C6.03,6.59 6.2,7.03 6.2,7.5C6.2,8.61 5.3,9.5 4.2,9.5H3.88C3.63,10.28 3.5,11.12 3.5,12C3.5,12.89 3.64,13.74 3.89,14.55L4.2,14.5C5.31,14.5 6.2,15.42 6.2,16.5C6.2,17 6.04,17.43 5.76,17.77C6.08,18.12 6.44,18.44 6.81,18.73L8.71,14.27C8.26,13.62 8,12.84 8,12A4,4 0 0,1 12,8A4,4 0 0,1 16,12C16,12.84 15.74,13.62 15.29,14.27L17.19,18.73C17.57,18.44 17.92,18.11 18.25,17.76M12,23C11,23 10.16,22.26 10,21.29C9.37,21.16 8.75,20.95 8.15,20.69L7.17,23H5L6.41,19.68C5.88,19.3 5.39,18.86 4.96,18.37C4.72,18.47 4.47,18.5 4.2,18.5A2,2 0 0,1 2.2,16.5C2.2,15.88 2.5,15.32 2.97,14.95C2.66,14 2.5,13.03 2.5,12C2.5,11 2.66,10 2.96,9.08C2.5,8.71 2.2,8.15 2.2,7.5C2.2,6.41 3.09,5.5 4.2,5.5C4.46,5.5 4.71,5.56 4.93,5.65C6.25,4.18 8,3.13 10,2.71C10.16,1.74 11,1 12,1C13,1 13.84,1.74 14,2.71C16,3.13 17.74,4.18 19.06,5.64C19.29,5.55 19.54,5.5 19.81,5.5A2,2 0 0,1 21.81,7.5C21.81,8.14 21.5,8.71 21.04,9.07C21.34,10 21.5,11 21.5,12C21.5,13 21.34,14 21.04,14.93C21.5,15.3 21.81,15.87 21.81,16.5C21.81,17.62 20.92,18.5 19.81,18.5C19.54,18.5 19.29,18.46 19.05,18.36C18.61,18.85 18.12,19.29 17.59,19.68L19,23H16.83L15.85,20.69C15.25,20.95 14.63,21.16 14,21.29C13.84,22.26 13,23 12,23Z',
  tunnel: 'M12 2C6.5 2 2 6.5 2 12V22H22V12C22 6.5 17.5 2 12 2M7.1 5.69C8.21 4.83 9.54 4.25 11 4.07V6.09C10.09 6.24 9.25 6.6 8.53 7.11L7.1 5.69M15.47 7.11C14.75 6.6 13.91 6.24 13 6.09V4.07C14.46 4.25 15.79 4.83 16.9 5.69L15.47 7.11M5.69 7.1L7.11 8.53C6.6 9.25 6.24 10.09 6.09 11H4.07C4.25 9.54 4.83 8.21 5.69 7.1M6 13V15.5H4V13H6M4 20V17.5H6V20H4M16.89 8.53L18.31 7.1C19.17 8.21 19.75 9.54 19.93 11H17.91C17.76 10.09 17.4 9.25 16.89 8.53M18 13H20V15.5H18V13M18 20V17.5H20V20H18Z',
  barn: 'M12,3L3,8.2V21H9L11.9,18L15,21H21V8.2L12,3M7.9,20V14L10.9,17L7.9,20M8.9,13H14.9L11.9,16L8.9,13M15.9,20L12.9,17L15.9,14V20M15,11H8.8V9H15V11Z',
  store: 'M5.06 3C4.63 3 4.22 3.14 3.84 3.42C3.46 3.7 3.24 4.06 3.14 4.5L2.11 8.91C1.86 10 2.06 10.92 2.69 11.73C2.81 11.85 2.93 11.97 3.04 12.07C3.63 12.64 4.28 13 5.22 13C6.16 13 6.91 12.59 7.47 12.05C8.1 12.67 8.86 13 9.8 13C10.64 13 11.44 12.63 12 12.07C12.68 12.7 13.45 13 14.3 13C15.17 13 15.91 12.67 16.54 12.05C17.11 12.62 17.86 13 18.81 13C19.76 13 20.43 12.65 21 12.06C21.09 11.97 21.18 11.87 21.28 11.77C21.94 10.95 22.14 10 21.89 8.91L20.86 4.5C20.73 4.06 20.5 3.7 20.13 3.42C19.77 3.14 19.38 3 18.94 3M18.89 4.97L19.97 9.38C20.06 9.81 19.97 10.2 19.69 10.55C19.44 10.86 19.13 11 18.75 11C18.44 11 18.17 10.9 17.95 10.66C17.73 10.43 17.61 10.16 17.58 9.84L16.97 5M5.06 5H7.03L6.42 9.84C6.3 10.63 5.91 11 5.25 11C4.84 11 4.53 10.86 4.31 10.55C4.03 10.2 3.94 9.81 4.03 9.38M9.05 5H11V9.7C11 10.05 10.89 10.35 10.64 10.62C10.39 10.88 10.08 11 9.7 11C9.36 11 9.07 10.88 8.84 10.59C8.61 10.3 8.5 10 8.5 9.66V9.5M13 5H14.95L15.5 9.5C15.58 9.92 15.5 10.27 15.21 10.57C14.95 10.87 14.61 11 14.2 11C13.89 11 13.61 10.88 13.36 10.62C13.11 10.35 13 10.05 13 9.7M3 14.03V19C3 20.11 3.89 21 5 21C9.67 21 14.33 21 19 21C20.1 21 21 20.11 21 19V14.05C20.45 14.63 19.75 14.96 19 15C18 15.03 17.25 14.74 16.54 14.05C15.94 14.65 15.14 15 14.3 15C13.4 15 12.6 14.64 12 14.07C11.43 14.64 10.65 15 9.78 15C8.87 15 8.07 14.65 7.47 14.05C6.89 14.64 6.1 15 5.23 15C4.33 15 3.66 14.65 3 14.03Z',
  blimp: 'M11,23A2,2 0 0,1 9,21V19H15V21A2,2 0 0,1 13,23H11M12,1C12.71,1 13.39,1.09 14.05,1.26C15.22,2.83 16,5.71 16,9C16,11.28 15.62,13.37 15,16A2,2 0 0,1 13,18H11A2,2 0 0,1 9,16C8.38,13.37 8,11.28 8,9C8,5.71 8.78,2.83 9.95,1.26C10.61,1.09 11.29,1 12,1M20,8C20,11.18 18.15,15.92 15.46,17.21C16.41,15.39 17,11.83 17,9C17,6.17 16.41,3.61 15.46,1.79C18.15,3.08 20,4.82 20,8M4,8C4,4.82 5.85,3.08 8.54,1.79C7.59,3.61 7,6.17 7,9C7,11.83 7.59,15.39 8.54,17.21C5.85,15.92 4,11.18 4,8Z',
  museum: 'M6.5,10H4.5V17H6.5V10M12.5,10H10.5V17H12.5V10M21,19H2V21H21V19M18.5,10H16.5V17H18.5V10M11.5,3.26L16.71,6H6.29L11.5,3.26M11.5,1L2,6V8H21V6L11.5,1Z',
  park: 'M10,21V18H3L8,13H5L10,8H7L12,3L17,8H14L19,13H16L21,18H14V21H10Z',
  building: 'M18,15H16V17H18M18,11H16V13H18M20,19H12V17H14V15H12V13H14V11H12V9H20M10,7H8V5H10M10,11H8V9H10M10,15H8V13H10M10,19H8V17H10M6,7H4V5H6M6,11H4V9H6M6,15H4V13H6M6,19H4V17H6M12,7V3H2V21H22V7H12Z',
  construction: 'M20,6V5A1,1 0 0,0 19,4H9V3H6V4H5V6H6V15H5V13H3V15H2V17H3V21H5V17H10V21H12V19.92L12,17H13V15H12V13H10V15H9V6H17V10.62C16.53,10.79 16.19,11.23 16.19,11.76C16.19,12.2 16.43,12.6 16.8,12.82V14H17.42C17.76,14 18.03,14.28 18.03,14.62C18.03,14.96 17.76,15.24 17.42,15.24C17.2,15.24 17,15.12 16.89,14.93C16.71,14.64 16.34,14.54 16.05,14.71C15.75,14.87 15.65,15.25 15.82,15.55C16.15,16.11 16.76,16.47 17.42,16.47C18.43,16.47 19.26,15.64 19.26,14.62C19.26,13.84 18.76,13.14 18.03,12.88V12.82C18.41,12.6 18.65,12.2 18.65,11.76C18.65,11.3 18.38,10.91 18,10.7V6H20M8,13.66L7,14.66V13.24L8,12.24V13.66M8,10.71L7,11.71V10.29L8,9.29V10.71M7,8.71V7.29L8,6.29V7.71L7,8.71Z',
};
Object.assign(GLYPHS, {
  ring: 'M12,10L8,4.4L9.6,2H14.4L16,4.4L12,10M15.5,6.8L14.3,8.5C16.5,9.4 18,11.5 18,14A6,6 0 0,1 12,20A6,6 0 0,1 6,14C6,11.5 7.5,9.4 9.7,8.5L8.5,6.8C5.8,8.1 4,10.8 4,14A8,8 0 0,0 12,22A8,8 0 0,0 20,14C20,10.8 18.2,8.1 15.5,6.8Z',
  pawn: 'M15 4A8 8 0 1 1 7 12A8 8 0 0 1 15 4M3 12A6 6 0 0 0 7 17.65V19.74A8 8 0 0 1 7 4.26V6.35A6 6 0 0 0 3 12Z',
  timer: 'M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z',
  mud: 'M16.23,18L12,15.45L7.77,18L8.89,13.19L5.16,9.96L10.08,9.54L12,5L13.92,9.53L18.84,9.95L15.11,13.18L16.23,18M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z',
  road: 'M18.1,4.8C18,4.3 17.6,4 17.1,4H13L13.2,7H10.8L11,4H6.8C6.3,4 5.9,4.4 5.8,4.8L3.1,18.8C3,19.4 3.5,20 4.1,20H10L10.3,15H13.7L14,20H19.8C20.4,20 20.9,19.4 20.8,18.8L18.1,4.8M10.4,13L10.6,9H13.2L13.4,13H10.4Z',
  hanger: 'M12 4A3.5 3.5 0 0 0 8.5 7.5H10.5A1.5 1.5 0 0 1 12 6A1.5 1.5 0 0 1 13.5 7.5A1.5 1.5 0 0 1 12 9C11.45 9 11 9.45 11 10V11.75L2.4 18.2A1 1 0 0 0 3 20H21A1 1 0 0 0 21.6 18.2L13 11.75V10.85A3.5 3.5 0 0 0 15.5 7.5A3.5 3.5 0 0 0 12 4M12 13.5L18 18H6Z',
  tow: 'M3,6H21V18H3V6M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M7,8A2,2 0 0,1 5,10V14A2,2 0 0,1 7,16H17A2,2 0 0,1 19,14V10A2,2 0 0,1 17,8H7Z',
});
const GLYPH_RULES = [ // Reihenfolge zählt: Spezielles vor Allgemeinem
  [/atm \(towable/, 'tow'], [/\batm\b/, 'cash'], [/bank/, 'bank'], [/payday/, 'loan'], [/pawn/, 'pawn'], [/low-end jewel/, 'ring'], [/jewel/, 'jewel'],
  [/charger/, 'ev'], [/gas|fuel/, 'fuel'], [/ferry|marina/, 'ferry'], [/airport/, 'plane'], [/train|metro/, 'train'],
  [/bus|transportation/, 'bus'], [/mud club/, 'mud'], [/hit 'n' run/, 'road'], [/racing challenge/, 'timer'], [/liquor/, 'liquor'], [/\bbar\b|drinks/, 'drink'], [/playlist/, 'playlist'], [/club/, 'music'],
  [/cafe|takeout/, 'coffee'], [/fast food|street food/, 'burger'], [/food|restaurant/, 'food'],
  [/stunt/, 'stunt'], [/base jump/, 'parachute'], [/knife flight/, 'knife'], [/spray/, 'spray'], [/car ?wash/, 'wash'],
  [/garage/, 'garage'], [/mod ?shop/, 'repair'], [/rental/, 'rental'], [/\bsafe\b/, 'safe'],
  [/basketball/, 'basket'], [/tennis/, 'tennis'], [/golf/, 'golf'], [/pool table/, 'pool'], [/fishing/, 'fish'],
  [/rac(e|ing)|speedway/, 'race'], [/bridge/, 'bridge'], [/souvenir/, 'gift'], [/footwear|shoes/, 'shoe'], [/formal/, 'tie'],
  [/hair/, 'hair'], [/tattoo/, 'tattoo'], [/thrift/, 'hanger'], [/cloth|wear|casual/, 'shirt'], [/gym/, 'gym'], [/electronic/, 'phone'],
  [/convenience|supermarket/, 'cart'], [/shooting/, 'target'], [/arcade/, 'arcade'], [/drone/, 'drone'], [/animal/, 'paw'],
  [/contact/, 'contact'], [/jack of hearts/, 'card'], [/magazine/, 'mag'], [/book/, 'book'], [/curiosit/, 'curio'],
  [/mural/, 'art'], [/sculpture/, 'statue'], [/nine1nine/, 'call'], [/delight/, 'sweet'],
  [/hotel/, 'hotel'], [/residential/, 'home'], [/industrial/, 'factory'], [/natural|nature/, 'tree'],
  [/police/, 'police'], [/hospital/, 'hospital'], [/\bfire\b/, 'fire'], [/ferris ?wheel/, 'ferriswheel'], [/blimp/, 'blimp'],
  [/agricultur/, 'barn'], [/airbase/, 'plane'], [/utilit/, 'power'], [/government|court/, 'gavel'], [/office/, 'office'],
  [/construction/, 'construction'], [/commercial/, 'store'],
];
const NAME_RULES = [ // Fallback über Name/Vorbild, nur ganze Wörter
  [/\b(police|sheriff)\b/, 'police'], [/\bfire (station|department|house)\b/, 'fire'], [/\b(prison|jail|penitentiary)\b/, 'prison'],
  [/\b(hospital|medical|clinic)\b/, 'hospital'], [/\b(court ?house|city hall|capitol)\b/, 'gavel'], [/\blifeguard\b/, 'lifeguard'],
  [/\blighthouse\b/, 'lighthouse'], [/\b(church|chapel|cathedral)\b/, 'church'], [/\b(stadium|arena|ballpark)\b/, 'stadium'],
  [/\b(school|university|college|academy)\b/, 'school'], [/\b(oceanarium|seaquarium|aquarium)\b/, 'aquarium'], [/\bmuseum\b/, 'museum'],
  [/\b(airport|airfield|air ?base)\b/, 'plane'], [/\b(train|metro|rail)\b/, 'train'], [/\b(marina|cruise|ferry)\b/, 'ferry'],
  [/\b(port|harbou?r|container|terminal|shipyard)\b/, 'port'], [/\b(pier|dock|wharf)\b/, 'anchor'], [/\bbridge\b/, 'bridge'],
  [/\btunnel\b/, 'tunnel'], [/\b(parking|car ?park)\b/, 'parking'], [/\bgarage\b/, 'garage'], [/\b(gas|fuel)\b/, 'fuel'],
  [/\b(power|nuclear|substation|plant)\b/, 'power'], [/\b(radio|antenna|broadcast)\b/, 'radio'], [/\bconstruction\b/, 'construction'],
  [/\b(hotel|motel|resort)\b/, 'hotel'], [/\b(condo|condominium|apartments?|house|villa|mansion)\b/, 'home'], [/\bbank\b/, 'bank'],
  [/\bpawn\b/, 'loan'], [/\b(bar|pub|tavern|saloon)\b/, 'drink'], [/\b(night ?club|club)\b/, 'music'], [/\b(cafe|coffee)\b/, 'coffee'],
  [/\b(restaurant|diner|grill|kitchen|bbq)\b/, 'food'], [/\b(mall|market|plaza|outlet|store|shop)\b/, 'store'], [/\btennis\b/, 'tennis'],
  [/\bgolf\b/, 'golf'], [/\bbeach\b/, 'beach'], [/\b(park|garden|preserve|forest|swamp|everglades)\b/, 'park'], [/\b(farm|ranch|barn)\b/, 'barn'],
  [/\b(office|tower|building|center|centre|headquarters)\b/, 'office'],
];
function glyph(p) {
  if (p.g) return p.g;
  const s = (p.tags || []).join(' ').toLowerCase();
  const n = `${p.name || ''} ${p.model || ''}`.toLowerCase();
  return (p.g = (GLYPH_RULES.find(([re]) => re.test(s)) || NAME_RULES.find(([re]) => re.test(n))
    || [, GLYPHS[p.cat] ? p.cat : 'landmark'])[1]);
}
const svg = (g) => `<svg viewBox="0 0 24 24"><path d="${GLYPHS[g]}"/></svg>`;
// Form je Symbol: freistehend (ohne Hintergrund), Achteck oder (Standard) abgerundetes Quadrat
const FREE = new Set(['vehicle', 'landmark', 'cash', 'tow', 'safe', 'ev', 'bus', 'train', 'ferry', 'plane', 'rental', 'blimp', 'curio', 'statue',
  'book', 'mag', 'playlist', 'art', 'card', 'sweet', 'call', 'basket', 'pool', 'arcade', 'fish', 'stunt', 'parachute', 'knife', 'bridge']);
const OCT = new Set(['side', 'bank', 'loan', 'pawn', 'ring', 'jewel']);
const shape = (g) => (FREE.has(g) ? ' free' : OCT.has(g) ? ' oct' : '');
// Importierte Typen: eigene Farbe und Form je Typ
const TYPE_STYLE = {};
[['#ffffff', ' free', "ATM|Safe|Electric Charger|Bus Stop|Ferry Terminal|Rental Vehicle|Landmark|Curiosity|Sculpture|Book Swap|Magazine|Unique Playlist|1010 Mural|Basketball Hoop|Pool Table|Arcade Machine|Stunt Jump|Base Jump|Knife Flight|Under the Bridge"],
 ['#4f6bff', '', "Gym|Club|Golf Course|Mini-Golf Course|Shooting Range|Racing Introduction|Racing Challenge|Ambrosia Raceway|Gellhorn Raceway|Hamlet Boone Speedway|Thrillbilly Mud Club|Animal Crackers|Hit 'n' Run VC|Top Fun Drones"],
 ['#ff6a55', '', "Ammu-Nation|Pay 'N' Spray|Mod Shop|Casual & Street|Sportswear|Formal|Souvenir & Swimwear|Thrift|Footwear|Hair & Beauty|Tattoos|Electronics"],
 ['#2ecc40', ' oct', "Bank|Big Bank|Payday Loans|Low-End Jewelry Store|High-End Jewelry Store|Pawn Shop|ATM (Towable)"],
 ['#8aa4ff', '', "Convenience Store|Fast Food|Street Food|Liquor Store|Gas Station|Car Wash|Train Station|Cafes & Takeout|Bar"],
 ['#a5e635', '', 'Contact'], ['#20e8c8', '', 'Garage|Purchasable Garage'],
 ['#ffc400', ' oct', "Standout Vehicle|Jack of Hearts|Delights|Nine1Nine|Kingfishers|Kolt & Associates|M7|La Polilla Negra|Final Chapter|San4San|PTT Youngin$|The Guardia Brothers|Criminals"],
 ['#50c8f0', '', 'Randy Vehicle'], ['#ff4fa3', '', 'Moses Vehicle'], ['#a36bff', '', 'Fishing Hotspot'],
].forEach(([c, sh, l]) => l.split('|').forEach((n) => (TYPE_STYLE[n] = [c, sh])));
// Klassen + Stil eines Pins: importierte Typen exakt gefärbt, sonst Kategoriefarbe
function pinAttr(p) {
  const ts = p.id.startsWith('ext-') && TYPE_STYLE[p.tags?.[0]];
  return ts ? `c-${esc(p.cat)}${ts[1]} t" style="--c:${ts[0]}` : `c-${esc(p.cat)}${shape(glyph(p))}" style="--c:${CATEGORIES[p.cat]?.color || '#fff'}`;
}

function icon(p) {
  return L.divIcon({ className: '', iconSize: [24, 24],
    html: `<div class="pin ${esc(p.certainty)}${found.has(p.id) ? ' found' : ''}${p.id === selected ? ' sel' : ''} ${pinAttr(p)}">${svg(glyph(p))}</div>` });
}

let shown = [];
function render() {
  const isExt = active().some((p) => p.id.startsWith('ext-')); // Untertyp-Filter nur in der gruppierten Ansicht
  shown = active().filter((p) => !hidden.has(p.cat) && !(isExt && hiddenG.has(subKey(p)))
    && !(found.has(p.id) ? hideFound : hideOpen));
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

// ---------- Heatmap: eigene Canvas-Ebene, Dichte je Kategorie ----------
const heatCats = new Set(store.get('heatCats', []));
let extHeat = []; // importierte Heatmaps {label, title, pts:[[x,y,w]]}
let heatSel = store.get('heatSel', ''); // gewählte importierte Heatmap "label|title"
const heatOpen = new Set(store.get('heatOpen', []));
const isExtMode = () => active().some((p) => p.id.startsWith('ext-'));
const selHeat = () => (isExtMode() ? extHeat.find((h) => h.label + '|' + h.title === heatSel) : null);
const heat = new (L.Layer.extend({
  onAdd(m) { this._c = L.DomUtil.create('canvas', 'heat', m.getPanes().overlayPane); m.on('moveend resize', this.redraw, this);
    m.on('zoomstart', () => (this._c.style.opacity = 0)); this.redraw(); },
  redraw() {
    const m = this._map, c = this._c; if (!c) return;
    const sz = m.getSize(), pts = active().filter((p) => heatCats.has(p.cat));
    c.width = sz.x; c.height = sz.y; L.DomUtil.setPosition(c, m.containerPointToLayerPoint([0, 0])); c.style.opacity = 1;
    const h = selHeat();
    if (h) return this.weighted(c.getContext('2d'), sz, h.pts);
    if (isExtMode() && extHeat.length) return;
    if (!pts.length) return;
    const r = Math.max(14, Math.min(70, 300 * 2 ** (m.getZoom() - 5))), ctx = c.getContext('2d');
    for (const p of pts) {
      const q = m.latLngToContainerPoint([p.y, p.x]);
      if (q.x < -r || q.y < -r || q.x > sz.x + r || q.y > sz.y + r) continue;
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(q.x - r, q.y - r, 2 * r, 2 * r);
    }
    const img = ctx.getImageData(0, 0, sz.x, sz.y), d = img.data;
    for (let i = 3; i < d.length; i += 4) { // Dichte → Farbe (blau → grün → gelb → rot)
      const a = d[i] / 255; if (!a) continue;
      const [cr, cg, cb] = HEAT_RAMP[Math.min(255, Math.round(a * 255))];
      d[i - 3] = cr; d[i - 2] = cg; d[i - 1] = cb; d[i] = Math.min(255, 60 + a * 255);
    }
    ctx.putImageData(img, 0, 0);
  },
  // Gewichtete Punkte: feste Pixelgröße, Deckkraft je Gewicht, Farbe über Verlauf (Transparenz bleibt)
  weighted(ctx, sz, pts) {
    const m = this._map, r = 30, ws = pts.map((p) => p[2]).sort((a, b) => a - b), max = ws[Math.floor(ws.length * 0.9)] || 1;
    for (const [x, y, w] of pts) {
      const q = m.latLngToContainerPoint([y, x]);
      if (q.x < -r || q.y < -r || q.x > sz.x + r || q.y > sz.y + r) continue;
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = Math.min(1, Math.max(0.05, w / max)); ctx.fillStyle = g; ctx.fillRect(q.x - r, q.y - r, 2 * r, 2 * r);
    }
    const img = ctx.getImageData(0, 0, sz.x, sz.y), d = img.data;
    for (let i = 3; i < d.length; i += 4) {
      if (!d[i]) continue;
      const [cr, cg, cb] = HEAT_RAMP2[d[i]]; d[i - 3] = cr; d[i - 2] = cg; d[i - 1] = cb;
    }
    ctx.putImageData(img, 0, 0);
  },
}))().addTo(map);
const ramp = (stops) => { // 256 Farbstufen aus einem Verlauf
  const c = document.createElement('canvas'); c.width = 256; c.height = 1; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 256, 0);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  x.fillStyle = g; x.fillRect(0, 0, 256, 1);
  const d = x.getImageData(0, 0, 256, 1).data; return Array.from({ length: 256 }, (_, i) => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
};
const HEAT_RAMP = ramp([[0, '#2b6cff'], [.35, '#28e0c8'], [.6, '#b6f03c'], [.8, '#ffd23c'], [1, '#ff3c2b']]);
const HEAT_RAMP2 = ramp([[0, 'royalblue'], [.1, 'royalblue'], [.3, 'cyan'], [.5, 'lime'], [.7, 'yellow'], [1, 'red']]);

// Bereich → Gruppe → Untertypen, je Ebene Anzeigen/Ausblenden
function groupedChips() {
  const tree = {};
  for (const p of active()) {
    const g = grpOf(p), sk = subKey(p), d = found.has(p.id) ? 1 : 0;
    const G = ((tree[g.s] ||= {})[g.k] ||= { g, n: 0, f: 0, subs: {} });
    const S = (G.subs[sk] ||= { p, n: 0, f: 0 });
    G.n++; G.f += d; S.n++; S.f += d;
  }
  const sh = (k) => `<button data-grp="show" data-k="${k}">${t('show')}</button><button data-grp="hide" data-k="${k}">${t('hide')}</button>`;
  const chev = (k) => `<i class="chev${collapsed.has(k) ? '' : ' open'}"></i>`;
  return ['loc', 'col', 'act'].filter((s) => tree[s]).map((s) => `<section class="grp"><div class="grp-head sec">
      <button class="grp-t" data-fold="sec:${s}"><span>${t('sec.' + s)}</span>${chev('sec:' + s)}</button>${sh('sec:' + s)}</div>
    ${collapsed.has('sec:' + s) ? '' : Object.values(tree[s]).map(({ g, n, f, subs }) => `<div class="grp-head">
      <button class="grp-t" data-fold="grp:${g.k}" style="--c:${CATEGORIES[Object.values(subs)[0].p.cat]?.color};--p:${(f / n) * 100}%"><span>${g.cat ? t('cat.' + g.cat) : t('grp.' + g.k)}</span><small>${f}/${n}</small>${chev('grp:' + g.k)}<b></b></button>${sh('grp:' + g.k)}</div>
      ${collapsed.has('grp:' + g.k) ? '' : `<div class="grid2">${Object.entries(subs).map(([sk, { p, n, f }]) => `<button class="chip sub${hidden.has(p.cat) || hiddenG.has(sk) ? ' off' : ''}" data-g="${esc(sk)}" style="--c:${CATEGORIES[p.cat]?.color};--p:${(f / n) * 100}%">
        <span class="pin ${pinAttr(p)}">${svg(glyph(p))}</span><span>${sk.startsWith('g:') ? t('g.' + sk.slice(2)) : esc(tag(sk))}</span><small>${n}</small><b></b></button>`).join('')}</div>`}`).join('')}</section>`).join('');
}
// Kategorie über Untertypen statt komplett ausblenden, damit einzelne Typen wieder sichtbar werden können
const unhideCat = (c) => { if (hidden.delete(c)) active().filter((p) => p.cat === c).forEach((p) => hiddenG.add(subKey(p))); };

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
  const badge = (k) => `<span class="pin c-${k}${shape(k)}">${svg(k)}</span>`;
  const ext = active().some((p) => p.id.startsWith('ext-'));
  $('#filter').classList.toggle('ext', ext);
  $('#markers-h').textContent = t(ext ? 'allMarkers' : 'markers');
  const ring = (k, off, n, lbl) => `<button class="ring-b${off ? ' off' : ''}" data-state="${k}" style="--p:${N ? (n / N) * 100 : 0}%">
    <i class="ring"></i><span>${t(lbl)}</span><small>${n}/${N}</small></button>`;
  $('#state').innerHTML = !ext ? '' : ring('found', hideFound, F, 'complete') + ring('open', hideOpen, N - F, 'incomplete');
  // Je Kategorie eine aufklappbare Gruppe mit Untertypen
  $('#chips').innerHTML = !ext ? stats.map(({ k, c, n, f, off }) => `<button class="chip${off}" data-cat="${k}" style="--c:${c.color};--p:${n ? (f / n) * 100 : 0}%">
      ${badge(k)}<span>${t('cat.' + k)}</span><small>${f}/${n}</small><b></b></button>`).join('') : groupedChips();
  const hx = ext && extHeat.length;
  $('#heat-chips').classList.toggle('grid2', !hx);
  if (hx) { // importierte Heatmaps: je Gruppe aufklappbar, eine Auswahl
    const by = {}; extHeat.forEach((h, i) => (by[h.label] ||= []).push([h, i]));
    $('#heat-chips').innerHTML = Object.entries(by).map(([lb, hs]) => `<section class="grp"><div class="grp-head">
      <button class="grp-t" data-fold="${esc(lb)}"><span>${esc(lb)}</span><i class="chev${heatOpen.has(lb) ? ' open' : ''}"></i></button></div>
      ${heatOpen.has(lb) ? `<div class="grid2">${hs.map(([h, i]) => `<button class="hchip${h.label + '|' + h.title === heatSel ? ' on' : ''}" data-hs="${i}">${esc(h.title)}</button>`).join('')}</div>` : ''}</section>`).join('');
  } else $('#heat-chips').innerHTML = stats.filter((x) => x.n).map(({ k, c, n }) => `<button class="chip${heatCats.has(k) ? '' : ' off'}" data-heat="${k}" style="--c:${c.color}">
      ${badge(k)}<span>${t('cat.' + k)}</span><small>${n}</small></button>`).join('');
  heat.redraw();
  // Schnellfilter: Kategorien mit Einträgen zuerst
  $('#quick').innerHTML = [...stats].sort((a, b) => (b.n > 0) - (a.n > 0)).map(({ k, c, n, f, off }) =>
    `<button class="qchip${off}${n ? '' : ' empty'}" data-cat="${k}" style="--c:${c.color};--p:${n ? (f / n) * 100 : 0}%">${badge(k)}${t('cat.' + k)}<small>${f}/${n}</small><b></b></button>`).join('');
  $('#btn-filter').classList.toggle('on', hidden.size > 0 || hiddenG.size > 0 || hideFound || hideOpen || pois.some((p) => hiddenSrc.has(p.src)));
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
  if (hideFound || hideOpen) render(); else renderChips();
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
  const d = e.target.closest('[data-cat],[data-fold],[data-grp],[data-g]')?.dataset; if (!d) return;
  if (d.fold) { // Gruppe auf-/zuklappen
    collapsed.has(d.fold) ? collapsed.delete(d.fold) : collapsed.add(d.fold);
    store.set('collapsed', [...collapsed]); return renderChips();
  }
  if (d.grp) { // Bereich oder Gruppe zeigen/verbergen
    const ps = active().filter((p) => { const g = grpOf(p); return d.k === 'sec:' + g.s || d.k === 'grp:' + g.k; });
    if (d.grp === 'show') { ps.forEach((p) => unhideCat(p.cat)); ps.forEach((p) => hiddenG.delete(subKey(p))); } else ps.forEach((p) => hiddenG.add(subKey(p)));
  } else if (d.g) {
    unhideCat(active().find((p) => subKey(p) === d.g)?.cat);
    hiddenG.has(d.g) ? hiddenG.delete(d.g) : hiddenG.add(d.g);
  }
  else hidden.has(d.cat) ? hidden.delete(d.cat) : hidden.add(d.cat);
  store.set('hiddenCats', [...hidden]); store.set('hiddenG', [...hiddenG]); render();
};
$('#state').onclick = (e) => {
  const k = e.target.closest('[data-state]')?.dataset.state; if (!k) return;
  if (k === 'found') store.set('hideFound', (hideFound = !hideFound)); else store.set('hideOpen', (hideOpen = !hideOpen));
  $('#hide-found').checked = hideFound; render();
};
document.querySelectorAll('[data-all]').forEach((b) => (b.onclick = () => {
  hidden.clear(); hiddenG.clear(); store.set('hiddenG', []); if (b.dataset.all === 'hide') Object.keys(CATEGORIES).forEach((k) => hidden.add(k));
  store.set('hiddenCats', [...hidden]); render();
}));
$('#heat-chips').onclick = (e) => {
  const fo = e.target.closest('[data-fold]')?.dataset.fold, hs = e.target.closest('[data-hs]')?.dataset.hs;
  if (fo != null) { heatOpen.has(fo) ? heatOpen.delete(fo) : heatOpen.add(fo); store.set('heatOpen', [...heatOpen]); return renderChips(); }
  if (hs != null) { const h = extHeat[hs], k = h.label + '|' + h.title; store.set('heatSel', (heatSel = heatSel === k ? '' : k)); return renderChips(); }
  const k = e.target.closest('[data-heat]')?.dataset.heat; if (!k) return;
  heatCats.has(k) ? heatCats.delete(k) : heatCats.add(k);
  store.set('heatCats', [...heatCats]); renderChips();
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
  const ps = Array.isArray(l) ? l : l?.pois, hm = Array.isArray(l?.heatmaps) ? l.heatmaps : null;
  if (!Array.isArray(ps) || !ps.some((p) => p && p.id && Number.isFinite(p.x) && Number.isFinite(p.y))) { alert(t('ownInvalid')); return; }
  await ownDB('readwrite', (s) => s.put(ps, 'pois'));
  await ownDB('readwrite', (s) => (hm ? s.put(hm, 'heat') : s.delete('heat')));
  location.reload();
};
$('#btn-import-del').onclick = async () => {
  if (!confirm(t('ownDelConfirm'))) return;
  await ownDB('readwrite', (s) => s.delete('pois'));
  await ownDB('readwrite', (s) => s.delete('heat'));
  location.reload();
};

// ---------- Daten laden ----------
Promise.all([...DATA_FILES.map((f) => fetch(f).then((r) => (r.ok ? r.json() : [])).catch(() => [])),
  ownGet().then((l) => { ownCount = l.length; showOwn(); return l; }),
  ownDB('readonly', (s) => s.get('heat')).then((l) => l || []).catch(() => [])])
  .then((lists) => {
    extHeat = lists.pop();
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
