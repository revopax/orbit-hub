#!/usr/bin/env python3
import sys, os, json, traceback
from datetime import datetime
sys.path.insert(0, os.path.dirname(__file__))

from extractors import meta_organico, google_ads, ga4, linkedin
from config import OUTPUT_DIR

def save(name: str, data: dict):
    path = os.path.join(os.path.dirname(__file__), '..', OUTPUT_DIR, f'{name}.json')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  ✓ {name}.json guardado")

EXTRACTORS = [
    ('meta_organico',     meta_organico.extract),
    ('google_ads',        google_ads.extract),
    ('ga4',               ga4.extract),
    ('linkedin_organico', linkedin.extract),
]

if __name__ == '__main__':
    start = datetime.now()
    print(f"\n🚀 Pipeline iniciado: {start.strftime('%Y-%m-%d %H:%M:%S')}\n")
    results = {}
    for name, fn in EXTRACTORS:
        try:
            print(f"→ Extrayendo {name}...")
            data = fn()
            save(name, data)
            results[name] = 'OK'
        except Exception as e:
            print(f"  ✗ Error en {name}: {e}")
            traceback.print_exc()
            results[name] = f'ERROR: {e}'

    meta_info = {
        'updated_at': datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ'),
        'duration_s': round((datetime.now()-start).total_seconds(), 1),
        'status': results
    }
    save('_meta', meta_info)
    print(f"\n✅ Pipeline completo en {meta_info['duration_s']}s")
    print(f"   Status: {results}")
