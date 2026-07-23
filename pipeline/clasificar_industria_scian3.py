"""
clasificar_industria_scian3.py — Asigna SCIAN_3 a las 316 categorías de
MAPEO_INDUSTRIA_HS (taxonomía HubSpot/LinkedIn), usando fallback Groq→Cohere→Mistral.
Tarea de bajo riesgo: categorías genéricas bien definidas, no nombres de empresa.
Resultado: JSON con {industria_hs: scian_3} para revisión antes de integrar.
"""
import sys, os, json, time
sys.path.insert(0, '.')
from integrar_groq import MAPEO_INDUSTRIA_HS
from scian_map_3d import SCIAN_2_TO_3, SCIAN_3_NOMBRE
from groq import Groq
import cohere
from mistralai import Mistral

client = Groq(api_key=os.environ.get('GROQ_API_KEY'))
cohere_client = cohere.ClientV2(api_key=os.environ.get('COHERE_API_KEY'))
mistral_client = Mistral(api_key=os.environ.get('MISTRAL_API_KEY'))

API_ACTUAL = "groq"
ERRORES_CONSECUTIVOS = 0
MAX_ERRORES_CONSECUTIVOS = 3

def switch_api():
    global API_ACTUAL
    if API_ACTUAL == "groq":
        API_ACTUAL = "cohere"; print("🔄 Switch → Cohere")
    elif API_ACTUAL == "cohere":
        API_ACTUAL = "mistral"; print("🔄 Switch → Mistral")
    else:
        raise Exception("Todas las APIs agotadas")

def llamar_api(prompt):
    if API_ACTUAL == "groq":
        r = client.chat.completions.create(model='llama-3.1-8b-instant',
            messages=[{'role':'user','content':prompt}], max_tokens=800, temperature=0.1)
        return r.choices[0].message.content.strip()
    elif API_ACTUAL == "cohere":
        r = cohere_client.chat(model='command-r', messages=[{'role':'user','content':prompt}])
        return r.message.content[0].text.strip()
    elif API_ACTUAL == "mistral":
        r = mistral_client.chat.complete(model='mistral-small-latest',
            messages=[{'role':'user','content':prompt}], max_tokens=800, temperature=0.1)
        return r.choices[0].message.content.strip()

items = list(MAPEO_INDUSTRIA_HS.items())
resultados = {}
BATCH = 10

for i in range(0, len(items), BATCH):
    lote = items[i:i+BATCH]
    bloques = []
    for idx, (nombre, scian2) in enumerate(lote):
        opciones = SCIAN_2_TO_3.get(scian2, [])
        if not opciones:
            continue
        lista_op = ", ".join([f'{c}={SCIAN_3_NOMBRE.get(c,"")}' for c in opciones])
        bloques.append(f'{idx}. Categoría: "{nombre}" (sector ya asignado: {scian2}). Opciones válidas: {lista_op}')
    if not bloques:
        continue
    prompt = f"""Para cada categoría de industria, elige el código SCIAN de 3 dígitos MÁS representativo SOLO entre sus opciones válidas listadas.
{chr(10).join(bloques)}

Responde SOLO un JSON array: [{{"id":0,"scian_3":"código"}}, ...]. Si genuinamente ninguna opción aplica bien, usa "scian_3":null. Sin texto adicional."""

    intentos = 0
    while intentos < 3:
        try:
            texto = llamar_api(prompt)
            start, end = texto.find('['), texto.rfind(']')+1
            data = json.loads(texto[start:end])
            for d in data:
                idx = d.get('id')
                if idx is not None and idx < len(lote):
                    nombre = lote[idx][0]
                    resultados[nombre] = d.get('scian_3')
            print(f"  Lote {i//BATCH+1}/{(len(items)//BATCH)+1} OK ({API_ACTUAL})")
            break
        except Exception as e:
            err = str(e).lower()
            if "429" in err or "rate" in err or "quota" in err:
                switch_api(); intentos += 1; continue
            ERRORES_CONSECUTIVOS += 1
            print(f"  ⚠️ Error lote {i//BATCH+1}: {str(e)[:100]}")
            if ERRORES_CONSECUTIVOS >= MAX_ERRORES_CONSECUTIVOS:
                switch_api(); ERRORES_CONSECUTIVOS = 0
            intentos += 1
    time.sleep(0.5)

with open('data/industria_hs_scian3.json', 'w', encoding='utf-8') as f:
    json.dump(resultados, f, ensure_ascii=False, indent=2)

con_valor = sum(1 for v in resultados.values() if v)
print(f"\n✅ {len(resultados)} categorías procesadas, {con_valor} con SCIAN_3 asignado")
print(f"   Guardado en data/industria_hs_scian3.json para revisión")
