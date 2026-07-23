"""
match_groq.py — Capa 2 de match: Groq/Llama para empresas sin match en DENUE
Versión batch: clasifica 10 empresas por llamada (~10x más eficiente en tokens)
Corre después de Jaro-Winkler, solo sobre las empresas sin match.
No modifica el pipeline existente.
"""
import pandas as pd, os, time, json, re
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
        API_ACTUAL = "cohere"
        print("🔄 [Switch] Groq agotado → cambiando a Cohere")
    elif API_ACTUAL == "cohere":
        API_ACTUAL = "mistral"
        print("🔄 [Switch] Cohere agotado → cambiando a Mistral")
    else:
        raise Exception("❌ Todas las APIs agotadas para este run")

def llamar_api(system_prompt: str, user_prompt: str) -> str:
    if API_ACTUAL == "groq":
        resp = client.chat.completions.create(
            model='llama-3.1-8b-instant',
            messages=[{'role':'system','content':system_prompt}, {'role':'user','content':user_prompt}],
            max_tokens=1024, temperature=0.1,
        )
        return resp.choices[0].message.content.strip()
    elif API_ACTUAL == "cohere":
        resp = cohere_client.chat(
            model='command-r',
            messages=[{'role':'system','content':system_prompt}, {'role':'user','content':user_prompt}],
        )
        return resp.message.content[0].text.strip()
    elif API_ACTUAL == "mistral":
        resp = mistral_client.chat.complete(
            model='mistral-small-latest',
            messages=[{'role':'system','content':system_prompt}, {'role':'user','content':user_prompt}],
            max_tokens=1024, temperature=0.1,
        )
        return resp.choices[0].message.content.strip()

SCIAN_NOMBRE = {
    '11':'Agricultura y ganadería','21':'Minería y petróleo',
    '22':'Electricidad y agua','23':'Construcción',
    '31':'Manufactura','32':'Manufactura','33':'Manufactura',
    '43':'Comercio al por mayor','46':'Comercio al por menor',
    '48':'Transportes y logística','49':'Transportes y logística',
    '51':'Telecomunicaciones y medios','52':'Servicios financieros y seguros',
    '53':'Servicios inmobiliarios','54':'Servicios profesionales y TI',
    '56':'Servicios de apoyo a negocios','61':'Servicios educativos',
    '62':'Servicios de salud','71':'Entretenimiento y esparcimiento',
    '72':'Alojamiento y restaurantes','81':'Otros servicios','93':'Gobierno',
}

PROMPT_SISTEMA_BATCH = """Eres un clasificador de empresas por sector económico mexicano (SCIAN).
Recibirás una lista de empresas numeradas. Responde ÚNICAMENTE con un JSON array con un objeto por empresa, en el mismo orden.

Formato exacto de cada objeto:
{"id": 1, "scian_2": "46", "sector": "Comercio al por menor", "confianza": 0.95}

Los códigos SCIAN válidos son:
11=Agricultura y ganadería, 21=Minería y petróleo, 22=Electricidad y agua,
23=Construcción, 31/32/33=Manufactura, 43=Comercio al por mayor,
46=Comercio al por menor, 48/49=Transportes y logística,
51=Telecomunicaciones y medios, 52=Servicios financieros y seguros,
53=Servicios inmobiliarios, 54=Servicios profesionales y TI,
56=Servicios de apoyo a negocios, 61=Servicios educativos,
62=Servicios de salud, 71=Entretenimiento y esparcimiento,
72=Alojamiento y restaurantes, 81=Otros servicios, 93=Gobierno.

Si no puedes clasificar con confianza mínima de 0.7, usa:
{"id": N, "scian_2": null, "sector": null, "confianza": 0}

Responde SOLO el array JSON, sin texto adicional."""


def clasificar_batch(empresas: list[str]) -> list[dict]:
    """
    Clasifica una lista de hasta 10 empresas en una sola llamada.
    Retorna lista de dicts con: empresa_normalizada, SCIAN_2_Groq, Industria_Groq, Confianza_Groq
    """
    # Construir prompt con empresas numeradas
    lista = "\n".join([f"{i+1}. {emp}" for i, emp in enumerate(empresas)])
    prompt = f"Clasifica estas empresas:\n{lista}"

    global ERRORES_CONSECUTIVOS
    texto = None
    for intento in range(3):
        try:
            texto = llamar_api(PROMPT_SISTEMA_BATCH, prompt)
            break
        except Exception as e:
            err_str = str(e).lower()
            es_rate_limit = "429" in err_str or "rate" in err_str or "quota" in err_str
            if es_rate_limit:
                ERRORES_CONSECUTIVOS = 0
                switch_api()
                continue
            ERRORES_CONSECUTIVOS += 1
            if ERRORES_CONSECUTIVOS >= MAX_ERRORES_CONSECUTIVOS:
                ERRORES_CONSECUTIVOS = 0
                switch_api()
                continue
            raise
    try:

        # Extraer JSON array
        start = texto.find('[')
        end   = texto.rfind(']') + 1
        if start < 0 or end <= start:
            raise ValueError(f"No se encontró JSON array en respuesta: {texto[:200]}")

        data = json.loads(texto[start:end])

        # Mapear resultados por id
        resultados = []
        id_map = {item.get('id'): item for item in data if isinstance(item, dict)}

        for i, emp in enumerate(empresas):
            item = id_map.get(i + 1, {})
            scian    = item.get('scian_2')
            sector   = item.get('sector')
            confianza = float(item.get('confianza', 0))

            resultados.append({
                'empresa_normalizada': emp,
                'SCIAN_2_Groq':   scian,
                'Industria_Groq': sector or (SCIAN_NOMBRE.get(str(scian), '') if scian else ''),
                'Confianza_Groq': confianza,
                'Fuente_Groq':    'groq_llama' if scian and confianza >= 0.7 else 'groq_sin_match',
            })

        return resultados

    except Exception as e:
        print(f"  ⚠️  Error en batch: {e}")
        # Fallback: retornar sin clasificar para este batch
        return [{
            'empresa_normalizada': emp,
            'SCIAN_2_Groq':   None,
            'Industria_Groq': '',
            'Confianza_Groq': 0,
            'Fuente_Groq':    'groq_error',
        } for emp in empresas]


