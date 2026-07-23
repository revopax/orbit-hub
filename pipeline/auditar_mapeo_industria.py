"""
auditar_mapeo_industria.py — Reclasifica desde cero las 316 categorías de
MAPEO_INDUSTRIA_HS contra todos los sectores SCIAN_2, sin ver la asignación
actual, para detectar errores raíz. Solo reporta desacuerdos, no sobreescribe.
"""
import sys, os, json, time
sys.path.insert(0, '.')
from integrar_groq import MAPEO_INDUSTRIA_HS
from scian_map_3d import SCIAN_2_NOMBRE
from groq import Groq
import cohere
from mistralai import Mistral

client = Groq(api_key=os.environ.get('GROQ_API_KEY'))
cohere_client = cohere.ClientV2(api_key=os.environ.get('COHERE_API_KEY'))
mistral_client = Mistral(api_key=os.environ.get('MISTRAL_API_KEY'))

API_ACTUAL = "groq"
ERRORES_CONSECUTIVOS = 0

def switch_api():
    global API_ACTUAL
    if API_ACTUAL == "groq": API_ACTUAL = "cohere"; print("🔄 → Cohere")
    elif API_ACTUAL == "cohere": API_ACTUAL = "mistral"; print("🔄 → Mistral")
    else: raise Exception("APIs agotadas")

def llamar_api(prompt):
    if API_ACTUAL == "groq":
        r = client.chat.completions.create(model='llama-3.1-8b-instant',
            messages=[{'role':'user','content':prompt}], max_tokens=900, temperature=0.1)
        return r.choices[0].message.content.strip()
    elif API_ACTUAL == "cohere":
        r = cohere_client.chat(model='command-r', messages=[{'role':'user','content':prompt}])
        return r.message.content[0].text.strip()
    elif API_ACTUAL == "mistral":
        r = mistral_client.chat.complete(model='mistral-small-latest',
            messages=[{'role':'user','content':prompt}], max_tokens=900, temperature=0.1)
        return r.choices[0].message.content.strip()

lista_sectores = "\n".join([f"{c}={n}" for c,n in sorted(SCIAN_2_NOMBRE.items())])
items = list(MAPEO_INDUSTRIA_HS.items())
nuevos = {}
BATCH = 10

for i in range(0, len(items), BATCH):
    lote = items[i:i+BATCH]
    bloques = [f'{idx}. "{nombre}"' for idx, (nombre, _) in enumerate(lote)]
    prompt = f"""Sectores SCIAN_2 disponibles (código=nombre):
{lista_sectores}

Para cada categoría de industria (taxonomía HubSpot/LinkedIn), elige el código SCIAN_2 más representativo:
{chr(10).join(bloques)}

Responde SOLO JSON array: [{{"id":0,"scian_2":"código"}}, ...]. Sin texto adicional."""
    intentos = 0
    while intentos < 3:
        try:
            texto = llamar_api(prompt)
            start, end = texto.find('['), texto.rfind(']')+1
            data = json.loads(texto[start:end])
            for d in data:
                idx = d.get('id')
                if idx is not None and idx < len(lote):
                    nuevos[lote[idx][0]] = d.get('scian_2')
            print(f"  Lote {i//BATCH+1}/32 OK ({API_ACTUAL})")
            break
        except Exception as e:
            err = str(e).lower()
            if "429" in err or "rate" in err or "quota" in err:
                switch_api(); intentos += 1; continue
            ERRORES_CONSECUTIVOS += 1
            if ERRORES_CONSECUTIVOS >= 3:
                switch_api(); ERRORES_CONSECUTIVOS = 0
            intentos += 1
            print(f"  ⚠️ {str(e)[:80]}")
    time.sleep(0.5)

desacuerdos = []
for nombre, scian2_actual in MAPEO_INDUSTRIA_HS.items():
    scian2_nuevo = nuevos.get(nombre)
    if scian2_nuevo and str(scian2_nuevo) != str(scian2_actual):
        desacuerdos.append({
            'industria': nombre, 'actual': scian2_actual,
            'actual_nombre': SCIAN_2_NOMBRE.get(scian2_actual,''),
            'sugerido': scian2_nuevo,
            'sugerido_nombre': SCIAN_2_NOMBRE.get(str(scian2_nuevo),'')
        })

with open('data/auditoria_mapeo_industria.json', 'w', encoding='utf-8') as f:
    json.dump(desacuerdos, f, ensure_ascii=False, indent=2)

print(f"\n✅ {len(MAPEO_INDUSTRIA_HS)} categorías auditadas")
print(f"   Desacuerdos encontrados: {len(desacuerdos)}")
print(f"   Guardado en data/auditoria_mapeo_industria.json")
