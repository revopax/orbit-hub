# ============================================================
# MOTOR 2 — Temporalidad: Z-score sectorial × IGAE
# ============================================================
import pandas as pd
import numpy as np
from config import IGAE_SECTOR_COLS, ZSCORE_VENTANA_MESES, Z_CALIENTE, Z_TEMPLADO, Z_TIBIO


def temperatura(z: float) -> str:
    if z >= Z_CALIENTE:
        return "caliente"
    elif z >= Z_TEMPLADO:
        return "templado"
    elif z >= Z_TIBIO:
        return "tibio"
    return "frio"


def wide_to_long(df_igae_raw: pd.DataFrame) -> pd.DataFrame:
    """
    Convierte el IGAE de formato wide (sectores como columnas)
    a formato long (fecha, sector, valor_indice).
    Asume fila 0 = encabezados de sector, columna 0 = fechas.
    """
    df = df_igae_raw.copy()

    # Primera columna = fechas
    df.columns = ['fecha'] + list(df.columns[1:])
    df = df[df['fecha'].notna()].copy()

    # Intentar parsear fechas
    df['fecha'] = pd.to_datetime(df['fecha'], errors='coerce')
    df = df[df['fecha'].notna()].copy()
    df = df.sort_values('fecha').reset_index(drop=True)

    # Pivot wide → long
    df_long = df.melt(id_vars='fecha', var_name='sector_igae', value_name='valor_indice')
    df_long['valor_indice'] = pd.to_numeric(df_long['valor_indice'], errors='coerce')
    df_long = df_long[df_long['valor_indice'].notna()].copy()

    return df_long


def calcular_zscore(df_long: pd.DataFrame, ventana: int = ZSCORE_VENTANA_MESES) -> pd.DataFrame:
    """
    Calcula Z-score estacional por sector sobre VARIACION INTERANUAL (YoY).

    En lugar de comparar el nivel absoluto del IGAE (que crece estructuralmente
    desde 1993), calcula la variacion porcentual de cada mes vs el mismo mes
    del anio anterior. Luego aplica z-score sobre esa variacion YoY comparada
    contra el promedio historico del mismo mes.

    Esto detecta si el sector esta acelerando o frenando vs su patron tipico,
    independientemente del crecimiento estructural del indice.
    """
    df = df_long.sort_values(['sector_igae', 'fecha']).copy()

    # Paso 1: Variacion interanual YoY — cada mes vs mismo mes anio anterior
    df['valor_lag12'] = df.groupby('sector_igae')['valor_indice'].shift(12)
    df['variacion_yoy'] = (
        (df['valor_indice'] - df['valor_lag12']) / df['valor_lag12'].replace(0, np.nan)
    ) * 100

    # Eliminar filas sin variacion (primeros 12 meses)
    df = df[df['variacion_yoy'].notna()].copy()

    # Paso 2: Z-score sobre la variacion YoY agrupando por mes
    df['mes'] = df['fecha'].dt.month

    df['media_yoy'] = (
        df.groupby(['sector_igae', 'mes'])['variacion_yoy']
        .transform(lambda x: x.expanding().mean().shift(1))
    )
    df['std_yoy'] = (
        df.groupby(['sector_igae', 'mes'])['variacion_yoy']
        .transform(lambda x: x.expanding().std().shift(1))
    )

    # Z-score estacional sobre variacion interanual
    df['z_score'] = (
        (df['variacion_yoy'] - df['media_yoy'])
        / df['std_yoy'].replace(0, np.nan)
    )

    df['temperatura'] = df['z_score'].apply(
        lambda z: temperatura(z) if pd.notna(z) else 'frio'
    )

    # Limpiar columnas auxiliares
    df = df.drop(columns=['valor_lag12', 'variacion_yoy', 'mes', 'media_yoy', 'std_yoy'])
    return df



def build_df_brujula(df_maestro: pd.DataFrame, df_igae_long: pd.DataFrame) -> pd.DataFrame:
    """
    Cruza df_maestro (leads con SCIAN) con Z-scores IGAE.
    Devuelve df_brujula con temperatura económica por lead.
    """
    from config import IGAE_SECTOR_COLS

    # Fecha más reciente del IGAE
    fecha_max = df_igae_long['fecha'].max()
    df_actual = df_igae_long[df_igae_long['fecha'] == fecha_max].copy()

    # Mapear SCIAN_2 → columna IGAE
    scian_to_igae = {k: v for k, v in IGAE_SECTOR_COLS.items()}

    df_maestro['sector_igae'] = df_maestro['SCIAN_2'].map(scian_to_igae)

    df_brujula = df_maestro.merge(
        df_actual[['sector_igae', 'z_score', 'temperatura']],
        on='sector_igae',
        how='left'
    )

    print(f"✅ df_brujula: {len(df_brujula):,} leads con temperatura asignada")
    print(df_brujula['temperatura'].value_counts().to_string())
    return df_brujula
