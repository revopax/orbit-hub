#!/usr/bin/env python3
"""Carga histórica desde 2025-01-01 — ejecutar UNA sola vez."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime
from extractors.meta_organico import UDNS_CONFIG, identificar_tipo, sb_upsert, get_page_tokens
import requests, time, json

SINCE_TS = int(datetime(2025, 1, 1).timestamp())
HOY_STR  = datetime.now().strftime('%Y-%m-%d')
AHORA    = datetime.now().strftime("%Y-%m-%d %H:%M")

def load_history():
    token_map   = get_page_tokens()
    total_posts = 0

    for udn, cfg in UDNS_CONFIG.items():
        fb_id = cfg["fb_id"]
        ig_id = cfg.get("ig_id")
        token = token_map.get(fb_id)
        if not token:
            print(f"  ⚠ Sin token para {udn}")
            continue

        print(f"  → {udn}")
        rows = []

        # FB Posts desde 2025-01-01
        url, params = f"https://graph.facebook.com/v21.0/{fb_id}/posts", {
            "access_token": token, "since": SINCE_TS,
            "fields": "id,created_time,message,status_type,attachments{target},"
                      "reactions.summary(total_count),comments.summary(total_count),"
                      "shares,insights.metric(post_impressions_unique,post_video_views),full_picture",
            "limit": 100
        }
        while url:
            res = requests.get(url, params=params, timeout=30).json()
            for p in res.get('data', []):
                tipo, img = identificar_tipo(p, "Facebook")
                alc, views = 0, 0
                for m in p.get('insights', {}).get('data', []):
                    if m['name'] == 'post_impressions_unique': alc   = m['values'][0]['value']
                    if m['name'] == 'post_video_views':        views = m['values'][0]['value']
                reac = p.get('reactions', {}).get('summary', {}).get('total_count', 0)
                comm = p.get('comments',  {}).get('summary', {}).get('total_count', 0)
                shar = p.get('shares',    {}).get('count', 0)
                rows.append({"fecha": p['created_time'][:10], "fuente": "Facebook", "udn": udn,
                    "post_id": p['id'], "mensaje": (p.get('message','') or '')[:200].replace('\n',' '),
                    "tipo": tipo, "impresiones_views": views, "alcance": alc,
                    "reacciones": reac, "comentarios": comm, "compartidos": shar,
                    "interacciones": reac+comm+shar,
                    "link_imagen": img, "link_post": f"https://www.facebook.com/{p['id']}",
                    "audit_date": AHORA})
            url, params = res.get('paging', {}).get('next'), {}

        # IG Media + Stories desde 2025-01-01
        if ig_id:
            for ep in ["media", "stories"]:
                url, params = f"https://graph.facebook.com/v21.0/{ig_id}/{ep}", {
                    "access_token": token, "since": SINCE_TS,
                    "fields": "id,timestamp,caption,media_type,media_product_type,"
                              "media_url,thumbnail_url,permalink,like_count,comments_count,"
                              "insights.metric(views,reach,saved)",
                    "limit": 100
                }
                while url:
                    res = requests.get(url, params=params, timeout=30).json()
                    for m in res.get('data', []):
                        reach, views, saved = 0, 0, 0
                        for ins in m.get('insights', {}).get('data', []):
                            v = ins['values'][0]['value']
                            if ins['name'] == 'reach':  reach = v
                            if ins['name'] == 'views':  views = v
                            if ins['name'] == 'saved':  saved = v
                        tipo, img = identificar_tipo(m, "Instagram", ep)
                        likes = m.get('like_count', 0)
                        comms = m.get('comments_count', 0)
                        rows.append({"fecha": m['timestamp'][:10], "fuente": "Instagram", "udn": udn,
                            "post_id": m['id'],
                            "mensaje": (m.get('caption','') or 'Sin texto')[:200].replace('\n',' '),
                            "tipo": tipo, "impresiones_views": views, "alcance": reach,
                            "reacciones": likes, "comentarios": comms, "compartidos": saved,
                            "interacciones": likes+comms+saved,
                            "link_imagen": img, "link_post": m.get('permalink',''),
                            "audit_date": AHORA})
                    url, params = res.get('paging', {}).get('next'), {}

        for i in range(0, len(rows), 200):
            sb_upsert("meta_organico_posts", rows[i:i+200], "post_id")
        total_posts += len(rows)
        print(f"    ✓ {len(rows)} posts históricos → Supabase")
        time.sleep(5)

    print(f"\n✅ Carga histórica completa: {total_posts} posts desde 2025-01-01")

if __name__ == '__main__':
    load_history()