def run_match_groq():
    print("=== Match Groq — Capa 2 (batch mode) ===")

    # ── Cargar empresas sin match Jaro ────────────────────────────────────
    df = pd.read_parquet('data/df_maestro.parquet')

    def es_valida(val):
        s = str(val).strip()
        if s in ['nan', 'None', '', 'NaN']: return False
        if re.match(r'^[\d\s]+$', s): return False
        return True

    sin_match = df[
        df['fuente_scian'].astype(str).isin(['nan', 'mapeo_hubspot']) |
        df['fuente_scian'].isna()
    ][['empresa_normalizada', 'Nombre de la empresa']].drop_duplicates('empresa_normalizada')

    sin_match = sin_match[sin_match['empresa_normalizada'].apply(es_valida)]
    print(f"Empresas únicas sin match Jaro: {len(sin_match):,}")

    # ── Cargar checkpoint si existe ───────────────────────────────────────
    CHECKPOINT = 'data/groq_results.parquet'
    if os.path.exists(CHECKPOINT):
        ya_procesadas = pd.read_parquet(CHECKPOINT)
        ids_ya = set(ya_procesadas['empresa_normalizada'].astype(str).tolist())
        pendientes = sin_match[~sin_match['empresa_normalizada'].isin(ids_ya)]
        print(f"Ya procesadas: {len(ya_procesadas):,} | Pendientes: {len(pendientes):,}")
    else:
        ya_procesadas = pd.DataFrame()
        pendientes = sin_match

    if len(pendientes) == 0:
        print("✅ Todo ya procesado")
        return pd.read_parquet(CHECKPOINT)

    # ── Clasificar en batches de 10 ───────────────────────────────────────
    BATCH_SIZE    = 5
    CHECKPOINT_N  = 100   # guardar cada 100 empresas procesadas

    nombres = pendientes['empresa_normalizada'].tolist()
    resultados = []
    procesadas = 0

    for i in range(0, len(nombres), BATCH_SIZE):
        batch = nombres[i:i + BATCH_SIZE]
        batch_resultados = clasificar_batch(batch)
        resultados.extend(batch_resultados)
        procesadas += len(batch)

        # Checkpoint cada CHECKPOINT_N empresas
        if procesadas % CHECKPOINT_N == 0 or procesadas == len(nombres):
            df_nuevos  = pd.DataFrame(resultados)
            combined   = pd.concat([ya_procesadas, df_nuevos], ignore_index=True) if len(ya_procesadas) > 0 else df_nuevos
            combined.to_parquet(CHECKPOINT, index=False)

            clasificados = sum(1 for r in resultados if r['SCIAN_2_Groq'])
            pct = procesadas / len(nombres) * 100
            print(f"  Checkpoint {procesadas:,}/{len(nombres):,} ({pct:.1f}%) — {clasificados} clasificados en este lote")
            time.sleep(0.5)  # pequeña pausa para no saturar rate limit

    # ── Guardar final ─────────────────────────────────────────────────────
    df_final = pd.DataFrame(resultados)
    combined  = pd.concat([ya_procesadas, df_final], ignore_index=True) if len(ya_procesadas) > 0 else df_final
    combined.to_parquet(CHECKPOINT, index=False)

    clasificados = combined['SCIAN_2_Groq'].notna().sum()
    print(f"\n✅ Completado: {len(combined):,} empresas procesadas")
    print(f"   Con SCIAN: {clasificados:,} ({clasificados/len(combined)*100:.1f}%)")
    print(f"   Sin clasificar: {len(combined)-clasificados:,}")

    # Muestra de empresas conocidas
    print("\nMuestra empresas conocidas:")
    conocidas = ['WINGSTOP', 'MC DONALDS', 'OXXO', 'WALMART', 'BIMBO',
                 'LIVERPOOL', 'COCA COLA', 'UBER', 'ELECTROLIT', 'KPMG']
    for e in conocidas:
        row = combined[combined['empresa_normalizada'] == e]
        if len(row) > 0:
            r = row.iloc[0]
            print(f"  {e} → {r['Industria_Groq']} (SCIAN {r['SCIAN_2_Groq']}, conf {r['Confianza_Groq']:.2f})")

    return combined


if __name__ == '__main__':
    run_match_groq()
