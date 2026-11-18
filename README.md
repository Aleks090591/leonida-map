# Leonida Map – GTA VI Fan-Karte (PWA)

Statische PWA, kein Build nötig. Lokal starten:

```bash
python -m http.server 8080
```

## Daten eintragen

`data/pois.json` – Liste von Einträgen:

```json
{
  "id": "mis-001",
  "cat": "mission",
  "name": "Missionsname",
  "area": "Vice City",
  "x": 1234, "y": 567,
  "desc": "Kurzbeschreibung",
  "tags": [],
  "certainty": "confirmed",
  "source": "Eigene Verifikation im Spiel, 20.11.2026"
}
```

- `cat`: `landmark | mission | side | secret | weapon | vehicle | activity | shop`
- `certainty`: `confirmed` (im Spiel verifiziert) · `likely` · `speculation`
- `x`/`y`: Spielkoordinaten in Metern (x = Ost, y = Nord), gleiches System wie gta6map.github.io.
  Tipp: In der App einen Ort antippen zeigt dessen Koordinaten als Referenz.

Nach Datenänderungen in `sw.js` die Cache-Version nicht ändern nötig (Daten sind network-first);
nach Änderungen an App-Dateien `SHELL` hochzählen (`shell-v2`).

## Quellen / Lizenz

- Kartenkacheln (`tiles/base` = Set „dupzor,51“ / Stil Atlas, `tiles/yanis` = Set „yanis,6“ / Stil In-Game) und `data/landmarks.json`: [gta6map.github.io](https://github.com/gta6map/gta6map.github.io), Public Domain.
- `data/gtadb.json`: [gtadb.org](https://github.com/rolux/gtadb.org) and all contributors, CC BY 4.0 (konvertiert, nur Einträge mit Spielkoordinaten).
  Wird täglich automatisch per GitHub Action (`.github/workflows/update-gtadb.yml`) aktualisiert. Manuell (nicht live von gtadb.org abrufen):
  `git clone --filter=blob:none --sparse https://github.com/rolux/gtadb.org && cd gtadb.org && git sparse-checkout set map/data/6`,
  dann `python tools/convert_gtadb.py gtadb.org/map/data/6/landmarks.json data/gtadb.json`.
- Leaflet (BSD-2), Leaflet.markercluster (MIT).
- Fan-Projekt, nicht mit Rockstar Games / Take-Two verbunden. Keine Leak-Daten verwenden.
