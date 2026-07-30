import sys, os, json, time, requests
from datetime import datetime, timedelta
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://szxdvdbdyuxtvyvxbder.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "").strip()
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
STORAGE_BUCKET = "meta-organico-media"

def guardar_imagen_permanente(url_original, post_id):
    """Descarga la imagen/thumbnail de Meta (URL efimera) y la sube a Supabase Storage,
    devolviendo una URL publica permanente. Si falla por cualquier motivo, devuelve la
    URL original como fallback (mejor tener algo que nada)."""
    if not url_original or not SUPABASE_SERVICE_KEY:
        return url_original
    try:
        img_res = requests.get(url_original, timeout=15)
        if img_res.status_code != 200 or not img_res.content:
            return url_original
        ext = "jpg"
        ctype = img_res.headers.get("Content-Type", "")
        if "png" in ctype: ext = "png"
        elif "webp" in ctype: ext = "webp"
        path = f"{post_id}.{ext}"
        upload_res = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{path}",
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": ctype or "image/jpeg",
                "x-upsert": "true",
            },
            data=img_res.content, timeout=20,
        )
        if upload_res.status_code not in (200, 201):
            print(f"    ⚠ Storage upload {upload_res.status_code} para {post_id}: {upload_res.text[:150]}")
            return url_original
        return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{path}"
    except Exception as e:
        print(f"    ⚠ Error guardando imagen de {post_id}: {e}")
        return url_original
SINCE_TS     = int((datetime.now() - timedelta(days=90)).timestamp())
HOY_STR      = datetime.now().strftime('%Y-%m-%d')
AHORA        = datetime.now().strftime("%Y-%m-%d %H:%M")

UDNS_CONFIG = {
    "House Of Films":     {"fb_id": "600701999785607",    "ig_id": "17841446097316934"},
    "Mexa Creativa":      {"fb_id": "1500536133517681",   "ig_id": "17841405864361847"},
    "Marketing United":   {"fb_id": "211347865404615",    "ig_id": "17841465874451689"},
    "UiX":                {"fb_id": "365616193308659",    "ig_id": "17841468263149234"},
    "Promo Espacio":      {"fb_id": "942164235841805",    "ig_id": "17841403851474396"},
    "Neracode":           {"fb_id": "252802424590518",    "ig_id": "17841466265864678"},
    "UPAX":               {"fb_id": "611795289002985",    "ig_id": "17841445586251068"},
    "ResearchLand":       {"fb_id": "122096593202008220", "ig_id": "17841461562401752"},
    "Zeus":               {"fb_id": "121822287490124",    "ig_id": "17841458683737065"},
    "Cecilia Fallabrino": {"fb_id": "611012308764158",    "ig_id": "17841401104425234"},
}

def sb_upsert(table, rows, on_conflict):
    if not rows or not SUPABASE_KEY:
        return
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
                 "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"},
        params={"on_conflict": on_conflict}, json=rows, timeout=30
    )
    if r.status_code not in (200, 201):
        print(f"  ⚠ Supabase {r.status_code}: {r.text[:200]}")

def identificar_tipo(item, plataforma, sub=""):
    tipo, img = "Otro", ""
    if plataforma == "Instagram":
        m = str(item.get('media_type', '')).upper()
        p = str(item.get('media_product_type', '')).upper()
        img = item.get('thumbnail_url') or item.get('media_url', '')
        if sub == "stories" or p == "STORY": tipo = "Historia"
        elif p == "REELS" or "REEL" in m:    tipo = "Reel"
        elif m == "VIDEO":                    tipo = "Video"
        elif m == "CAROUSEL_ALBUM":           tipo = "Carrusel"
        elif m == "IMAGE":                    tipo = "Foto"
    elif plataforma == "Facebook":
        s   = str(item.get('status_type', '')).upper()
        img = item.get('full_picture', '')
        att  = item.get('attachments', {}).get('data', [{}])[0]
        turl = str(att.get('target', {}).get('url', '')).lower()
        if "reel" in turl:                                               tipo = "Reel"
        elif s in ["ADDED_VIDEO", "VIDEO_SHARE"]:                        tipo = "Video"
        elif s in ["ADDED_PHOTOS", "MOBILE_STATUS_UPDATE", "WALL_POST"]: tipo = "Foto"
        elif "album" in turl:                                             tipo = "Carrusel"
        else:                                                             tipo = "Post (Texto)"
    return tipo, img

