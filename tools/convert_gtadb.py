# gtadb map/data/6/landmarks.json -> data/gtadb.json (App-Schema)
import json, re, sys, datetime
src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src, encoding='utf-8'))
# gtadb-Typen -> App-Kategorie (erste passende gewinnt), sonst „Orte“
CATS = [('weapon', {'guns'}),
        ('shop', {'retail', 'supermarket', 'restaurant', 'food', 'clothes', 'hair', 'gas', 'electronics', 'shoes', 'bar', 'vendor'}),
        ('activity', {'leisure', 'events', 'tennis', 'racetrack', 'nightclub', 'stripclub'}),
        ('vehicle', {'modshop', 'transportation', 'airport', 'marina', 'train', 'bus', 'metro'})]
res = []
for lid, v in d.items():
    ig_name, ig_xy, ig_photo, rl_addr, rl_ll, rl_photo, types = v[:7]
    edited = v[8] if len(v) > 8 else []
    if len(ig_xy) != 2:
        continue
    parts = [s.strip() for s in ig_name.split(',')]
    rl_name = rl_addr.split(',')[0].strip()
    name = parts[0] if parts[0] and parts[0] != '?' else f'{rl_name} (Vorbild)'
    tags = [t.lstrip('#') for t in types if not t.startswith('//') and not re.fullmatch(r'l\d+', t)]
    res.append({
        'id': f'gtadb-{lid}', 'cat': next((c for c, ks in CATS if ks & set(tags)), 'landmark'), 'name': name,
        'area': ', '.join(p for p in parts[1:] if p and p != '?'),
        'x': round(ig_xy[0], 1), 'y': round(ig_xy[1], 1),
        'tags': tags, 'desc': f'Reales Vorbild: {rl_addr}',
        'certainty': 'speculation' if 'unconfirmed' in types else 'likely',
        'source': 'gtadb.org and contributors (CC BY 4.0)',
    })
    info = {}
    if len(rl_ll) == 2:
        info['Reale Koordinaten'] = f'{rl_ll[0]:.5f}, {rl_ll[1]:.5f}'
    photos = [k for k, ph in (('Spiel', ig_photo), ('Real', rl_photo)) if ph]
    if photos:
        info['Fotos'] = ' + '.join(photos) + ' (auf gtadb.org)'
    if edited and max(edited):
        info['Zuletzt bearbeitet'] = datetime.datetime.fromtimestamp(max(edited), datetime.timezone.utc).strftime('%d.%m.%Y')
    res[-1]['info'] = info
    res[-1]['url'] = f'https://gtadb.org/map/#VI,{lid}'
json.dump(res, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(res))
