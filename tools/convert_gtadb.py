# gtadb map/data/6/landmarks.json -> data/gtadb.json (App-Schema)
import json, re, sys
src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src, encoding='utf-8'))
res = []
for lid, v in d.items():
    ig_name, ig_xy, _, rl_addr, _, _, types = v[:7]
    if len(ig_xy) != 2:
        continue
    parts = [s.strip() for s in ig_name.split(',')]
    rl_name = rl_addr.split(',')[0].strip()
    name = parts[0] if parts[0] and parts[0] != '?' else f'{rl_name} (Vorbild)'
    tags = [t.lstrip('#') for t in types if not t.startswith('//') and not re.fullmatch(r'l\d+', t)]
    res.append({
        'id': f'gtadb-{lid}', 'cat': 'landmark', 'name': name,
        'area': ', '.join(p for p in parts[1:] if p and p != '?'),
        'x': round(ig_xy[0], 1), 'y': round(ig_xy[1], 1),
        'tags': tags, 'desc': f'Reales Vorbild: {rl_addr}',
        'certainty': 'speculation' if 'unconfirmed' in types else 'likely',
        'source': 'gtadb.org and contributors (CC BY 4.0)',
    })
json.dump(res, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(res))