def get_page_tokens():
    raw = os.environ.get("META_PAGE_TOKENS", "")
    if not raw:
        local = os.path.join(os.path.dirname(__file__), '..', 'meta_page_tokens.json')
        if os.path.exists(local): raw = open(local).read()
    return {p["page_id"]: p["token"] for p in json.loads(raw)["pages"]}

def extract():
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

        # Seguidores FB
        r = requests.get(f"https://graph.facebook.com/v21.0/{fb_id}",
            params={"access_token": token, "fields": "fan_count"}, timeout=15).json()
        if 'fan_count' in r:
            sb_upsert("meta_organico_seguidores",
                [{"fecha": HOY_STR, "fuente": "Facebook", "udn": udn,
                  "seguidores": r['fan_count'], "audit_date": AHORA}],
                "fecha,fuente,udn")

        # Seguidores IG
        if ig_id:
            r = requests.get(f"https://graph.facebook.com/v21.0/{ig_id}",
                params={"access_token": token, "fields": "followers_count"}, timeout=15).json()
            if 'followers_count' in r:
                sb_upsert("meta_organico_seguidores",
                    [{"fecha": HOY_STR, "fuente": "Instagram", "udn": udn,
                      "seguidores": r['followers_count'], "audit_date": AHORA}],
                    "fecha,fuente,udn")

        # FB Posts
        url, params = f"https://graph.facebook.com/v21.0/{fb_id}/posts", {
            "access_token": token, "since": SINCE_TS,
            "fields": "id,created_time,message,status_type,attachments{target},"
                      "reactions.summary(total_count),comments.summary(total_count),"
                      "shares,insights.metric(post_impressions_unique,post_video_views),full_picture",
            "limit": 100
        }
        while url:
            res = requests.get(url, params=params, timeout=20).json()
            for p in res.get('data', []):
                tipo, img = identificar_tipo(p, "Facebook")
                alc, views = 0, 0
                for m in p.get('insights', {}).get('data', []):
                    if m['name'] == 'post_impressions_unique': alc   = m['values'][0]['value']
                    if m['name'] == 'post_video_views':        views = m['values'][0]['value']
                reac = p.get('reactions', {}).get('summary', {}).get('total_count', 0)
                comm = p.get('comments',  {}).get('summary', {}).get('total_count', 0)
                shar = p.get('shares',    {}).get('count', 0)
                img = guardar_imagen_permanente(img, p['id'])
                rows.append({"fecha": p['created_time'][:10], "fuente": "Facebook", "udn": udn,
                    "post_id": p['id'], "mensaje": (p.get('message','') or '')[:200].replace('\n',' '),
                    "tipo": tipo, "impresiones_views": views, "alcance": alc,
                    "reacciones": reac, "comentarios": comm, "compartidos": shar,
                    "interacciones": reac + comm + shar,
                    "link_imagen": img, "link_post": f"https://www.facebook.com/{p['id']}",
                    "audit_date": AHORA})
            url, params = res.get('paging', {}).get('next'), {}

        # IG Media + Stories
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
                    res = requests.get(url, params=params, timeout=20).json()
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
                        img = guardar_imagen_permanente(img, m['id'])
                        rows.append({"fecha": m['timestamp'][:10], "fuente": "Instagram", "udn": udn,
                            "post_id": m['id'],
                            "mensaje": (m.get('caption','') or 'Sin texto')[:200].replace('\n',' '),
                            "tipo": tipo, "impresiones_views": views, "alcance": reach,
                            "reacciones": likes, "comentarios": comms, "compartidos": saved,
                            "interacciones": likes + comms + saved,
                            "link_imagen": img, "link_post": m.get('permalink',''),
                            "audit_date": AHORA})
                    url, params = res.get('paging', {}).get('next'), {}

        for i in range(0, len(rows), 200):
            sb_upsert("meta_organico_posts", rows[i:i+200], "post_id")
        total_posts += len(rows)
        print(f"    ✓ {len(rows)} posts")
        time.sleep(3)

    print(f"[META Org] ✅ {total_posts} posts totales")
    return {"total_posts": total_posts, "fecha": HOY_STR}
