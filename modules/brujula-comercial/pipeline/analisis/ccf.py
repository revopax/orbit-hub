import numpy as np
import pandas as pd
from scipy import stats

def calcular_ccf(serie_a, serie_b, max_lag=6):
    """
    Calcula correlacion cruzada entre dos series para un rango de rezagos.
    serie_a, serie_b: pd.Series indexadas por fecha (mismo indice temporal)
    Retorna: DataFrame con lag, correlacion, p-value
    """
    resultados = []
    for k in range(-max_lag, max_lag + 1):
        if k < 0:
            a_alineada = serie_a.iloc[:k]
            b_alineada = serie_b.shift(-k).iloc[:k]
        elif k > 0:
            a_alineada = serie_a.iloc[k:]
            b_alineada = serie_b.shift(-k).iloc[k:]
        else:
            a_alineada = serie_a
            b_alineada = serie_b

        validos = a_alineada.notna() & b_alineada.notna()
        if validos.sum() < 8:
            continue

        r, p = stats.pearsonr(a_alineada[validos], b_alineada[validos])
        resultados.append({"lag": k, "correlacion": r, "p_value": p, "n_obs": validos.sum()})

    df = pd.DataFrame(resultados)
    return df.sort_values("correlacion", key=abs, ascending=False)

if __name__ == "__main__":
    print("Modulo cargado. Importa calcular_ccf(serie_a, serie_b, max_lag) desde otro script.")
